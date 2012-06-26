/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */

/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */

/*globals YAHOO */

/*jslint white: false, devel: true */


/* Trip parsing:

    States:
	lookingForMetaData
	lookingForGndDuty
	inACarryInTrip
	lookingForTrip
	inATrip
	inADuty
	lookingForCrewNames
    Scan through until you come across first flying duty or end of month:
    if origin != LGW or LHR then create a new trip, mark as incomplete,
    add all duties up until this flying duty (which should only be downroute
    rest days).
*/

"use strict";

YAHOO.rp.BaCcParserStatesEnum = {
    LOOKINGFORDUTYSTATE : 'LookingForDutyState',
    INFLYINGDUTYSTATE : 'InFlyingDutyState',
    LOOKINGFORCREWNAMEORDUTYSTATE : 'LookingForCrewNameOrDutyState',
    MESSAGELINESSTATE : 'MessageLinesState'
};

YAHOO.rp.BaCcStateMaker = function () {
    this.name = 'Default State';
//    this.parser = undefined;
    this.testList = [];
    this.ignoreUnrecognisedLines = true;
    this.stateNamesEnum = YAHOO.rp.BaCcParserStatesEnum;
 
};

YAHOO.rp.BaCcStateMaker.prototype.enter = function () {
    YAHOO.log("Entering State: " + this.name);
//    return this;
};

YAHOO.rp.BaCcStateMaker.prototype.exit = function () {
    YAHOO.log("Exiting State: " + this.name);
//    return this;
};

YAHOO.rp.BaCcStateMaker.prototype.changeState = function (s) {
    var newState = this.parser.states[s];
    if (typeof newState === 'object') {
        if (typeof this.exit === 'function') {
	    this.exit();
	}
        this.prevState = this;
        if (typeof newState.enter === 'function') {
            newState.enter();
	}
        this.parser.state = newState;
        return newState;
    }
    else {
	YAHOO.log('Unknown state: ' + s);
    }
    return undefined;
};

YAHOO.rp.BaCcStateMaker.prototype.analyseLine = function () {
    var i,
        nextState,
        x,test,action,switchNow,
	dontSkipRestOfTests,
	unrecognisedLine = true,
	reRunTests = true; // used by switchNow to immediately change to a new state & re-test
    if (typeof this.parser !== 'object') {
        throw "StateMaker.AnalyseLine: parser object not defined";
    }
    while (reRunTests) {
	i = 0;
        while (i < this.testList.length) {
	    x = this.testList[i];
	    i += 1;
	    switchNow = this.parser[x.switchNow];
	    if (typeof switchNow !== 'undefined') {
		this.changeState(switchNow);
		break;
	    }
	    reRunTests = false;
	    test = this.parser[x.test];
	    if (typeof test !== 'function') {
		YAHOO.log('Unrecognised test function:' + x.test);
		continue;
	    }
	    action = this.parser[x.action];
	    if (typeof action !== 'function') {
		YAHOO.log('Unrecognised action function:' + x.action);
		continue;
	    }
	    nextState = x.nstate;
	    if ( test.apply(this.parser) === true ) {
		unrecognisedLine = false;
		dontSkipRestOfTests = action.apply(this.parser);
		if (typeof nextState !== 'undefined') {
		    this.changeState(nextState);
		}
		if (typeof dontSkipRestOfTests === 'undefined' || dontSkipRestOfTests === false) {
		    break;
		}
	    }
	}
    }
    return (unrecognisedLine && !this.ignoreUnrecognisedLines);
};

// the static factory method
YAHOO.rp.BaCcStateMaker.factory = function(stateType,parser) {
    var constr = stateType,
	newState,
	Sm = YAHOO.rp.BaCcStateMaker;
    // error if the constructor doesn't exist
    if (typeof Sm[constr] !== "function") {
	throw {
	    name: "Error",
	    message: constr + " doesn't exist"
	};
    }
    // at this point the constructor is known to exist
    // let's have it inherit the parent but only once
    if (typeof Sm[constr].prototype.enter !== "function") {
	Sm[constr].prototype = new Sm();
    }
    // create a new instance
    newState = new Sm[constr]();
    // optionally call some methods and then return...
    newState.parser = parser;
    YAHOO.log("Creating new " + newState.name);
    return newState;
};

YAHOO.rp.BaCcStateMaker.LookingForDutyState = function () {
    this.name = 'Looking for Duty State';
    this.testList =[{ test: 'testForDateInLine',
                    action: 'doDateInLineAction'},
		    
		    { test: 'testForGndDutyLine',
                    action: 'doGndDutyLineAction'},

		    { test: 'testForMultiDayLine',
                    action: 'doMultiDayLineAction'},

                    { test: 'testForReportLine',
                    action: 'doReportLineAction',
		    nstate: 'InFlyingDutyState'},

                    { test: 'testForMessagesLine',
                    action: 'doMessagesLineAction'}];
};

YAHOO.rp.BaCcStateMaker.InFlyingDutyState = function () {
    this.name = 'In A Flying Duty';

    this.testList =[{ test: 'testForDateInLine',
                    action: 'doDateInLineAction'},
		    
		    { test: 'testForTripLengthLine',
                    action: 'doTripLengthLineAction'},

		    { test: 'testForSectorLine',
                    action: 'doSectorLineAction'},

		    { test: 'testForClearLine',
                    action: 'doClearLineAction'},

		    { test: 'testForTotalDutyLine',
                    action: 'doTotalLineAction',
		    nstate: 'LookingForDutyOrCrewNamesState'}];
};

YAHOO.rp.BaCcStateMaker.LookingForCrewNameOrDutyState = function () {
    this.name = "Looking for Crew Name or Duty State";

    this.testList =[{ test: 'testForCrewNamesLine',
                    action: 'doCrewNamesLineAction'},
    
		    { switchNow : 'LookingForDutyState' }]; 
};

YAHOO.rp.BaCcStateMaker.MessageLinesState = function () {
    this.name = "Message Lines State";
    this.testList =[{ test: 'testForCrewNamesLine',
                    action: 'doCrewNamesLineAction'}];
    };
