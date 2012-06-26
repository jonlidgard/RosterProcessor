


/*jslint white: false */

"use strict";
 
var fcp = RP.namespace("RP.parsers.baFc"); 

fcp.defaultState = function () {

    this.parser = undefined;

    // Error messages
    this.ERROR_MSG_ROSTER_DATE_LINE = "Roster date";
    this.ERROR_MSG_ANY_OTHER_LINE = "line";
    
    function decodeError (errorMessage) {
        throw "Unexpected " + errorMessage + " found - line " + this.parser.lineNo;
    }

    function rosterDateLine () {
        this.decodeError(this.ERROR_MSG_ROSTER_DATE_LINE);
    }


};

fcp.defaultState.prototype.anyOtherLine = function () {
    if (this.parser.ignoreLines === false) {
        this.decodeError(this.ERROR_MSG_ANY_OTHER_LINE);
    }
};


//----

fcp.lookingForRosterDateLineState = function  () { // old - startState
    function foundRosterDateLine () {
        this.parser.doRosterDateLineAction ();
        this.parser.state = fcp.lookingForCrewInfoLineState;
    }
};

fcp.lookingForRosterDateLineState.prototype = fcp.defaultState;

fcp.lookingForCrewInfoLineState = function () { // old - startState
    function foundRosterDateLine () {
        this.parser.doCrewInfoLineAction ();
        this.parser.state = fcp.lookingForBlkLine;
    }
};

fcp.lookingForCrewInfoLineState.prototype = fcp.defaultState;



//Constructor
fcp.baseParser = function (roster) {
    this.roster = roster;
    this.dutyDate = new Date(); // RPDate.Create ??
    this.lineNo = +0;
    this.line = '';
};

fcp.parser = function (roster) {
    this.roster = roster;
    this.dutyDate = new Date(); // RPDate.Create ??
    this.lineNo = +0;
    this.line = '';


};

fcp.parser.prototype.
