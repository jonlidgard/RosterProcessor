/*jslint white: false, devel: true */

"use strict";

/* For description of 'that' & it's use in inheritance, see
  Doug Crockford JS 3 - Functions video at yui theater
*/
YUI().add('rpParser', function (Y) {
    Y.namespace('rp.bafc');

Y.rp.bafc.DefaultState = function (parser) {
    return {
        name : "Default State",

        // !!! Functions added in constructor will overide ones added as prototypes. !!!    
        foundRosterDateLine : function() {
            parser.decodeError(parser.errorMsg.MSG_ROSTER_DATE_LINE);
        },
        foundRosterTypeLine : function() {
            parser.decodeError(parser.errorMsg.MSG_ROSTER_TYPE_LINE);
        },
        foundCrewInfoLine : function() {
            parser.decodeError(parser.errorMsg.MSG_CREW_INFO_LINE);
        },
        foundBLKLine : function() {
            parser.decodeError(parser.errorMsg.MSG_BLK_LINE);
        },
        foundCrewNamesLine : function() {
            parser.decodeError(parser.errorMsg.MSG_CREW_LINE);
        },
        foundTripCrewLine : function() {
            parser.decodeError(parser.errorMsg.MSG_TRIP_CREW_LINE);
        },
        foundDayDutyFSLine : function() {
            parser.decodeError(parser.errorMsg.MSG_DAY_DUTY_FS_LINE);
        },
        foundMultiDayLine : function() {
            parser.decodeError(parser.errorMsg.MSG_DUTY_LINE);
        },
        foundFlyingDutyLine : function() {
            parser.decodeError(parser.errorMsg.MSG_DUTY_LINE);
        },
        foundGndDutyLine : function() {
            parser.decodeError(parser.errorMsg.MSG_DUTY_LINE);
        },
        foundOtherLine : function() {
            if (parser.ignoreUnrecognisedLines === false) {
                parser.decodeError(parser.errorMsg.MSG_ANY_OTHER_LINE);
            }
        }
    };
};
//----

Y.rp.bafcLookingForMetaDataState = function (parser) { // old - startState
    var that = Y.rp.bafc.DefaultState(parser);

    that.name = "MetaData State";

    that.foundRosterDateLine = function() {
        parser.doRosterDateLineAction();
    };
    
    that.foundRosterTypeLine = function() {
        parser.doRosterTypeLineAction();
    };

    that.foundCrewInfoLine = function() {
        parser.doCrewInfoLineAction();
    };

    that.foundBLKLine = function() {
        parser.doBLKLineAction();
        parser.ignoreUnrecognisedLines = true; // Ignore the cruft between BLK & DAY DUTY FS
    };

    that.foundDayDutyFSLine = function() {
        parser.doDayDutyFSLineAction();
        parser.state = parser.lookingForDutyLineState;
        parser.ignoreUnrecognisedLines = false; // Don't ignore lines frome here-on.
    };
    return that;
};

//---
Y.rp.bafc.LookingForDutyLineState = function (parser) { // old - startState
    var that = Y.rp.bafc.DefaultState(parser);
    that.name = "Duty State";

    that.foundMultiDayLine = function() {
        parser.doMultiDayLineAction();
    };
    that.foundFlyingDutyLine = function() {
        parser.doFlyingDutyLineAction();
    };
    that.foundGndDutyLine = function() {
        parser.doGndDutyLineAction();
    };

    that.foundTripCrewLine = function() {
        parser.doTripCrewLineAction();
        parser.state = parser.lookingForCrewLineState;
    };
    return that;
};

//---
Y.rp.bafc.LookingForCrewLineState = function(parser) { // old - startState
    var that = Y.rp.bafc.DefaultState(parser);
    that.name = "Crew Names State";
    that.foundCrewNamesLine = function() {
        parser.doCrewLineAction();
        parser.ignoreUnrecognisedLines = true;
    };
    return that;
};
//-------------------------------------------------------------

Y.rp.Roster = function (rosterLines) {
    var x = 1;
};
/*
    this.createdDate = new Date(0);
    
    this.rosterText = (function() {
        var index = 0,
            lines = rosterLines.split('\n'),
            length = lines.length;

        return {
            next: function() {
                var element;
                do {
                    if (!this.hasNext()) {
                        return null;
                    }
                    element = lines[index]; // Do not trim - whitespace is important to parser
                    index += 1;

                    // skip blank lines
                } while ( element . length === 0 );
                return element;
            },
            hasNext: function() {
                return index < length;
            },
            getLineNo: function() {
                return index;
            },
            reset: function() {
                index = 0;
            }
        };
    } ());
};
*/

Y.rp.Parser = function(theRoster) {

//    var constants = Y.rp.constants;
    
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
        MSG_DUTY_LINE : "Unexpected Duty line"
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
        flyingDutyLine : /^ *(\d{1,2}) (MO|TU|WE|TH|FR|SA|SU) (\d{4})\s+(.*$)/,
        gndDutyLine : /^ *(\d{1,2}) (MO|TU|WE|TH|FR|SA|SU) \s+(.*)$/
    };


    this.lookingForMetaDataState = new Y.rp.bafc.LookingForMetaDataState(this);
    this.lookingForDutyLineState = new Y.rp.bafc.LookingForDutyLineState(this);
    this.lookingForCrewLineState = new Y.rp.bafc.LookingForCrewLineState(this);

    this.lineTypeEnum = {
        unrecognised : 0,
        rosterDateLine : 1,
        crewInfoLine : 2,
        blkLine : 3,
        dayDutyFSLine : 4,
        gndDuty : 5,
        multiDay : 6,
        flyingDuty : 7,
        simDuty : 8,
        crewLine : 9,
        rosterType : 10,
        tripCrewLine : 11
    };
    
    this.roster = theRoster;
    this.dutyDate = new Date(); // RPDate.Create ??
    this.line = '';
    this.lineNo = 0;
    this.state = undefined;
    this.ignoreUnrecognisedLines = false;
    this.strictChecking = true; // extra validation checks
    this.lineType = this.lineTypeEnum.unrecognised;
    this.matchedFields = undefined;

    this.decodeError = function(errorMessage) {
        console.log(this.state.name);
        throw new Error(errorMessage + " found - line " + this.lineNo);
    };
    //--------------------------------------------------------------------------

/*
    this.addEvent = function (summaryField, startDayField, endDayField) {

	var e = new Y.rp.Event();
	var line = getMatcher().group(summaryGroup);
		
	e.summary = this.matchedFields[summaryField];
	e.description = this.line;
	e.startTime = new Date(this.baseDate.valueOf());
        e.startTime.setUTCDate(this.matchedFields.startDayField);
	e.endTime = new Date(e.startTime.valueOf() + this.constants.WHOLEDAY);
        
                parseFCNonFlyingLine(myDuty);
                myDuty.summary = modLine(myDuty.summary);

        
        
        
		gc.set(Calendar.DAY_OF_MONTH, startDay);
		e.setStartDate(gc.getTime());
//ADD ROLLOVER CODE
		gc.set(Calendar.DAY_OF_MONTH, endDay);
		e.setEndDate(gc.getTime());
		
		setDutyTimes(line, e);
		
	this.roster.add(e);
		lastDutyDate = gc.getTime();
//		mergeEvents();
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
        if (this.baseDate !== undefined) {
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
    //--------------------------------------------------------------------------
    this.doDayDutyFSLineAction = function() {
        console.log("Doing dayDutyFSLineAction");
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
            console.log("Found a Multi Day line");
            this.lineType = this.lineTypeEnum.multiDay;
            return true;
        }
        return false;
    };

    this.doMultiDayLineAction = function() {
        console.log("Doing multi-day lineAction");
    };

    this.testForGndDutyLine = function() {
        if ((this.matchedFields = this.matches.gndDutyLine.exec(this.line)) !== null) {
            console.log("Found a Gnd Duty line");
            this.lineType = this.lineTypeEnum.multiDay;
            return true;
        }
        return false;
    };

    this.doGndDutyLineAction = function() {
        console.log("Doing gnd dutyLineAction");
    };

    this.testForFlyingDutyLine = function() {
        if ((this.matchedFields = this.matches.flyingDutyLine.exec(this.line)) !== null) {
            console.log("Found a Flying Duty line");
            this.lineType = this.lineTypeEnum.multiDay;
            return true;
        }
        return false;
    };

    this.doFlyingDutyLineAction = function() {
        console.log("Doing flying dutyLineAction");
    };

    this.doTripCrewLineAction = function() {
        console.log("Doing tripCrewLineAction");
    };

    this.doAnyOtherLineAction = function() {
        console.log("Doing anyOtherLineAction");
    };

};

Y.rp.Parser.prototype.parse = function() {

    var parsing = false;
    this.state = this.lookingForMetaDataState;
    
    while (this.roster.rosterText.hasNext()) {
        this.line = this.roster.rosterText.next(); // next non-blank line
        this.lineNo = this.roster.rosterText.getLineNo();
        console.log(this.line);
        //skip dashed lines
        if (this.matches.dashedLine.exec(this.line)) {
            console.log("Found a dashed line");
            continue;
        }

        if (this.testForTripCrewLine()) {
            this.state.foundTripCrewLine();
        }

        if (this.testForMultiDayLine()) {
            this.state.foundMultiDayLine();
        }

        if (this.testForFlyingDutyLine()) {
            this.state.foundFlyingDutyLine();
        }

        if (this.testForGndDutyLine()) {
            this.state.foundGndDutyLine();
        }

        if (this.testForRosterDateLine()) {
            this.state.foundRosterDateLine();
        }
        
        if (this.testForRosterTypeLine()) {
            this.state.foundRosterTypeLine();
        }

        if (this.testForCrewInfoLine()) {
            this.state.foundCrewInfoLine();
        }

        if (this.testForBLKLine()) {
            this.state.foundBLKLine();
        }

        if (this.testForDayDutyFSLine()) {
            this.state.foundDayDutyFSLine();
        }

        if (this.testForCrewNamesLine()) {
            this.state.foundCrewNamesLine();
        }

        if (this.lineType === this.lineTypeEnum.unrecognised) {
            this.state.foundOtherLine();
        }
    }
};
}, '0.1', {requires: ['rpUtils', 'rpEvent']} );