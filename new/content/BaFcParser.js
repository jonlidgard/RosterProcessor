/*jslint white: false, devel: true */

"use strict";

function BaFcDefaultState(parser) {

    this.parser = parser;

    // !!! Functions added in constructor will overide ones added as prototypes. !!!    
    this.foundRosterDateLine = function() {
        this.parser.decodeError(this.parser.ERROR_MSG_ROSTER_DATE_LINE);
    };
    this.foundRosterTypeLine = function() {
        this.parser.decodeError(this.parser.ERROR_MSG_ROSTER_TYPE_LINE);
    };
    this.foundCrewInfoLine = function() {
        this.parser.decodeError(this.parser.ERROR_MSG_CREW_INFO_LINE);
    };
    this.foundBLKLine = function() {
        this.parser.decodeError(this.parser.ERROR_MSG_BLK_LINE);
    };
    this.foundCrewLine = function() {
        this.parser.decodeError(this.parser.ERROR_MSG_CREW_LINE);
    };
    this.foundTripCrewLine = function() {
        this.parser.decodeError(this.parser.ERROR_MSG_TRIP_CREW_LINE);
    };
    this.foundDayDutyFSLine = function() {
        this.parser.decodeError(this.parser.ERROR_MSG_DAY_DUTY_FS_LINE);
    };
    this.foundDutyLine = function() {
        this.parser.decodeError(this.parser.ERROR_MSG_DUTY_LINE);
    };
    this.foundOtherLine = function() {
        if (this.parser.ignoreUnrecognisedLines === false) {
            this.parser.decodeError(this.parser.ERROR_MSG_ANY_OTHER_LINE);
        }
    };
}

//----

function BaFcLookingForMetaDataState(parser) { // old - startState
    this.parser = parser;

    this.foundRosterDateLine = function() {
        this.parser.doRosterDateLineAction();
    };
    
    this.foundRosterTypeLine = function() {
        this.parser.doRosterTypeLineAction();
    };

    this.foundCrewInfoLine = function() {
        this.parser.doCrewInfoLineAction();
    };

    this.foundBLKLine = function() {
        this.parser.doBLKLineAction();
        this.parser.ignoreUnrecognisedLines = true; // Ignore the cruft between BLK & DAY DUTY FS
    };

    this.foundDayDutyFSLine = function() {
        this.parser.doDayDutyFSLineAction();
        this.parser.state = this.parser.lookingForDutyLineState;
        this.parser.ignoreUnrecognisedLines = false; // Don't ignore lines frome here-on.
    };

}
BaFcLookingForMetaDataState.prototype = new BaFcDefaultState();

//---
function BaFcLookingForDutyLineState(parser) { // old - startState
    this.parser = parser;
    this.foundDutyLine = function() {
        this.parser.doDutyLineAction();
    };

    this.foundTripCrewLine = function() {
        this.parser.doTripCrewLineAction();
        this.parser.state = this.parser.lookingForCrewLineState;
    };
}
BaFcLookingForDutyLineState.prototype = new BaFcDefaultState();

//---
function BaFcLookingForCrewLineState(parser) { // old - startState
    this.parser = parser;
    this.foundCrewLine = function() {
        this.parser.doCrewLineAction();
        this.parser.ignoreUnrecognisedLines = true;
    };
}

BaFcLookingForCrewLineState.prototype = new BaFcDefaultState();
//---

function Roster(rosterLines) {
    this.WHOLEDAY = +86400000;
    this.ONEMINUTE = +60000;
    this.POSTFLIGHTDUTYTIME = +1800000; // 1/2 hour
    this.PREFLIGHTDUTYTIME = +3600000; // 1 hour
    this.LHRCCPREFLIGHTDUTYTIME = +4800000; // 01:20
    this.MINREST = +39600000; // 11 hours

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
}

//Constructor
function baseParser(roster) {
    this.roster = new Roster();
    this.dutyDate = new Date(); // RPDate.Create ??
    this.line = '';
    this.lineNo = 0;
}

function Parser(theRoster) {

    // Error messages
    this.ERROR_MSG_ROSTER_DATE_LINE = "Unexpected Roster date line";
    this.ERROR_MSG_ROSTER_TYPE_LINE = "Unexpected Roster type line";
    this.ERROR_MSG_CREW_INFO_LINE = "Unexpected Crew info' line";
    this.ERROR_MSG_BLK_LINE = "Unexpected BLK hh.nn line";
    this.ERROR_MSG_DAY_DUTY_FS_LINE = "Unexpected Day Duty F L I G H T  S E Q U E N C E line";
    this.ERROR_MSG_ANY_OTHER_LINE = "Unrecognised line";
    this.ERROR_MSG_TRIP_CREW_LINE = "Unexpected Trip: Crew Names: line";
    this.ERROR_MSG_CREW_LINE = "Unexpected Crew names line";
    this.ERROR_MSG_DUTY_LINE = "Unexpected Duty line";

    this.matches = (function () ({
        var rosterDateLine = /([0-3][0-9])([A-Z]{3})-([0-3][0-9])([A-Z]{3}) (\d{4})\s+([0-3][0-9])\/([0-9][0-9])\/([0-9][0-9])\s+([0-2][0-9]):([0-5][0-9])\s*$/;
    }

    // '01APR-30APR 2011 01/03/11 14:50
    this.matchRosterDateLine = /([0-3][0-9])([A-Z]{3})-([0-3][0-9])([A-Z]{3}) (\d{4})\s+([0-3][0-9])\/([0-9][0-9])\/([0-9][0-9])\s+([0-2][0-9]):([0-5][0-9])\s*$/;
    // LIDDJ818995FINAL
    this.matchRosterType = /^\s*([A-Z]{5})\s*(\d{6})\s*(FINAL|ACHIEVED|ACHEIVED)/;
    //.*(\d{3})\s*([A-Z]{3})\s*([A-Z]{3,8})\s*(\d{4})\s+([0-3][0-9])([A-Z]{3})-([0-3][0-9])([A-Z]{3}) (\d{4})\s+([0-3][0-9])\/([0-9][0-9])\/([0-9][0-9])\s+([0-2][0-9]):([0-5][0-9])\s*$/, // TO-CHECK
    //  'LIDDJ818995 CA LGW sen 1308 737
    //	  [1]  [2]  [3] [4]     [5]  [6]
    matchCrewInfoLine = /^\s*([A-Z]{5})\s*(\d{6})\s*(CA|FO).+(LGW|LHR).+(\d{4})\s+(\d{3}).*$/,

    // BLK. 79.45
    //        matchBLKLine = /^.*BLK\.*\s+(\d{0,3})\.(\d{2}).*$/,
    matchBLKLine = /BLK\.\s*(\d{0,3}.\d\d)\s*$/,

    // DAY DUTY F L I G H T  S E Q U E N C E
    matchDayDutyFSLine = /^\s*DAY\s+DUTY\s+F[LIGHTSEQUNC ]+$/,
    // 1234 01 Firstname Lastname.
    matchCrewNamesLine = /^\s*(\d{4})\/(\d{2})(\s+([A-Za-z]+)\s+([A-Za-z]+)\.?)+\s*$/,

    this.lookingForMetaDataState = new BaFcLookingForMetaDataState(this);
    this.lookingForDutyLineState = new BaFcLookingForDutyLineState(this);
    this.lookingForCrewLineState = new BaFcLookingForCrewLineState(this);

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
        rosterType : 10
    };
    
    this.roster = theRoster;
    this.dutyDate = new Date(); // RPDate.Create ??
    this.line = '';
    this.lineNo = 0;
    this.state = undefined;
    this.ignoreUnrecognisedLines = false;
    this.lineType = this.lineTypeEnum.unrecognised;
    this.matchedFields = undefined;

    this.decodeError = function(errorMessage) {
        throw new Error(errorMessage + " found - line " + this.lineNo);
    };
    //--------------------------------------------------------------------------


    /**
     * Sets the lineType & returns true if a line matches ddmmm-ddmmm yyyy mm/dd/yy hh:mm
     * @returns {boolean} true if line matches
     *
     */
    this.testForRosterDateLine = function() {
        if ((this.matchedFields = this.matchRosterDateLine.exec(this.line)) !== null) {
            console.log("Found a roster date line");
            this.lineType = this.lineTypeEnum.rosterDateLine;
            return true;
        }
        return false;
    }
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
            this.parser.decodeError(this.parser.ERROR_MSG_ROSTER_DATE_LINE);

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
        if ((this.matchedFields = this.matchRosterType.exec(this.line)) !== null) {
            console.log("Found a roster type line");
            this.lineType = this.lineTypeEnum.rosterType;
            return true;
        }
        return false;
    }
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
        if ((this.matchedFields = this.matchCrewInfoLine.exec(this.line)) !== null) {
            console.log("Found a crew info line");
            this.lineType = this.lineTypeEnum.crewInfoLine;
            return true;
        }
        return false;
    }
    //--------------------------------------------------------------------------

    /**
     * Sets the lineType & returns true if a line matches ddmmm-ddmmm yyyy mm/dd/yy hh:mm
     * @returns {boolean} true if line matches
     *
     */
    this.testForBLKLine = function() {
        if ((this.matchedFields = matchBLKLine.exec(this.line)) !== null) {
            console.log("Found a BLK line");
            this.lineType = this.lineTypeEnum.blkLine;
            return true;
        }
        return false;
    }
    //--------------------------------------------------------------------------

    /**
     * Sets the lineType & returns true if a line matches ddmmm-ddmmm yyyy mm/dd/yy hh:mm
     * @returns {boolean} true if line matches
     *
     */
    this.testForDayDutyFSLine = function() {
        if ((this.matchedFields = matchDayDutyFSLine.exec(this.line)) !== null) {
            console.log("Found a DayDutyFS line");
            this.lineType = this.lineTypeEnum.dayDutyFSLine;
            return true;
        }
        return false;
    }
    //--------------------------------------------------------------------------

    /**
     * Sets the lineType & returns true if a line matches ddmmm-ddmmm yyyy mm/dd/yy hh:mm
     * @returns {boolean} true if line matches
     *
     */
    this.testForCrewNamesLine = function() {
        if ((this.matchedFields = matchCrewNamesLine.exec(this.line)) !== null) {
            console.log("Found a CrewNames line");
            this.lineType = this.lineTypeEnum.crewLine;
            return true;
        }
        return false;
    }
    //--------------------------------------------------------------------------
}

Parser.prototype.doCrewInfoLineAction = function() {
    //  'LIDDJ818995 CA LGW sen 1308 737
    //	  [1]  [2]  [3] [4]     [5]  [6]
    // matchCrewInfoLine = /^\s*([A-Z]{5})\s*(\d{6})\s*(CA|FO).+(LGW|LHR).+(\d{4})\s+(\d{3}).*$/,

    console.log("Doing crewInfoLineAction");

    var f = this.matchedFields,
    alertMsg = '';

    this.roster.crewStatus = f[3];
    this.roster.seniority = f[5];

    // Do some cross checking to make sure roster is valid
    if (this.roster.nameCode !== f[1]) {
        alertMsg = "CrewCode doesn't match.\n";
    }
    if (this.roster.staffNo !== f[2]) {
        alertMsg += "Staff No' doesn't match.\n";
    }
/*    if (this.roster.homeBase !== f[4]) {
        alertMsg += "Home base doesn't match.\n";
    }*/
    if (alertMsg !== '') {
        alert("Parsing error in lines 1 & " + this.lineNo + " :" + alertMsg);
    }

};
//---------------
Parser.prototype.doBLKLineAction = function() {

    this.publishedDutyHours = this.getBlkHrs(this.matchedFields);
    console.log("dutyHours:" + this.publishedDutyHours);
    this.duties = [];

};
// Use a separate function to return the value so can be used more easily in unit testing
Parser.prototype.getBlkHrs = function(match) {
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


//--------------------
Parser.prototype.doDayDutyFSLineAction = function() {
    console.log("Doing dayDutyFSLineAction");
};

Parser.prototype.doDutyLineAction = function() {
    console.log("Doing dutyLineAction");
};

Parser.prototype.doMultiDayLineAction = function() {
    console.log("Doing multi-day lineAction");
};

Parser.prototype.doGndDutyLineAction = function() {
    console.log("Doing gnd dutyLineAction");
};

Parser.prototype.doFlyingDutyLineAction = function() {
    console.log("Doing flying dutyLineAction");
};

Parser.prototype.doTripCrewLineAction = function() {
    console.log("Doing tripCrewLineAction");
};

Parser.prototype.doCrewLineAction = function() {
    console.log("Doing crewLineAction");
};

Parser.prototype.doAnyOtherLineAction = function() {
    console.log("Doing anyOtherLineAction");
};


Parser.prototype.checkForTripCrewLine = function(line, match) {
    // Trip: Crew
    var matchTripCrewLine = /^\s*Trip:?\s+Crew.*$/;

    if ((match = matchTripCrewLine.exec(line)) !== null) {
        console.log("Found a Trip Crew line");
        this.state.foundTripCrewLine();
        return true;
    }
    return false;
};

Parser.prototype.parse = function() {
    var matchDashedLine = /^-+$/,
    //
    matchMultiDayLine = /^ *([ \d| ]\d)-([ \d| ]\d) (.*)$/,
    //
    matchFlyingDutyLine = /^ *(\d{1,2}) (MO|TU|WE|TH|FR|SA|SU) (\d{4})\s+(.*$)/,
    //
    matchGndDutyLine = /^ *(\d{1,2}) (MO|TU|WE|TH|FR|SA|SU) \s+(.*)$/,

    parsing = false;

    this.state = this.lookingForMetaDataState;
    
    while (this.roster.rosterText.hasNext()) {
        this.line = this.roster.rosterText.next(); // next non-blank line
        this.lineNo = this.roster.rosterText.getLineNo();
        console.log(this.line);
        //skip dashed lines
        if (matchDashedLine.exec(this.line)) {
            console.log("Found a dashed line");
            continue;
        }

        if (this.state === this.lookingForDutyLineState) {
            // Trip Crew line - signifies end of duty lines & start of crew names list
            if (this.checkForTripCrewLine(this.line, this.matchedFields)) {
                continue;
            }
            // Multi Day
            if ((this.matchedFields = matchMultiDayLine.exec(this.line)) !== null) {
                console.log("Found a Multi Day line");
                this.doMultiDayLineAction();
                continue;
            }
            // Flying Duty
            if ((this.matchedFields = matchFlyingDutyLine.exec(this.line)) !== null) {
                console.log("Found a Flying Duty line");
                this.doFlyingDutyLineAction();
                continue;
            }
            // Ground Duty
            if ((this.matchedFields = matchGndDutyLine.exec(this.line)) !== null) {
                console.log("Found a Gnd Duty line");
                this.doGndDutyLineAction();
                continue;
            }
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