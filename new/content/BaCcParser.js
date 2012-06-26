/*globals YAHOO */

/*jslint white: false, devel: true */

"use strict";

YAHOO.rp.BaCcLineTypeEnum = {
    unrecognised : 0,
    rosterForLine : 1,
    gndDutyLine : 2,
    multiGndDayLine : 3,
    reportLine : 4,
    sectorLine : 5,
    clearLine : 6,
    totalDutyLine : 7,
    crewNamesLine : 8,
    messagesLine : 9,
    publishedLine : 10,
    plannedHoursLine : 11,
    tripLengthLine : 12
    };



YAHOO.rp.BaCcParser = function(theRoster) {

//    var constants = rp.constants;
    var lte = YAHOO.rp.BaCcLineTypeEnum;
    var stateNames = YAHOO.rp.BaCcParserStatesEnum;
    var ccsm = YAHOO.rp.BaCcStateMaker;
    var utils = YAHOO.rp.Utils;
    // Error messages
    this.errorMsg = {
        MSG_OUT_OF_SEQUENCE : "Encountered line out of sequence",
	MSG_CREW_INFO_LINE : "Unexpected 'Crew names' line",
        MSG_ROSTER_FOR_LINE : "Unexpected 'Roster for xxxx' line"
   };

    this.matches = {
        
	rosterFor : /Roster\sfor\s?(.*?)\n+/mi,
	splitName : /([A-Za-z\-]+)\s?([A-Za-z\-]+)/i,
	crewNames : /^\s*(\d{4})\/(\d{2})\s+([A-Z\s\.\(\)]+)$/img,
	messages : /^\s*(MESSAGES.*?)$/im,
	published : /COMPLETE\sROSTER\sPUBLISHED\s+([0-3][0-9])([0-1][0-9])([0-3][0-9])\s+/,
	planned : /Your planned block hours to the end of ([A-Za-z]{3}) are/,

	// SA 16 FEB ANNUAL LEAVE THRU 18 FEB 08
	// [1] Day of week
	// [2] Start day of month
	// [3] Short month
	// [4] Rest of line
	dateLine : /^\s*([A-W]{2})\s+(\d\d?)\s+([A-Z]{3})\s+(.*)\s*$/,
	sector : /^\s*(\d{4})\s+(\*\s?)?((?:BA|STL|SBY|STW)\s?\d{3,4})\s+([A-Z]{3})\s+([A-Z]{3})\s+(\d{4})\s+([A-Z0-9]{3})(\s+(\d{2,4}))?/,
	report : /REPORT\sAT\s+(\d{4})\s+LOCAL\sTIME\s+([A-Z]{3})\s*$/,
	clear : /^\s*CLEAR\s+TIME\s+(\([A-W]{2}\s\d{2}\s[A-Y]{3}\)\s+)?(\d{4})\s+LOCAL\sTIME\s+([A-Z]{3})\s*$/,
        totalDuty : /TOTAL\s+DUTY\s+HOURS\s+(\d{2,4})/,
        gndDuty : /^\s*(.*)\s+(\d{4})\s+(\d{4})\s+LOCAL\sTIME\s+([A-Z]{3})\s*$/,
        
	//multiDay : /^\s*(.*)\s+THRU\s+(\d{2})\s+([A-Z]{3})\s+(\d{2})\s*$/,
        //ANNUAL LEAVE THRU 18 FEB 08
	// [1] Description
	// [2] End Day of month
	// [3] Month
	// [4] 2 digit Year 
	multiDay : /^\s*(.*)\s+THRU\s+(\d{2})\s+([A-Z]{3})\s+(\d{2})\s*$/,
        
//	date : /([A-W]{2})\s(\d{2})\s([A-Y]{3})/,
        fsSs : /FS\/SS\s*$/ // Indicates working down as main crew

    };

    this.states = {
		    lookingForDutyState: new ccsm.factory(stateNames.LOOKINGFORDUTYSTATE,this),
		    inFlyingDutyState: new ccsm.factory(stateNames.INFLYINGDUTYSTATE,this),
		    lookingForCrewNameOrDutyState: new ccsm.factory(stateNames.LOOKINGFORCREWNAMEORDUTYSTATE,this),
		    messageLinesState: new ccsm.factory(stateNames.MESSAGELINESSTATE,this)
		    };

    this.eventCollection = new YAHOO.rp.EventCollection();
    this.roster = theRoster;
    this.dutyDate = new Date(); // RPDate.Create ??
    this.lastDutyDate = undefined;
    this.prevClearTime = undefined;
    this.line = '';
    this.lineNo = 0;
    this.lineHasADateFlag = false;
    this.lineDate = undefined;
    this.state = undefined;
    this.ignoreUnrecognisedLines = false;
    this.strictChecking = true; // extra validation checks
    this.lineType = lte.unrecognised;
    this.matchedFields = undefined;
    this.hasCarryInTrip = false;
    this.dayDutyFSBookmark = 0;
    this.currentTrip = undefined;

    this.decodeError = function(errorMessage) {
        YAHOO.log(this.state.name);
        throw new Error(errorMessage + " found - line " + this.lineNo);
    };
    
    this.getTitleString = function() {
       return( this.firstName + ' ' + this.lastName + 
        '\'s roster for ' + MONTHSOFYEAR[this.baseDate.getUTCMonth()] + ' ' + this.baseDate.getUTCFullYear());
    };

    this.getRosterPublishedDate = function(rosterText) {
	// We need to get the year that the roster refers to
	// COMPLETE ROSTER PUBLISHED 290208
	// We need to be careful in Jan because roster duties could be referring to previous year!
	// So when we get the month in each duty. If it's 2 months > than published month then in previous year.
	var m  = this.matches.published.exec(rosterText);
	if (m !== null) {
	    this.month = m[2]-1;
            this.year = m[3];
            this.roster.createdDate.setFullYear(2000+(m[3]-0),m[2]-1,m[1]);
	    this.baseDate = new Date(this.roster.createdDate.valueOf());
	    YAHOO.log("BaseDate: " + this.baseDate);
	}
/*
    PROBABLY DON'T NEED PLANNED HOURS LINE IF WE CHECK EVERY DUTY DATE MONTH AGAINST PUBLISHED MONTH & ADJUST YEAR
    APPROPRIATELY - SEE ABOVE.

		// The planned hours line
		// Your planned block hours to the end of FEB are 0206:47
		// OR - Your planned block hours to the end of     are 0856:59.
		// SO MIGHT HAVE TO LIVE WITH NO MONTH GIVEN.
		if ((this.matchedFields = this.matches.planned.exec(rosterText)) !== null) {
                     tmpDate = new Date(this.baseDate.valueOf());
                     var rosterMonth = utils.indexOfMonth(a[1]); 
                     if ( rosterMonth > tmpDate.getMonth() ) {
                        // If here then the roster month is in the year previous to the COMPLETE_ROSTER_PUBLISHED line one
                            this.baseDate.setUTCFullYear(tmpDate.getUTCFullYear()-1);
                     }
                     this.baseDate.setUTCMonth(rosterMonth);
*/
        else {
            throw new RosterException("Unable to parse planned hours line");
        }
    };
        
    this.abbreviateText = function (text) {
       text = text.trim();
       text = text.replace(/\s+/g," ");
       text = text.replace(/AVIATION\sMEDICINE/i,"AVMED");
       text = text.replace(/ LOCAL\sTIME\s(LGW|LHR)/i,"L");
       text = text.replace(/STANDBY AT HOME/i,"HSB");
       text = text.replace(/STANDBY/i,"STBY");
       text = text.replace(/OFF DUTY/i,"OFF");
       text = text.replace(/ANNUAL LEAVE/i,"LEAVE");
       text = text.replace(/900 HRS GROUND WORK/i,"900H GW");
       text = text.replace(/PT-TIME NON WORKING/i,"PT-NW");
       text = text.replace(/JOBSHARE NONWORKING/i,"JS-NW");
       text = text.replace(/MAN HAND ONLINE/i,"MAN HND");
       text = text.replace(/AVAILABLE/i,"AVAIL");
       text = text.replace(/DAY IN LIEU/i,"LIEU DAY");
       return text;
    };

    this.addEvent = function (eventType,fields) {

	var e = YAHOO.rp.eventMaker.factory(eventType,this.baseDate),
	    d,
	    u = YAHOO.rp.utils;

	this.setGenericEventParams(e);
	e.description = this.line;
	e.summary = this.line;

	if (typeof fields == 'undefined') {
	    e.start = this.lineDate.clone();
	    e.end = this.lineDate.clone();
	}
	else {
	    if (typeof fields.useLineDate !== 'undefined') {
		e.start = this.lineDate.clone();
		e.end = this.lineDate.clone();
	    }
	    if (typeof fields.summary !== 'undefined') {
	        e.summary = this.matchedFields[fields.summary];
	    }
	    if (typeof fields.startDay !== 'undefined') {
		e.start.setDayOfMonth(this.matchedFields[fields.startDay]);
	    }
	    if (typeof fields.endDay !== 'undefined') {
		e.end.setDayOfMonth(this.matchedFields[fields.endDay]);
	    }
	    if (typeof fields.shortMonth !== 'undefined') {
		var sm = this.matchedFields[fields.shortMonth];
		e.end.setShortMonth(sm);
	    }
/*	    //??? Need to check this code block
	    if (typeof fields.dayOfWeekField !== 'undefined' &&
	        !u.checkDate(this.matchedFields[fields.dayOfWeek], e.start.date() )) {
		    throw new Error({name: 'RosterProcessor Error',
		    	message: 'Incorrect day of week for date on line ' + this.lineNo});
	    }
*/
	}

	// Need to inc year if end date is less than start date
	if ( e.end.isLessThan(e.start)) {
	    e.end.incYear();
	}
	e.rosterLine = this.line;

	e.summary = this.abbreviateText(e.summary);

	return e;
   };

 
    this.setGenericEventParams = function (e) {
	e.created.setDate(this.roster.createdDate);
	e.lastModified.setDate(this.roster.createdDate);
    };

    this.testForDateInLine = function() {
	// SA 16 FEB XXXXXXXXXXX
	// [1] Day of week
	// [2] Start day of month
	// [3] Short month
	// [4] Rest of line
    	// line : /^\s*([A-Z]{2})\s+(\d\d?)\s+([A-Z]{3})\s+(.*)\s*$/,
        var result = ((this.matchedFields = this.matches.dateLine.exec(this.line)) !== null);
	this.lineHasADateFlag = result;
	delete this.lineDate; // will be set in doDateLineAction
	return result;
    };
    this.doDateInLineAction = function() {
	var u = YAHOO.rp.utils;
	this.line = this.matchedFields[4];

	this.lineDate = new YAHOO.rp.EventDate();
	this.lineDate.setDate(this.roster.createdDate);
	this.lineDate.setDayOfMonth(this.matchedFields[2]);
        var shortMonth = this.matchedFields[3];
	var rosterMonth = u.indexOfMonth(shortMonth); 
	// Need to modify year if published date's month is less than short month given on duty line
        if ( rosterMonth > (this.lineDate.date().getMonth() + 2) ) {
            // If here then the roster month is in the year previous to the COMPLETE_ROSTER_PUBLISHED line one
            this.lineDate.decYear();
        }
	this.lineDate.setShortMonth(shortMonth);
	//??? Need to check this code block
	if (!u.checkDate(this.matchedFields[1], this.lineDate.date() )) {
	    throw new Error({name: 'RosterProcessor Error',
		    message: 'Incorrect day of week for date on line:\n' + this.originalLine});
	}
	return true; // Do rest of tests 
    };
    
    this.testForMultiDayLine = function() {
        // Is it a multi day entry, e.g. ANNUAL LEAVE THRU 27 feb 08 ?
        var result = false;
	if ((this.matchedFields = this.matches.multiDay.exec(this.line)) !== null) {
	    result = true;
	    this.lineType = lte.multiDayLine;
	}
	return result;
    };
    
    this.doMultiDayLineAction = function() {
        //multiDay : /^\s*(.*)\s+THRU\s+(\d{2})\s+([A-Z]{3})\s+(\d{2})\s*$/,
        //SA 16 FEB       ANNUAL LEAVE THRU 18 FEB 08
	// [1] Description
	// [2] Day of month
	// [3] Month
	// [4] 2 digit Year 
	var e;
        if (this.lineType === lte.multiDay) {
	    YAHOO.log("Doing multiDayLineAction");
	}
	else {
	    throw "Unrecognised duty " + this.lineType;
        }

	e = this.addEvent('groundDuty');
	this.eventCollection.add(e);
//	this.mergeEvents(this.eventCollection);


                     myDuty = new baCcGroundDuty(modLine(a[1]), trimString(a[1]), that.created);
                     myDuty.startTime = new Date(dutyDate.valueOf());
                     myDuty.startTime.setHHMMTime("0000");
                     myDuty.endTime = new Date(a[3] + " " + a[2] + ", 20" + a[4] + " 00:00:00 UTC");
                     myDuty.endTime = new Date(myDuty.endTime.valueOf() + WHOLEDAY);
                     myDuty.wholeDay = true;

                     that.duties.push(myDuty);
                     mergeDuties(that);
    };
 


    this.testForGndDutyLine = function() {

	var result = true, switchSelector = 0, gndDutyCode = '';

	if ((this.matchedFields = this.matches.gndDuty.exec(this.line)) !== null) {
	    switchSelector = switchSelector + 1;
	    gndDutyCode = this.matchedFields[3].trim();
	}
	else { // is it a multi day
	    if ((this.matchedFields = this.matches.multiDayLine.exec(this.line)) !== null) {
		switchSelector = switchSelector + 2;
		gndDutyCode = this.matchedFields[3].trim();
	    }
	}

	if (gndDutyCode === 'REST') {
	    switchSelector = switchSelector + 4;
	}
	switch (+switchSelector) {
	    case 1:
//		YAHOO.log("Found a Gnd Duty line");
		this.lineType = lte.gndDuty;
		break;

	    case 2:
//		YAHOO.log("Found a Multi Day line");
		this.lineType = lte.multiDay;
		break;
	    case 5:
//		YAHOO.log("Found a REST day line");
		this.lineType = lte.restDay;
		break;
	    case 6:
//		YAHOO.log("Found a multi REST day line");
		this.lineType = lte.multiRestDay;
		break;
	    default:
		result = false;
		break;
	}
        return result;
    };

    this.doGndDutyLineAction = function() {
        var e;
        if (this.lineType === lte.gndDuty) {
	    YAHOO.log("Doing gnd dutyLineAction");
	    e = this.addEvent({summary: 3, startDay: 1, endDay: 1, dayOfWeek: 2});
	}
	else {
	    if (this.lineType === lte.multiDay) {
		YAHOO.log("Doing multi-day lineAction");
		e = this.addEvent({summary: 3, startDay: 1, endDay: 2});
	    }
	    else {
		throw "Unrecognised duty " + this.lineType;
	    }
	}
	this.eventCollection.add(e);
	this.mergeEvents(this.eventCollection);
    };

    this.testForReportLine = function() {
        // Is it a trip REPORT, e.g. REPORT AT 2000 LOCAL TIME LON
        var result = false;
	if ((this.matchedFields = this.matches.report.exec(this.line)) !== null) {
	    result = true;
	    this.lineType = lte.reportLine ;
	}
	return result;
    };
    
    this.doReportLineAction = function() {
    };
    
    this.testForTripLengthLine = function() {
        // Is it a TRIP LENGTH line, e.g. TRIP LENGTH  5 DAYS        
        var result = false;
	if ((this.matchedFields = this.matches.tripLength.exec(this.line)) !== null) {
	    result = true;
	    this.lineType = lte.tripLengthLine ;
	}
	return result;
    };
    this.doTripLengthLineAction = function() {
    };

    this.testForSectorLine = function() {
        // Is it a sector, e.g. 2030   BA237     LHR   DME   0030 76Z          
        var result = false;
	if ((this.matchedFields = this.matches.sector.exec(this.line)) !== null) {
	    result = true;
	    this.lineType = lte.sectorLine ;
	}
	return result;
    };
    this.doSectorLineAction = function() {
    };
    
    this.testForClearLine = function() {
        // Is it a CLEAR line, e.g. CLEAR TIME (SU 24 JUN) 0535 LOCAL TIME LON         
        var result = false;
	if ((this.matchedFields = this.matches.clear.exec(this.line)) !== null) {
	    result = true;
	    this.lineType = lte.clearLine ;
	}
	return result;
    };
    this.doClearLineAction = function() {
    };
    
    this.testForTotalDutyLine = function() {
        // Is it a TOTAL DUTY line, e.g. -------------------  TOTAL DUTY HOURS   2750        
        var result = false;
	if ((this.matchedFields = this.matches.totalDuty.exec(this.line)) !== null) {
	    result = true;
	    this.lineType = lte.totalDutyLine ;
	}
	return result;
    };
    this.doTotalDutyLineAction = function() {
    };
    
    this.testForCrewNamesLine = function() {
        // Is it a crew line, e.g. MACKILLOP    REBECCA         77B     41   A9        
        var result = false;
	if ((this.matchedFields = this.matches.crewNames.exec(this.line)) !== null) {
	    result = true;
	    this.lineType = lte.crewNamesLine ;
	}
	return result;
    };
    this.doCrewNamesLineAction = function() {
    };
    
    this.testForMessagesLine = function() {
        // Is it a MESSAGES line, e.g. MESSAGES                          01A        
        var result = false;
	if ((this.matchedFields = this.matches.messages.exec(this.line)) !== null) {
	    result = true;
	    this.lineType = lte.messagesLine ;
	}
	return result;
    };
    this.doMessagesLineAction = function() {
    };
    
    this.doAnyOtherLineAction = function() {
        YAHOO.log("Doing anyOtherLineAction");
    };

    this.parse = function() {
	YAHOO.log("HERE");
        var parsing = false;
        delete this.baseDate;
	this.getRosterPublishedDate(this.roster.rosterText.allLines());
	this.state = this.states.lookingForDutyState;
        this.state.enter();

        while (this.roster.rosterText.hasNext()) {
	    this.originalLine = this.roster.rosterText.next().text.trim();
            this.line = this.originalLine; // get's modded if line has a date
            this.lineNo = this.roster.rosterText.getLineNo();
            YAHOO.log(this.line);
            if (this.state.analyseLine() === true) {
	        throw "Unrecognised Line: " + this.lineNo + "," + this.line;
	    }
	}
	this.state.exit();
	return this.eventCollection.all();
    };
};