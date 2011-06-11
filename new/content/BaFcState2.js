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

YAHOO.rp.BaFcStateMaker = function () {
    this.name = 'Default State';
//    this.parser = undefined;
    this.testList = [];
    this.ignoreUnrecognisedLines = true;
};

YAHOO.rp.BaFcStateMaker.prototype.enter = function () {
    console.log("Entering State: " + this.name);
//    return this;
};

YAHOO.rp.BaFcStateMaker.prototype.exit = function () {
    console.log("Exiting State: " + this.name);
//    return this;
};

YAHOO.rp.BaFcStateMaker.prototype.changeState = function (s) {
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
	console.log('Unknown state: ' + s);
    }
    return undefined;
};

YAHOO.rp.BaFcStateMaker.prototype.analyseLine = function () {
    var i = 0,
        nextState,
        x,test,action,
	dontSkipRestOfTests,
	unrecognisedLine = true;
    if (typeof this.parser !== 'object') {
        throw "StateMaker.AnalyseLine: parser object not defined";
    }
    while (i < this.testList.length) {
        x = this.testList[i];
	i += 1;
        test = this.parser[x.test];
        if (typeof test !== 'function') {
            console.log('Unrecognised test function:' + x.test);
            continue;
        }
        action = this.parser[x.action];
        if (typeof action !== 'function') {
            console.log('Unrecognised action function:' + x.action);
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
    return (unrecognisedLine && !this.ignoreUnrecognisedLines);
};

// the static factory method
YAHOO.rp.BaFcStateMaker.factory = function(stateType,parser) {
    var constr = stateType,
	newState,
	Sm = YAHOO.rp.BaFcStateMaker;
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
    console.log("Creating new " + newState.name);
    return newState;
};

YAHOO.rp.BaFcStateMaker.LookingForMetaDataState = function () {
    this.name = 'MetaData State';
    this.testList =[{ test: 'testForRosterDateLine',
                    action: 'doRosterDateLineAction'},
                    { test: 'testForRosterTypeLine',
                    action: 'doRosterTypeLineAction'},
                    { test: 'testForCrewInfoLine',
                    action: 'doCrewInfoLineAction'},
                    { test: 'testForBLKLine',
                    action: 'doBLKLineAction',
                    nstate: 'buildingSummaryState'}];

};

YAHOO.rp.BaFcStateMaker.BuildingSummaryState = function () {
    this.name = 'Building summary';

    this.enter = function() {
        console.log("Entering State: " + this.name);
	this.parser.buildSummaryEnter();
    };
    this.analyseLine = function() {
	if (this.parser.buildSummary() === true) {
	    this.changeState('lookingForDutyState');
	}
    };
    this.exit = function() {
        console.log("Exiting State: " + this.name);
	this.parser.buildSummaryExit();
    };

};
YAHOO.rp.BaFcStateMaker.LookingForDutyState = function () {
    this.name = "Looking for Duty State";

    this.testList =[{ test: 'testForTripCrewLine',
                    action: 'doTripCrewLineAction',
		    nstate: 'getCrewNamesState'},
		    { test: 'testForCrewNamesLine',
                    action: 'doCrewNamesLineAction',
		    nstate: 'getCrewNamesState'},
                    { test: 'testForFlyingDutyLine',
                    action: 'doFlyingDutyLineAction'},
                    { test: 'testForRestDayLine',
                    action: 'doRestDayLineAction'},
                    { test: 'testForGndDutyLine',
                    action: 'doGndDutyLineAction'}];
};
YAHOO.rp.BaFcStateMaker.GetCrewNamesState = function () {
    this.name = "Get Crew Names State";

    this.testList =[{ test: 'testForCrewNamesLine',
                    action: 'doCrewNamesLineAction'}];
};
