


/*jslint white: false */

"use strict";

function BaFcDefaultState (parser) {

    this.parser = parser;

    // Error messages
    this.ERROR_MSG_ROSTER_DATE_LINE = "Unexpected Roster date line";
    this.ERROR_MSG_CREW_INFO_LINE = "Unexpected Crew info' line";
    this.ERROR_MSG_BLK_LINE = "Unexpected BLK hh.nn line";
    this.ERROR_MSG_DAY_DUTY_FS_LINE = "Unexpected Day Duty F L I G H T  S E Q U E N C E line";
    this.ERROR_MSG_ANY_OTHER_LINE = "Unrecognised line";
    this.ERROR_MSG_TRIP_CREW_LINE = "Unexpected Trip: Crew Names: line";
    this.ERROR_MSG_CREW_LINE = "Unexpected Crew names line";
    this.ERROR_MSG_DUTY_LINE = "Unexpected Duty line";

    // !!! Functions added in constructor will overide ones added as prototypes. !!!    

    this.decodeError = function (errorMessage) {
        throw errorMessage + " found - line " + this.parser.lineNo;
    };

    this.foundRosterDateLine = function () {
        this.decodeError(this.ERROR_MSG_ROSTER_DATE_LINE);
    };

    this.foundCrewInfoLine = function () {
        this.decodeError(this.ERROR_MSG_CREW_INFO_LINE);
    };

    this.foundBLKLine = function () {
        this.decodeError(this.ERROR_MSG_BLK_LINE);
    };

    this.foundCrewLine = function () {
        this.decodeError(this.ERROR_MSG_CREW_LINE);
    };

    this.foundTripCrewLine = function () {
        this.decodeError(this.ERROR_MSG_TRIP_CREW_LINE);
    };

    this.foundDayDutyFSLine = function () {
        this.decodeError(this.ERROR_MSG_DAY_DUTY_FS_LINE);
    };

    this.foundDutyLine = function () {
        this.decodeError(this.ERROR_MSG_DUTY_LINE);
    };

    this.foundOtherLine = function () {
        if (this.parser.ignoreUnrecognisedLines === false) {
            this.decodeError(this.ERROR_MSG_ANY_OTHER_LINE);
        }
    };
}


//----

function BaFcLookingForRosterDateLineState (parser) { // old - startState
    this.parser = parser;
    this.foundRosterDateLine = function () {
        this.parser.doRosterDateLineAction ();
        this.parser.state = this.parser.lookingForCrewInfoLineState;
    };
}
BaFcLookingForRosterDateLineState.prototype = new BaFcDefaultState();

//---
function BaFcLookingForCrewInfoLineState (parser) { // old - startState
    this.parser = parser;
    this.foundCrewInfoLine = function () {
        this.parser.doCrewInfoLineAction ();
        this.parser.state = this.parser.lookingForBLKLineState;
    };
}

BaFcLookingForCrewInfoLineState.prototype = new BaFcDefaultState();

//---
function BaFcLookingForBLKLineState (parser) { // old - startState
    this.parser = parser;
    this.foundBLKLine = function () {
        this.parser.doBLKLineAction ();
        this.parser.state = this.parser.lookingForDayDutyFSLineState;
    };
}
BaFcLookingForBLKLineState.prototype = new BaFcDefaultState();

//---
function BaFcLookingForDayDutyFSLineState (parser) { // old - startState
    this.parser = parser;
    this.foundDayDutyFSLine = function () {
        this.parser.doDayDutyFSLineAction ();
        this.parser.state = this.parser.lookingForDutyLineState;
    };
}
BaFcLookingForDayDutyFSLineState.prototype = new BaFcDefaultState();

//---
function BaFcLookingForDutyLineState (parser) { // old - startState
    this.parser = parser;
    this.foundDutyLine = function () {
        this.parser.doDutyLineAction ();
    };

    this.foundTripCrewLine = function () {
        this.parser.doTripCrewLineAction ();
        this.parser.state = this.parser.lookingForCrewLineState;
    };
}
BaFcLookingForDutyLineState.prototype = new BaFcDefaultState();

//---
function BaFcLookingForCrewLineState (parser) { // old - startState
    this.parser = parser;
    this.foundCrewLine = function () {
        this.parser.doCrewLineAction ();
        this.parser.ignoreUnrecognisedLines = true;
    };
}

BaFcLookingForCrewLineState.prototype = new BaFcDefaultState();
//---

function Roster (rosterLines) {
    this.WHOLEDAY = +86400000;
    this.ONEMINUTE = +60000;
    this.POSTFLIGHTDUTYTIME = +1800000; // 1/2 hour
    this.PREFLIGHTDUTYTIME = +3600000; // 1 hour
    this.LHRCCPREFLIGHTDUTYTIME = +4800000; // 01:20
    this.MINREST = +39600000; // 11 hours

    this.rosterText = (function () {
        var index = 0,
        lines = rosterLines.split('\n'),
        length = lines.length;
    
        return {
            next : function () {
                var element;
                do {
                    if (!this.hasNext()) {
                        return null;
                    }
                    element = lines[index]; // Need to check for trim - only in ECMA 5, else add function
                    index += 1;
                
                    // skip blank lines
                }while (element.length === 0);
                return element;
            },
            hasNext: function () {
                return index < length;
            },
            getLineNo : function () {
                return index;
            }
        };
    }());
}

//Constructor
function baseParser (roster) {
    this.roster = new Roster();
    this.dutyDate = new Date(); // RPDate.Create ??
    this.line = '';
    this.lineNo = 0;
}

function Parser (theRoster) {
    
    this.lookingForDateLineState = new BaFcLookingForRosterDateLineState(this);
    this.lookingForCrewInfoLineState = new BaFcLookingForCrewInfoLineState(this);
    this.lookingForBLKLineState = new BaFcLookingForBLKLineState(this);
    this.lookingForDayDutyFSLineState = new BaFcLookingForDayDutyFSLineState(this);
    this.lookingForDutyLineState = new BaFcLookingForDutyLineState(this);
    this.lookingForCrewLineState = new BaFcLookingForCrewLineState(this);
    
    
    this.roster = theRoster;
    this.dutyDate = new Date(); // RPDate.Create ??
    this.line = '';
    this.lineNo = 0;
    this.state = undefined;
    this.ignoreUnrecognisedLines = false;
}

Parser.prototype.doRosterDateLineAction = function () {
    console.log("Doing rosterDateLineAction");
};

Parser.prototype.doCrewInfoLineAction = function () {
    console.log("Doing crewInfoLineAction");
};

Parser.prototype.doBLKLineAction = function () {
    console.log("Doing BLKLineAction");
    this.ignoreUnrecognisedLines = true; // Ignore the cruft between BLK & DAY DUTY FS
};

Parser.prototype.doDayDutyFSLineAction = function () {
    console.log("Doing dayDutyFSLineAction");
    this.ignoreUnrecognisedLines = false; // Don't ignore lines frome here-on.
};

Parser.prototype.doDutyLineAction = function () {
    console.log("Doing dutyLineAction");
};

Parser.prototype.doMultiDayLineAction = function () {
    console.log("Doing multi-day lineAction");
};

Parser.prototype.doGndDutyLineAction = function () {
    console.log("Doing gnd dutyLineAction");
};

Parser.prototype.doFlyingDutyLineAction = function () {
    console.log("Doing flying dutyLineAction");
};


Parser.prototype.doTripCrewLineAction = function () {
    console.log("Doing tripCrewLineAction");
};

Parser.prototype.doCrewLineAction = function () {
    console.log("Doing crewLineAction");
};

Parser.prototype.doAnyOtherLineAction = function () {
    console.log("Doing anyOtherLineAction");
};



Parser.prototype.parse = function () {
    var matchDashedLine = /^-+$/,
        // '01APR-30APR 2011 01/03/11 14:50
        matchRosterDateLine = /^.*([0-3][0-9])([A-Z]{3})-([0-3][0-9])([A-Z]{3}) (\d{4})\s+([0-3][0-9])\/([0-9][0-9])\/([0-9][0-9])\s+([0-2][0-9]):([0-5][0-9])\s*$/, // TO-CHECK
        //  'LIDDJ818995 CA LGW sen 1308 737
        matchCrewInfoLine = /^\s*([A-Z]{5})\s*(\d{6})\s*(CA|FO).+(LGW|LHR).+(\d{4})\s+(\d{3}).*$/,
        // BLK. 79.45
        matchBLKLine = /^.*BLK\.*\s+(\d{1,3})\.(\d{2}).*$/,
        // DAY DUTY F L I G H T  S E Q U E N C E
        matchDayDutyFSLine = /^\s*DAY\s+DUTY\s+F[LIGHTSEQUNC ]+$/,
        // Trip: Crew
        matchTripCrewLine = /^\s*Trip:?\s+Crew.*$/,        
        // 1234 01 Firstname Lastname.
        matchCrewNamesLine = /^\s*(\d{4})\/(\d{2})(\s+([A-Za-z]+)\s+([A-Za-z]+)\.?)+\s*$/,
        //
        matchMultiDayLine = /^ *([ \d| ]\d)-([ \d| ]\d) (.*)$/,
        //
        matchFlyingDutyLine = /^ *(\d{1,2}) (MO|TU|WE|TH|FR|SA|SU) (\d{4})\s+(.*$)/,
        //
        matchGndDutyLine = /^ *(\d{1,2}) (MO|TU|WE|TH|FR|SA|SU) \s+(.*)$/,
        
        parsing = false;
    
    this.state = this.lookingForDateLineState;

    while (this.roster.rosterText.hasNext()) {
        this.line = this.roster.rosterText.next(); // next non-blank line
        this.lineNo = this.roster.rosterText.getLineNo();
        console.log(this.line);
        //skip dashed lines
        if (matchDashedLine.exec(this.line)) {
        console.log("Found a dashed line");
            continue;
        }
        
        if (this.state===this.lookingForDutyLineState) {
            // Trip Crew line - signifies end of duty lines & start of crew names list
            if (matchTripCrewLine.exec(this.line)) {
                console.log("Found a Trip Crew line");
                this.state.foundTripCrewLine();
                continue;
            }
            // Multi Day
            if (matchMultiDayLine.exec(this.line)) {
                console.log("Found a Multi Day line");
                this.doMultiDayLineAction();
                continue;
            }
            // Flying Duty
            if (matchFlyingDutyLine.exec(this.line)) {
                console.log("Found a Flying Duty line");
                this.doFlyingDutyLineAction();
                continue;
            }
            // Ground Duty
            if (matchGndDutyLine.exec(this.line)) {
                console.log("Found a Gnd Duty line");
                this.doGndDutyLineAction();
                continue;
            }
        }
        
        if (matchRosterDateLine.exec(this.line)) {
        console.log("Found a roster date line");
        this.state.foundRosterDateLine();
        continue;
        }

        if (matchCrewInfoLine.exec(this.line)) {
        console.log("Found a crew info line");
        this.state.foundCrewInfoLine();
        continue;
        }

        if (matchBLKLine.exec(this.line)) {
        console.log("Found a BLK line");
        this.state.foundBLKLine();
        continue;
        }

        if (matchDayDutyFSLine.exec(this.line)) {
        console.log("Found a DayDutyFS line");
        this.state.foundDayDutyFSLine();
        continue;
        }

        if (matchCrewNamesLine.exec(this.line)) {
        console.log("Found a CrewNames line");
        this.state.foundCrewLine();
        continue;
        }

       // this.state.foundOtherLine();
    }
};
