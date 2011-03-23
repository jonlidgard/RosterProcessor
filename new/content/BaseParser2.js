


/*jslint white: false */

"use strict";

function BaFcDefaultState () {

    this.parser = undefined;

    // Error messages
    this.ERROR_MSG_ROSTER_DATE_LINE = "Roster date line";
    this.ERROR_MSG_CREW_INFO_LINE = "Crew info' line";
    this.ERROR_MSG_ANY_OTHER_LINE = "line";

    // !!! Functions added in constructor will overide ones added as prototypes. !!!    

    function decodeError (errorMessage) {
        throw "Unexpected " + errorMessage + " found - line " + this.parser.lineNo;
    }

    function foundRosterDateLine () {
        this.decodeError(this.ERROR_MSG_ROSTER_DATE_LINE);
    }

    function foundCrewInfoLine () {
        this.decodeError(this.ERROR_MSG_CREW_INFO_LINE);
    }

}


BaFcDefaultState.prototype.anyOtherLine = function () {
    if (this.parser.ignoreLines === false) {
        this.decodeError(this.ERROR_MSG_ANY_OTHER_LINE);
    }
};


//----

function BaFcLookingForRosterDateLineState () { // old - startState
    function foundRosterDateLine () {
        this.parser.doRosterDateLineAction ();
        this.parser.state = this.parser.lookingForCrewInfoLineState;
    }
}

BaFcLookingForRosterDateLineState.prototype = new BaFcDefaultState();

function BaFcLookingForCrewInfoLineState () { // old - startState
    function foundCrewInfoLine () {
        this.parser.doCrewInfoLineAction ();
        this.parser.state = this.parser.lookingForBlkLine;
    }
}

BaFcLookingForCrewInfoLineState.prototype = new BaFcDefaultState();



function Roster () {
    this.WHOLEDAY = +86400000;
    this.ONEMINUTE = +60000;
    this.POSTFLIGHTDUTYTIME = +1800000; // 1/2 hour
    this.PREFLIGHTDUTYTIME = +3600000; // 1 hour
    this.LHRCCPREFLIGHTDUTYTIME = +4800000; // 01:20
    this.MINREST = +39600000; // 11 hours

    this.rosterText = function () {
        var index = 0,
        lines = [],
        length = lines.length;
    
        return {
            next : function () {
                var element;
                do {
                    if (!this.hasNext()) {
                        return null;
                    }
                    element = lines[index].trim(); // Need to check for trim - only in ECMA 5, else add function
                    index += 1;
                
                    // skip blank lines
                }while (element.length === 0);
                return element;
            },
            lineNo : function () {
                return index + 1;
            }
        };
    };
}

//Constructor
function baseParser (roster) {
    this.roster = new Roster();
    this.dutyDate = new Date(); // RPDate.Create ??
    this.line = '';
}

function parser (roster) {
    
    this.lookingForDateLineState = new BaFcLookingForRosterDateLineState();
    this.lookingForCrewInfoLineState = new BaFcLookingForCrewInfoLineState();
    
    
    this.roster = new Roster();
    this.dutyDate = new Date(); // RPDate.Create ??
    this.line = '';
    this.state = undefined;
}

parser.prototype.doRosterDateLineAction = function () {
};

parser.prototype.doCrewInfoLineAction = function () {
};

parser.prototype.parse = function () {
    var matchDashedLine = /^-+$/, //TO-CHECK
        matchRosterDateLine = /([0-1][0-9])\/([0-9][0-9])\/([0-9][0-9])\s+([0-2][0-9]):([0-5][0-9])/, // TO-CHECK
        matchCrewInfoLine = /^$/,  // TODO

        parsing = false;
    
    this.state = this.lookingForDateLineState;
    
    while (this.roster.rosterText.hasNext()) {
        this.line = this.roster.rosterText.next(); // next non-blank line
        
        //skip dashed lines
        if (matchDashedLine.exec(this.line)) {
            continue;
        }
        
        if (matchRosterDateLine.exec(this.line)) {
        this.state.foundRosterDateLine();
        continue;
        }

        if (matchCrewInfoLine.exec(this.line)) {
        this.state.foundCrewInfoLine();
        continue;
        }
    }
};
