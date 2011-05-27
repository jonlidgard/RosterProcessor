/*globals YAHOO */

/*jslint white: false, devel: true */

YAHOO.rp.BaFcParser = function(theRoster) {

//    var constants = rp.constants;

    // Error messages
    this.errorMsg = {
        MSG_ROSTER_DATE_LINE : "Unexpected Roster date line",
        MSG_ROSTER_TYPE_LINE : "Unexpected Roster type line",
        MSG_CREW_INFO_LINE : "Unexpected Crew info' line",
        MSG_BLK_LINE : "Unexpected BLK hh.nn line",
        MSG_DAY_DUTY_FS_LINE : "Unexpected Day Duty F L I G H T  S E Q U E N C E line",
        MSG_ANY_OTHER_LINE : "Unrecognised line",
        MSG_TRIP_CREW_LINE : "Unexpected Trip: Crew Names: line",
        MSG_CREW_LINE : "Unexpected Crew names line",
        MSG_DUTY_LINE : "Unexpected Duty line",
        MSG_DATES_LINE : "Unexpected (01) 02  03.. line"
   };

    this.matches = {
        rosterDateLine : /([0-3][0-9])([A-Z]{3})-([0-3][0-9])([A-Z]{3}) (\d{4})\s+([0-3][0-9])\/([0-9][0-9])\/([0-9][0-9])\s+([0-2][0-9]):([0-5][0-9])\s*$/,
        // LIDDJ818995FINAL
        rosterType :/^\s*([A-Z]{5})\s*(\d{6})\s*(FINAL|ACHIEVED|ACHEIVED)/,
        //.*(\d{3})\s*([A-Z]{3})\s*([A-Z]{3,8})\s*(\d{4})\s+([0-3][0-9])([A-Z]{3})-([0-3][0-9])([A-Z]{3}) (\d{4})\s+([0-3][0-9])\/([0-9][0-9])\/([0-9][0-9])\s+([0-2][0-9]):([0-5][0-9])\s*$/, // TO-CHECK
        //  'LIDDJ818995 CA LGW sen 1308 737
        //	  [1]  [2]  [3] [4]     [5]  [6]
        crewInfoLine : /^\s*([A-Z]{5})\s*(\d{6})\s*(CA|FO).+(LGW|LHR).+(\d{4})\s+(\d{3}).*$/,
        // BLK. 79.45
        //        matchBLKLine = /^.*BLK\.*\s+(\d{0,3})\.(\d{2}).*$/,
        blkLine : /BLK\.\s*(\d{0,3}.\d\d)\s*$/,
        // DAY DUTY F L I G H T  S E Q U E N C E
        dayDutyFSLine : /^\s*DAY\s+DUTY\s+F[LIGHTSEQUNC ]+$/,
        // Trip: Crew
        tripCrewLine : /^\s*Trip:?\s+Crew.*$/,
        // 1234 01 Firstname Lastname.
        crewNamesLine : /^\s*(\d{4})\/(\d{2})(\s+([A-Za-z]+)\s+([A-Za-z]+)\.?)+\s*$/,
        dashedLine : /^-+$/,
        multiDayLine : /^ *([ \d| ]\d)-([ \d| ]\d) (.*)$/,
        flyingDutyLine : /^ *(\d{1,2}) (MO|TU|WE|TH|FR|SA|SU) (\d{4})(.*$)/,
        gndDutyLine : /^ *(\d{1,2}) (MO|TU|WE|TH|FR|SA|SU) \s+(.*)$/,
	beginEnd : /BEGIN\s*(\d{4})\s+END\s*(\d{4})/,
	flightSector : / ([A-Z]{3}) (\d{4} )?(\d{4} )([A-Z]{3}) (\d{4})(.*)/,
	tripLine : /^([ \d]\d{3}) (.+)$/,
        monthDateLine : /^\s*\(01\) 02 {2}03/,
        tripSummaryLine : /\d{4}/
    };

    this.states = { lookingForMetaDataState: new YAHOO.rp.BaFcStateMaker.factory('LookingForMetaDataState',this),
		    buildingSummaryState: new YAHOO.rp.BaFcStateMaker.factory('BuildingSummaryState',this),
		    getGndDutiesState: new YAHOO.rp.BaFcStateMaker.factory('GetGndDutiesState',this),
		    inACarryInTripState: new YAHOO.rp.BaFcStateMaker.factory('InACarryInTripState',this),
		    lookingForTripState: new YAHOO.rp.BaFcStateMaker.factory('LookingForTripState',this),
		    inATripState: new YAHOO.rp.BaFcStateMaker.factory('InATripState',this),
		    inAFlyingDutyState: new YAHOO.rp.BaFcStateMaker.factory('InAFlyingDutyState',this),
		    getCrewNamesState: new YAHOO.rp.BaFcStateMaker.factory('GetCrewNamesState',this)};

/*    this.lookingForMetaDataState = new YAHOO.rp.BaFcStateMaker.factory('LookingForMetaDataState',this);
    this.buildingSummaryState = new YAHOO.rp.BaFcStateMaker.factory('LookingForGndDutyState',this);
    this.lookingForGndDutyState = new YAHOO.rp.BaFcStateMaker.factory('LookingForGndDutyState',this);
    this.lookingForFlyingDutyState = new YAHOO.rp.BaFcStateMaker.factory('LookingForFlyingDutyState',this);
    this.inAFlyingDutyState = new YAHOO.rp.BaFcStateMaker.factory('InAFlyingDutyState',this);
    this.inACarryInTripState = new YAHOO.rp.BaFcStateMaker.factory('InACarryInTripState',this);
    this.lookingForCrewLineState = new YAHOO.rp.BaFcStateMaker.factory('LookingForCrewLineState',this);
 */    this.lineTypeEnum = {
        unrecognised : 0,
        rosterDateLine : 1,
        crewInfoLine : 2,
        blkLine : 3,
	datesLine : 4,
        dayDutyFSLine : 5,
        gndDuty : 6,
        multiDay : 7,
        flyingDuty : 8,
        simDuty : 9,
        crewLine : 10,
        rosterType : 11,
        tripCrewLine : 12,
	multiRestDay : 13,
	restDay : 14
    };
    this.eventCollection = new YAHOO.rp.EventCollection();
    this.roster = theRoster;
    this.dutyDate = new Date(); // RPDate.Create ??
    this.lastDutyDate = undefined;
    this.prevClearTime = undefined;
    this.line = '';
    this.lineNo = 0;
    this.state = undefined;
    this.ignoreUnrecognisedLines = false;
    this.strictChecking = true; // extra validation checks
    this.lineType = this.lineTypeEnum.unrecognised;
    this.matchedFields = undefined;
    this.hasCarryInTrip = false;
    this.dayDutyFSBookmark = 0;
    this.currentTrip = undefined;

    this.decodeError = function(errorMessage) {
        console.log(this.state.name);
        throw new Error(errorMessage + " found - line " + this.lineNo);
    };


    this.checkDate = function (shortDay, rosterDate) {
	var dayOfWeek,
	    c = YAHOO.rp.constants;

	dayOfWeek = shortDay.trim().toUpperCase();
	return (dayOfWeek === c.DAYSOFWEEK[rosterDate.getDay()]);
    };
    //--------------------------------------------------------------------------

    this.setDutyTimes = function(line, duty) {
	var wholeDay = true,
	    f;

	// Search line for 'BEGIN hhmm END hhmm'
	if ((f = this.matches.beginEnd.exec(line)) !== null) {
	    wholeDay = (f[1] === '0001' && f[2] === '2400') ? true : false;
	}
	// line was 'BEGIN 0001 END 2400' or does not contain a BEGIN END
	if (wholeDay === true) {
	    duty.start.setTime('0000');
	    duty.end.setTime('0000');
	    duty.end.incDate();
	    console.log("WholeDay!");
	}
	// line contained a BEGIN hhmm END hhmm but not BEGIN 0001 END 2400
	else {
	    duty.start.setTime(f[1]);
	    duty.end.setTime(f[2]);
	}

	if (duty.end.valueOf() < duty.start.valueOf()) {
	    duty.end.incDate();
	}
    };

    this.formatSummaryandDescription = function (e) {

//	line = line.replace(/^\s+|\s+$/g,"");
//       line = line.replace(/\s+/g," ");
       e.summary = e.summary.replace(/\s+BEGIN 0001 END 2400/," DAY");
       e.summary = e.summary.replace(/\s+BEGIN (\d{4}) END (\d{4})/," $1Z $2Z");

    };

    //  ------mergeDuties-------------------------------------------------
    /* This function will for example merge individual WR day lines into one WR event covering multiple days*/
    this.mergeEvents = function (e) {
	var thisEvent,
	    prevEvent;

	e.rewind();
	if (e.hasNext()) {
	    thisEvent = e.pop();
	}
	else {
	    return;
	}

	if (e.hasNext()) {
	    prevEvent = e.pop();
	}
	else {
            e.push(thisEvent);
	    return;
	}

        if ( prevEvent.summary === thisEvent.summary && prevEvent.isWholeDay() && thisEvent.isWholeDay() ) {
            prevEvent.end.setDate(thisEvent.end.valueOf());
            e.push(prevEvent);
        }
        else {
	    e.push(prevEvent);
            e.push(thisEvent);
        }
    };
    //  ------/mergeDuties-------------------------------------------------
/*
    this.populateEvent = function (e) {

    };
*/
    this.addEvent = function (fields) {

//	var e = this.eventCollection.events.newEvent(),
	var e = YAHOO.rp.eventMaker.factory('GroundDuty',this.baseDate),
	    d,
	    u = YAHOO.rp.utils;

	e.summary = this.matchedFields[fields.summary];
	e.description = this.line;
        e.start.setDayOfMonth(this.matchedFields[fields.startDay]);
        e.end.setDayOfMonth(this.matchedFields[fields.endDay]);

//??? Need to check this code block
	if (typeof fields.dayOfWeekField !== 'undefined' &&
	    !this.checkDate(this.matchedFields[fields.dayOfWeek], e.start.date() )) {
	    // Failed to match Date so try next month
	    d = new Date(this.baseDate.valueOf());
	    d = u.incUTCMonth(d);
	    if (!this.checkDate(this.matchedFields[fields.dayOfWeekField], d)) {
		throw new Error({name: 'RosterProcessor Error',
				message: 'Incorrect day of week for date on line ' + this.lineNo});
	    }
	    else {
		this.baseDate = u.incUTCMonth(this.baseDate);
		e.start.incDate();
	    }
	}

	this.setDutyTimes(this.line, e);
	this.formatSummaryandDescription(e);

	this.eventCollection.events.add(e);
	this.mergeEvents(this.eventCollection.events);
	e.print();
	return e;
   };
/*
    this.isLessThanMinRest = function (e) {

	var lessThanMinRest = false,
	    restPeriod,
	    clearTime,
	    reportTime,
	    prevDuty,
	    c = YAHOO.rp.constants;

	if( roster.events.size() > 1) {
            prevDuty = roster.events.peek();
            clearTime = prevDuty.getEndDate();
            reportTime = thisDuty.getStartDate();

            restPeriod = clearTime.valueOf() - reportTime.valueOf();

            lessThanMinRest = ( restPeriod <  c.MINREST ) ? true : false;
        }
	return lessThanMinRest;
    }
*/

    /**
     * Sets the lineType & returns true if a line matches ddmmm-ddmmm yyyy mm/dd/yy hh:mm
     * @returns {boolean} true if line matches
     *
     */
    this.testForRosterDateLine = function() {
        if ((this.matchedFields = this.matches.rosterDateLine.exec(this.line)) !== null) {
            console.log("Found a roster date line");
            this.lineType = this.lineTypeEnum.rosterDateLine;
            return true;
        }
        return false;
    };
    //--------------------------------------------------------------------------

    /**
     * Processes the values from the regex result this.matched.fields
     *
     */
    this.doRosterDateLineAction = function() {
        var f = this.matchedFields;

        // If we already have a base date defined then we must have already
        // processed a roster date line so throw an error.
        if (typeof this.baseDate !== 'undefined') {
            this.parser.decodeError(this.parser.errorMsg.MSG_ROSTER_DATE_LINE);

        }

        console.log("Doing rosterDateLineAction");
        // 01APR-30APR 2011 01/03/11 14:50
        // [1&2]-[3&4] [5]   [6-8]  [9&10]
        // Get the date for the start of the duties.
        this.startDay = f[1];
        this.month = f[2];
        this.year = f[5];
        this.baseDate = new Date(this.month + this.startDay + ", " + this.year + " 00:00:00 UTC");
	this.lastDutyDate = new Date(this.baseDate.valueOf());
        console.log("Roster baseDate: " + this.baseDate);

        // Get the timestamp of when the roster was created by BA.
        this.roster.createdDate.setFullYear(2000 + (f[8] - 0), f[6]-1, f[7]);
        this.roster.createdDate.setHours(f[9], f[10], 0, 0);
        console.log("Roster created: " + this.roster.createdDate);
    };
    //--------------------------------------------------------------------------

    /**
     * Sets the lineType & returns true if a line matches ddmmm-ddmmm yyyy mm/dd/yy hh:mm
     * @returns {boolean} true if line matches
     *
     */
    this.testForRosterTypeLine = function() {
        if ((this.matchedFields = this.matches.rosterType.exec(this.line)) !== null) {
            console.log("Found a roster type line");
            this.lineType = this.lineTypeEnum.rosterType;
            return true;
        }
        return false;
    };
    //--------------------------------------------------------------------------

    /**
     * Processes the values from the regex result this.matched.fields
     *
     */
    this.doRosterTypeLineAction = function() {
        var f = this.matchedFields;

        console.log("Doing rosterTypeAction");

        this.roster.nameCode = f[1];
        this.roster.staffNo = f[2];
        this.roster.rosterType = f[3];
        console.log("Crewcode:" + this.roster.nameCode);
    };
    //--------------------------------------------------------------------------


    /**
     * Sets the lineType & returns true if a line matches ddmmm-ddmmm yyyy mm/dd/yy hh:mm
     * @returns {boolean} true if line matches
     *
     */
    this.testForCrewInfoLine = function() {
        if ((this.matchedFields = this.matches.crewInfoLine.exec(this.line)) !== null) {
            console.log("Found a crew info line");
            this.lineType = this.lineTypeEnum.crewInfoLine;
            return true;
        }
        return false;
    };
    //--------------------------------------------------------------------------
    this.doCrewInfoLineAction = function() {
        //  'LIDDJ818995 CA LGW sen 1308 737
        //    [1]  [2]  [3] [4]     [5]  [6]
        // matchCrewInfoLine = /^\s*([A-Z]{5})\s*(\d{6})\s*(CA|FO).+(LGW|LHR).+(\d{4})\s+(\d{3}).*$/,

        console.log("Doing crewInfoLineAction");

        var f = this.matchedFields,
        alertMsg = '';

        this.roster.crewStatus = f[3];
        this.roster.seniority = f[5];

        // Do some cross checking to make sure roster is valid
        if (this.strictChecking === true) {
            if (this.roster.nameCode !== f[1]) {
                alertMsg = "CrewCode doesn't match.\n";
            }
            if (this.roster.staffNo !== f[2]) {
                alertMsg += "Staff No' doesn't match.\n";
            }
            /*    if (this.roster.homeBase !== f[4]) {
                alertMsg += "Home base doesn't match.\n";
            }*/
        }
        if (alertMsg !== '') {
            alert("Parsing error in lines 1 & " + this.lineNo + " :" + alertMsg);
        }

    };
//---------------

    /**
     * Sets the lineType & returns true if a line matches ddmmm-ddmmm yyyy mm/dd/yy hh:mm
     * @returns {boolean} true if line matches
     *
     */
    this.testForBLKLine = function() {
        if ((this.matchedFields = this.matches.blkLine.exec(this.line)) !== null) {
            console.log("Found a BLK line");
            this.lineType = this.lineTypeEnum.blkLine;
            return true;
        }
        return false;
    };
    //--------------------------------------------------------------------------

    this.doBLKLineAction = function() {

        this.publishedDutyHours = this.getBlkHrs(this.matchedFields);
        console.log("dutyHours:" + this.publishedDutyHours);
        this.duties = [];
	this.BLkLine = this.lineNo;
    };
    // Use a separate function to return the value so can be used more easily in unit testing
    this.getBlkHrs = function(match) {
        var dutyHours = Number("" + match ? match[1] : 0),
        // force a string conversion
        hrs,
        mins,
        ms;

        if (isNaN(dutyHours)) {
            throw ("Error, exiting: Could not find published duty hours!");
        }

        // Now convert published duty hrs (BLK) to milliseconds to initialise a Date object.
        // We multiply everything by 100 first to avoid javascript floating point maths errors
        hrs = Math.floor(dutyHours) * 100;
        mins = Math.round(100 * dutyHours) - hrs;
        ms = ((hrs * 36000) + mins * 60000);

        console.log("Doing BLKLineAction: " + dutyHours, "ms: " + ms, "hrs: " + hrs, "mins: " + mins);
        return (new Date(ms));
    };

    //--------------------------------------------------------------------------

    this.testForDatesLine = function() {
        if ((this.matchedFields = this.matches.monthDateLine.exec(this.line)) !== null) {
            console.log("Found a dates line");
            this.lineType = this.lineTypeEnum.datesLine;
            return true;
        }
        return false;
    };
    //-------------------------------------------------------------------------
    // This function gets called when the parser finds the (01) 02  03  04.. line
    this.doDatesLineAction = function() {
        var lineNo = 0,
	    dateLine, startLine, daysLineNo, daysOffLine='', daysLine, tripLine='', dutyEndLine='', offset,
	    trip,theDate,theDay,theDaysOff,tripKey, theDest, rolledOverFlag = false,
	    tripLineFound = true,
	    lastDayOfMonth,i, rt = this.roster.rosterText,
	    carryInFlag = false, processedFirstTripFlag = false;

	// startLine points to the start of the roster summary block
        startLine = this.BLkLine ? this.BLKLine+1 : 1;

        dateLine = this.line;

        // endLine points to the end of the roster summary block ( the day line MO  TU  WE.. etc)
        daysLine = rt.next(); // next non-blank line
	daysLineNo = rt.getLineNo();

	this.line = rt.prev();
	do {
	    if (rt.getLineNo() === startLine) {
		tripLineFound = false;
		break;
	    }
	    tripLine = rt.prev();
	}while (!this.matches.tripSummaryLine.exec(tripLine));
	if (tripLineFound) {
	    dutyEndLine = rt.next();
	    rt.prev();
	    daysOffLine = rt.prev();
	}

	// move the iterator forward to where it found the (01) 02   03.. line
	rt.go(this.lineNo);
        console.log(dateLine);
        console.log(daysLine);
        console.log(tripLine);
        console.log(dutyEndLine);
        console.log(daysOffLine);

        // Find the whitespace offset from the start of the line to the (01) string in the dateLine
        offset = dateLine.search(/ \(01\) 02 {2}03/);
        console.log("Roster Summary Block\nstartLine: " + startLine + " , endLine: " + daysLineNo + " ,offset: " + offset);

        lastDayOfMonth = YAHOO.rp.utils.daysInMonth2(this.baseDate);
	console.log("Last day of month:" + lastDayOfMonth);
        for( i = offset ; i < dateLine.length; i = i + 4) {

            theDate = +dateLine.substring(i+2,i+4);
            if (rolledOverFlag) {
                theDate = theDate + lastDayOfMonth;
            }
            if ( !rolledOverFlag && theDate === lastDayOfMonth ) {
                rolledOverFlag = true;
            }

            theDay = daysLine.substring(i+2,i+4);
            theDaysOff = daysOffLine.substring(i,i+4).trim();
            tripKey = tripLine.substring(i,i+4).trim();
            theDest = dutyEndLine.substring(i,i+4).trim();

	    // Test for carry in trip (no trip no & dest in lowercase)
	    if ((tripKey === '' ) &&
		(theDest === theDest.toLowerCase()) &&
		(processedFirstTripFlag === false)) {
		carryInFlag = true;
	    }
	    if (tripKey !== '' || carryInFlag === true) {
		trip = YAHOO.rp.eventMaker.factory('Trip');
                trip.start.setDate(this.baseDate);
		if (carryInFlag === true) {
		    trip.start.setDayOfMonth(1);
		    trip.carryInTrip = true;
		    this.hasCarryInTrip = true;
		    tripKey = 'CI';
		}
		else {
		    trip.start.setDayOfMonth(theDate);
		}
		trip.tripNo = +tripKey;
		console.log(theDate + "_" + theDay + "_" + theDaysOff + "_" + tripKey + "_");
		this.eventCollection.events.add(trip,tripKey);
		carryInFlag = false;
		processedFirstTripFlag = true;
	    }
	}
        return theDate; // No of days of roster covers
    };
//  ------/decodeDutyDates-------------------------------------------------

    /**
     * Sets the lineType & returns true if a line matches ddmmm-ddmmm yyyy mm/dd/yy hh:mm
     * @returns {boolean} true if line matches
     *
     */
    this.testForDayDutyFSLine = function() {
        if ((this.matchedFields = this.matches.dayDutyFSLine.exec(this.line)) !== null) {
            console.log("Found a DayDutyFS line");
            this.lineType = this.lineTypeEnum.dayDutyFSLine;
            return true;
        }
        return false;
    };
    //-------------------------------------------------------------------------

    this.doDayDutyFSLineAction = function() {
        console.log("Doing dayDutyFSLineAction");
	this.dayDutyFSBookmark = this.lineNo;
    };

    // Gets executed for 2nd pass
    this.rewindToDayDutyFSLine = function() {
	// prevent infinite loop if bookmark not set
	if (this.dayDutyFSBookmark !== 0) {
	    this.roster.rosterText.go(this.dayDutyFSBookmark);
	}
    };

    this.testForTripCrewLine = function() {
        if ((this.matchedFields = this.matches.tripCrewLine.exec(this.line)) !== null) {
            console.log("Found a Trip Crew line");
            this.lineType = this.lineTypeEnum.tripCrewLine;
            return true;
        }
        return false;
    };

    /**
     * Sets the lineType & returns true if a line matches ddmmm-ddmmm yyyy mm/dd/yy hh:mm
     * @returns {boolean} true if line matches
     *
     */
    this.testForCrewNamesLine = function() {
        if ((this.matchedFields = this.matches.crewNamesLine.exec(this.line)) !== null) {
            console.log("Found a CrewNames line");
            this.lineType = this.lineTypeEnum.crewLine;
            return true;
        }
        return false;
    };
    //--------------------------------------------------------------------------
    this.doCrewLineAction = function() {
        console.log("Doing crewLineAction");
    };

    this.doDutyLineAction = function() {
        console.log("Doing dutyLineAction");
    };

    this.testForMultiDayLine = function() {
        if ((this.matchedFields = this.matches.multiDayLine.exec(this.line)) !== null) {
	    if (this.matchedFields[3].trim() === 'REST') {
                console.log("Found a Multi Rest Day line");
                this.lineType = this.lineTypeEnum.multiRestDay;
                return true;
	    }
	    else {
                console.log("Found a Multi Day line");
                this.lineType = this.lineTypeEnum.multiDay;
                return true;
	    }
        }
        return false;
    };

    this.doMultiDayLineAction = function() {
	var e;
        if (this.lineType === this.lineTypeEnum.multiDay) {}
	console.log("Doing multi-day lineAction");
	e = this.addEvent({summary: 3, startDay: 1, endDay: 2});
    };

    this.testForGndDutyLine = function() {
        if ((this.matchedFields = this.matches.gndDutyLine.exec(this.line)) !== null) {
	    if (this.matchedFields[3].trim() === 'REST') {
                console.log("Found a Rest Day line");
                this.lineType = this.lineTypeEnum.restDay;
                return true;
	    }
	    else {
                console.log("Found a Gnd Duty line");
                this.lineType = this.lineTypeEnum.gndDay;
                return true;
	    }
        }
        return false;
    };

    this.doGndDutyLineAction = function() {
        var e;
	console.log("Doing gnd dutyLineAction");
	e = this.addEvent({summary: 3, startDay: 1, endDay: 1, dayOfWeek: 2});
    };

    this.testForFlyingDutyLine = function() {
        if ((this.matchedFields = this.matches.flyingDutyLine.exec(this.line)) !== null) {
            console.log("Found a Flying Duty line");
            this.lineType = this.lineTypeEnum.multiDay;
            return true;
        }
        return false;
    };

    this.nextSector = function (sectorsLine) {

        var startIndex,
	    endIndex,
	    nextStartIndex,
	    c = YAHOO.rp.constants,
	    reportTime = null,
	    reportLength = 0,
	    preCodes,
	    m,
	    sector = {},
	    postCodesIndex;

        if ((m = this.matches.flightSector.exec(sectorsLine)) !== null) {

	    startIndex = m.index;
	    endIndex = startIndex + c.SECTORSECTIONLENGTH;

	    // 'LGW'
	    sector.origin = m[1].trim();
	    preCodes = sectorsLine.slice(startIndex-c.PREFLIGHTCODESLENGTH, startIndex);
	    // 'DH'
	    sector.preCode = preCodes.slice(0,2).trim();
	    // '1234'
	    sector.flightNo = preCodes.slice(2).trim();

	    // If the sector contains a report time then account for this
	    if (typeof m[2] !== 'undefined') { // Found a report time
		reportLength = c.REPORTLENGTHMODIFIER;
		endIndex = endIndex + reportLength;
		sector.report = m[2].trim();
	    }

	    sector.start = m[3].trim();
	    sector.dest = m[4].trim();
	    sector.end = m[5].trim();

	    // Run the line through the matcher again with the subsequent sectors removed
	    // so that the codes at the end of the sector can be captured.

	    if ((m = this.matches.flightSector.exec(sectorsLine.slice(endIndex))) !== null) {
		nextStartIndex = endIndex + m.index - c.PREFLIGHTCODESLENGTH;
	    }
	    else {
		nextStartIndex = sectorsLine.length;
	    }
	    postCodesIndex = startIndex + reportLength + c.STARTOFPOSTFLIGHTCODES;
	    sector.postCodes = sectorsLine.slice(postCodesIndex, nextStartIndex).trim();

	    sector.line = sectorsLine.slice(nextStartIndex);
	    if (sector.line.trim() === '') {
		delete sector.line;
	    }
	}
	return sector;
    };

    // Make a duty from an array of sectors
    this.makeDuty = function(s) {

    };
/*
    this.startNewTrip = function() {
	var trip = YAHOO.rp.eventMaker.factory('Trip'),
	    duty = YAHOO.rp.eventMaker.factory('FlyingDuty');
        trip.tripNo = +this.matchedFields[3];
	this.eventCollection.events.add(trip);
	console.log('trip:' + trip.tripNo);
	trip.duties.events.add(duty);
	delete this.prevClearTime;
	return trip;
    };
*/


    this.retrieveCarryInTrip = function() {
	var trip = this.eventCollection.events.get('CI');
	delete this.prevClearTime;
	return trip;
    }

    this.startNewTrip = function() {
	var tripNo = this.matchedFields[3],
	    trip = this.eventCollection.events.get(tripNo),
	    duty = YAHOO.rp.eventMaker.factory('FlyingDuty');
	console.log('trip:' + trip.tripNo);
	trip.duties.events.add(duty);
	delete this.prevClearTime;
	return trip;
    };


    this.finishTrip = function(trip) {
	var duty = trip.duties.events.current();

	duty.postProcess();
	trip.postProcess();
    };

    this.checkIfNewTrip = function(trip) {
	var duty = trip.duties.events.current(),
	    tripNo = +this.matchedFields[3];
/*
	// If restPeriod > minRest then new Duty
	// if (newDuty & at home base) or trip no changed then new trip.
	if( (tripNo !== trip.tripNo) ||
	    (this.isNewDuty() && this.atHomeBase())) {
	    this.finishTrip();
	    this.startNewTrip();
	}
*/    };

    this.isNewDuty = function(sectorStartTime) {
	var trip = this.currentTrip,
	    thisDuty,lastSector,
	    c = YAHOO.rp.constants,
	    startNewDuty = false;

	thisDuty = trip.duties.events.current();
	lastSector = thisDuty.sectors.events.current();

	if (typeof lastSector !== 'undefined') {
	    if (sectorStartTime - lastSector.end.valueOf() >= c.MINREST) {
	        startNewDuty = true;
	    }
	}
	return startNewDuty;
    };


    this.doFlyingDutyLineAction = function() {
	var trip = this.currentTrip,
	    duty = trip.duties.events.current(),
	    sector,
	    s = {};

	console.log("Doing flying dutyLineAction");

       // this.checkDate(lastDutyDate);
        s.line = this.matchedFields[4];
	while (typeof s.line !== 'undefined') {
	    s = this.nextSector(s.line);
	    if (typeof s.report !== 'undefined') {
		duty.start.setTime(s.report);
	    }
	    sector = YAHOO.rp.eventMaker.factory('Sector',this.baseDate);
	    sector.start.setDayOfMonth(this.matchedFields[1]);
	    sector.end.setDayOfMonth(this.matchedFields[1]);
	    sector.start.setTime(s.start);
	    sector.end.setTime(s.end);
	    sector.origin = s.origin;
	    sector.destination = s.dest;
	    sector.flightNo = s.flightNo;

	    if (this.isNewDuty(sector.start.valueOf())) {
		duty.postProcess();
		duty = YAHOO.rp.eventMaker.factory('FlyingDuty');
		if (sector.origin === this.roster.base) {
		    trip.postProcess();
		    trip = this.startNewTrip();
		    duty = trip.duties.events.current();
		}
		trip.duties.events.add(duty);
	    }

	    duty.sectors.events.add(sector);
	}

    };

    this.doTripCrewLineAction = function() {
        console.log("Doing tripCrewLineAction");
    };

    this.doAnyOtherLineAction = function() {
        console.log("Doing anyOtherLineAction");
    };

};
YAHOO.rp.BaFcParser.prototype.parse = function() {

    var parsing = false;
    this.state = this.states.lookingForMetaDataState;
    this.state.enter();

    while (this.roster.rosterText.hasNext()) {
        this.line = this.roster.rosterText.next().text; // next non-blank line
        this.lineNo = this.roster.rosterText.getLineNo();
        console.log(this.line);

	this.state.analyseLine();
    }
    this.state.exit();
};