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
    this.parser = undefined;
    this.testList = [];
};

YAHOO.rp.BaFcStateMaker.prototype.enter = function () {
    console.log("Entering State: " + this.name);
    return this;
};

YAHOO.rp.BaFcStateMaker.prototype.exit = function () {
    console.log("Exiting State: " + this.name);
    return this;
};

YAHOO.rp.BaFcStateMaker.prototype.changeState = function (s) {
    var newState = this.parser.states[s];
    if (typeof newState === 'function') {
        this.exit();
        this.prevState = this;
        newState.enter();
        this.parser.state = newState;
        return newState;
    }
    return undefined;
};

YAHOO.rp.BaFcStateMaker.prototype.analyseLine = function () {
    var i = 0,
        nextState = undefined,
        x,test,action,
	skipRestOfTests;
    if (typeof this.parser !== 'object') {
        return;
    }
    while (i < this.testList.length) {
        x = this.testList[i];
        test = this.parser[x['test']];
        if (typeof test !== 'function') {
            console.log('Unrecognised test function:' + x['test']);
            continue;
        }
        action = this.parser[x['action']];
        if (typeof action !== 'function') {
            console.log('Unrecognised action function:' + x['action']);
            continue;
        }
        nextState = x['nstate'];
        if ( test.apply(this.parser) === true ) {
            skipRestOfTests = action.apply(this.parser);
            if (typeof nextState !== 'undefined') {
                this.changeState(nextState);
            }
            if (skipRestOfTests === true) {
		break;
            }
        }
    }
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
/*
    that.foundBLKLine = function() {
        parser.ignoreUnrecognisedLines = true; // Ignore the cruft between BLK & DAY DUTY FS
    };
    that.foundDayDutyFSLine = function() {
	parser.ignoreUnrecognisedLines = false; // Don't ignore lines frome here-on.
    };
*/
};

YAHOO.rp.BaFcStateMaker.BuildingSummaryState = function () {
    this.name = 'Building summary';

    this.analyseLine = function () {
	this.parser.buildSummary();
    };
};
YAHOO.rp.BaFcStateMaker.GetGndDutiesState = function () {
    this.name = "Gnd Duty State";

    this.testList =[{ test: 'testForTripCrewLine',
                    action: 'doFirstPassTripCrewLineAction'},
                    { test: 'testForMultiDayLine',
                    action: 'doMultiNotRestDayLineAction'},
                    { test: 'testForGndDutyLine',
                    action: 'doGndNotRestDutyLineAction'}];
};

YAHOO.rp.BaFcStateMaker.InACarryInTripState = function () {
    this.name = "Carry-In Trip State";

    this.testList =[{ test: 'testForTripCrewLine',
                    action: 'doSecondPassTripCrewLineAction',
		    nstate: 'lookingForCrewLineState'},
                    { test: 'testForFlyingDutyLine',
                    action: 'doFlyingDutyLineAction',
		    nstate: 'inAFlyingDutyState'},
                    { test: 'testForMultiDayLine',
                    action: 'doMultiRestDayLineAction'},
                    { test: 'testForGndDutyLine',
                    action: 'doRestDayLineAction'}];

    this.enter = function () {
	YAHOO.rp.BaFcStateMaker.prototype.enter.call(this);
	this.parser.getCarryInTrip();
	return this;
    };

    this.exit = function () {
	YAHOO.rp.BaFcStateMaker.prototype.exit.call(this);
	this.parser.finishTrip();
	return this;
    };
};

YAHOO.rp.BaFcStateMaker.LookingForTripState = function () {
    this.name = "Looking for Trip State";

    this.testList =[{ test: 'testForTripCrewLine',
                    action: 'doSecondPassTripCrewLineAction',
		    nstate: 'lookingForCrewLineState'},
                    { test: 'testForTripLine',
                    action: 'doTripLineAction',
		    nstate: 'inATripState'}];
};

YAHOO.rp.BaFcStateMaker.InATripState = function () {
    this.name = "In a Trip State";

    this.testList =[{ test: 'testForTripCrewLine',
                    action: 'doSecondPassTripCrewLineAction',
		    nstate: 'lookingForCrewLineState'},
                    { test: 'testForFlyingDutyLine',
                    action: 'doFlyingDutyLineAction',
		    nstate: 'inAFlyingDutyState'},
                    { test: 'testForMultiDayLine',
                    action: 'doMultiRestDayLineAction'},
                    { test: 'testForGndDutyLine',
                    action: 'doRestDayLineAction'}];

    this.enter = function () {
	YAHOO.rp.BaFcStateMaker.prototype.enter.call(this);
	this.parser.startNewTrip();
	return this;
    };

    this.exit = function () {
	YAHOO.rp.BaFcStateMaker.prototype.exit.call(this);
	this.parser.finishTrip();
	return this;
    };

};
YAHOO.rp.BaFcStateMaker.InAFlyingDutyState = function () {
};
YAHOO.rp.BaFcStateMaker.GetCrewNamesState = function () {
    this.name = "In a Trip State";

    this.testList =[{ test: 'testForCrewNames',
                    action: 'doCrewNamesLineAction'}];
};
