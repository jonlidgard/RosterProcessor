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




  if not in a trip & duty line:
    possibilities:
	1) Start of new trip, ex home base
	2) In a trip at start of month & returning home.

    In a trip:
	duty line:
	1) another duty as part of trip
	2) start of another trip

	gnd duty or multi day:
	1) If it's a rest day it could be
		1) mid trip
		2) at end of trip if clearing during next day

    A trip is starting if:
	flying duty & origin = LGW or LHR (even if LIMO sector) && not in a trip   OR
	flying duty | rest

*/

"use strict";

/* For description of 'that' & it's use in inheritance, see
  Doug Crockford JS 3 - Functions video at yui theater
*/

YAHOO.rp.BaFcStateMaker = function () {
    this.name = 'Default State';
    var testList = [],
        parser;
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
    this.exit();
    this.prevState = this;
    s.enter();
    return s;
};

YAHOO.rp.BaFcStateMaker.prototype.analyseLine = function (rosterText) {
    var i = 0,
        nextState = undefined,
        txt = rosterText.next().text,
        x;
    while (i < testList.length && typeof testList[i] === 'function' ) {
        x = testList[i];
        if ( parser[x['test']](txt,parser) === true ) {
            if (parser[x['action']](rosterText,parser) === true) {
                nextState = x['nState'];
                if (typeof nextState !== 'undefined') {
                    this.changeState(nextState);
                }
                break;
            }
        }
    }
};


YAHOO.rp.BaFcStateMaker.prototype.testForRosterDateLine = function () {
    return false;
};

YAHOO.rp.BaFcStateMaker.prototype.testForRosterTypeLine = function () {
    return false;
};

YAHOO.rp.BaFcStateMaker.prototype.testForCrewInfoLine = function () {
    return false;
};

YAHOO.rp.BaFcStateMaker.prototype.testForBLKLine = function () {
    return false;
};
/*
YAHOO.rp.BaFcStateMaker.prototype.testForRosterDateLine = function () {
    return false;
};

        testForCrewNamesLine : function() {
            return false;
        },
        testForTripCrewLine : function() {
            return false;
        },
        testForDayDutyFSLine : function() {
            return false;
        },
        testForMultiDayLine : function() {
            return false;
        },
        testForFlyingDutyLine : function() {
            return false;
        },
        testForGndDutyLine : function() {
            return false;
        },

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
        foundDatesLine : function() {
            parser.decodeError(parser.errorMsg.MSG_DATES_LINE);
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
*/

// the static factory method
YAHOO.rp.BaFcStateMaker.factory = function(stateType,parser) {
    var constr = stateType, newState,
	sm = YAHOO.rp.BaFcStateMaker;
    // error if the constructor doesn't exist
    if (typeof sm[constr] !== "function") {
	throw {
	    name: "Error",
	    message: constr + " doesn't exist"
	};
    }
    // at this point the constructor is known to exist
    // let's have it inherit the parent but only once
    if (typeof sm[constr].prototype.enter !== "function") {
	sm[constr].prototype = new sm();
    }
    // create a new instance
    newState = new sm[constr]();
    // optionally call some methods and then return...
    newState.parser = parser;
    console.log("Creating new " + newState.name);
    return newState;
};

// define specific car makers
YAHOO.rp.BaFcStateMaker.MetaDataState = function () {
    this.name = 'MetaData State';
    this.testList =[{ test: 'testForRosterDateLine',
                    action: 'doRosterDateLineAction'},
                    { test: 'testForRosterTypeLine',
                    action: 'doRosterTypeLineAction'},
                    { test: 'testForCrewInfoLine',
                    action: 'doCrewInfoLineAction'},
                    { test: 'testForBLKLine',
                    action: 'doBLKLineAction'},
                    { test: 'testForDatesLine',
                    action: 'doDatesLineAction'},
                    { test: 'testForDayDutyFSLine',
                    action: 'doDayDutyFSLineAction',
                    nstate: 'lookingForGndDutyState'}];
/*
    that.foundBLKLine = function() {
        parser.ignoreUnrecognisedLines = true; // Ignore the cruft between BLK & DAY DUTY FS
    };
    that.foundDayDutyFSLine = function() {
	parser.ignoreUnrecognisedLines = false; // Don't ignore lines frome here-on.
    };
*/
};

//--
YAHOO.rp.BaFcStateMaker.LookingForGndDutyState = function () { // old - startState
    this.name = "Gnd Duty State";

    this.testList =[{ test: 'testForTripCrewLine',
                    action: 'doFirstPassTripCrewLineAction'},
                    { test: 'testForMultiDayLine',
                    action: 'doMultiNotRestDayLineAction'},
                    { test: 'testForGndDutyLine',
                    action: 'doGndNotRestDutyLineAction'}];
};

YAHOO.rp.BaFcStateMaker.InACarryInTripState = function () { // old - startState
    this.name = "Carry-In Trip State";

    that.testForTripCrewLine = function() {
        return parser.testForTripCrewLine();
    };

    that.testForMultiDayLine = function() {
        return parser.testForMultiDayLine();
    };
    that.testForFlyingDutyLine = function() {
        return parser.testForFlyingDutyLine();
    };
    that.testForGndDutyLine = function() {
        return parser.testForGndDutyLine();
    };

    that.foundMultiDayLine = function() {
        // Make sure its a REST day
	if (parser.lineType === parser.lineTypeEnum.multiRestDay) {
	    parser.doMultiRestDayLineAction();
	}
    };
    that.foundFlyingDutyLine = function() {
        parser.state = parser.state.changeState(parser.inAFlyingDutyState);
	parser.currentTrip = parser.startNewTrip();
	parser.doFlyingDutyLineAction();
    };
    that.foundGndDutyLine = function() {
        // Make sure its a REST day
	if (parser.lineType === parser.lineTypeEnum.restDay) {
            parser.doRestDayLineAction();
	}
    };

    that.foundTripCrewLine = function() {
        parser.doTripCrewLineAction();
        parser.state = parser.state.changeState(parser.lookingForCrewLineState);
    };
    return that;
};







YAHOO.rp.BaFcDefaultDutyParserState = function (parser) { // old - startState
    var that = YAHOO.rp.BaFcDefaultState(parser);
    that.name = "Default Duty Parser State";

    that.testForTripCrewLine = function() {
        return parser.testForTripCrewLine();
    };

    that.testForMultiDayLine = function() {
        return parser.testForMultiDayLine();
    };
    that.testForFlyingDutyLine = function() {
        return parser.testForFlyingDutyLine();
    };
    that.testForGndDutyLine = function() {
        return parser.testForGndDutyLine();
    };
};


	lookingForMetaData
	lookingForGndDuty
	inACarryInTrip
	lookingForTrip
	inATrip
	inADuty
	lookingForCrewNames

//---
YAHOO.rp.BaFcLookingForTripState = function (parser) {
    var that = YAHOO.rp.BaFcDefaultState(parser);
    that.name = "Looking for Trip State";

    that.testForTripCrewLine = function() {
        return parser.testForTripCrewLine();
    };

    that.testForMultiDayLine = function() {
        return parser.testForMultiDayLine();
    };
    that.testForFlyingDutyLine = function() {
        return parser.testForFlyingDutyLine();
    };
    that.testForGndDutyLine = function() {
        return parser.testForGndDutyLine();
    };

    that.foundMultiDayLine = function() {
        // Make sure its a REST day
	if (parser.lineType === parser.lineTypeEnum.multiRestDay) {
            parser.doMultiRestDayLineAction();
	}
    };
    that.foundFlyingDutyLine = function() {
        parser.state = parser.state.changeState(parser.inAFlyingDutyState);
	parser.currentTrip = parser.startNewTrip();
	parser.doFlyingDutyLineAction();
    };
    that.foundGndDutyLine = function() {
        // Make sure its a REST day
	if (parser.lineType === parser.lineTypeEnum.restDay) {
            parser.doRestDayLineAction();
	}
    };

    that.foundTripCrewLine = function() {
        parser.doTripCrewLineAction();
        parser.state = parser.state.changeState(parser.lookingForCrewLineState);
    };
    return that;
};


//---
YAHOO.rp.BaFcLookingForFlyingDutyState = function (parser) { // old - startState
    var that = YAHOO.rp.BaFcDefaultState(parser);
    that.name = "Looking for Flying Duty State";

    that.testForTripCrewLine = function() {
        return parser.testForTripCrewLine();
    };

    that.testForMultiDayLine = function() {
        return parser.testForMultiDayLine();
    };
    that.testForFlyingDutyLine = function() {
        return parser.testForFlyingDutyLine();
    };
    that.testForGndDutyLine = function() {
        return parser.testForGndDutyLine();
    };

    that.foundMultiDayLine = function() {
        // Make sure its a REST day
	if (parser.lineType === parser.lineTypeEnum.multiRestDay) {
            parser.doMultiRestDayLineAction();
	}
    };
    that.foundFlyingDutyLine = function() {
        parser.state = parser.state.changeState(parser.inAFlyingDutyState);
	parser.currentTrip = parser.startNewTrip();
	parser.doFlyingDutyLineAction();
    };
    that.foundGndDutyLine = function() {
        // Make sure its a REST day
	if (parser.lineType === parser.lineTypeEnum.restDay) {
            parser.doRestDayLineAction();
	}
    };

    that.foundTripCrewLine = function() {
        parser.doTripCrewLineAction();
        parser.state = parser.state.changeState(parser.lookingForCrewLineState);
    };
    return that;
};

//---
YAHOO.rp.BaFcInAFlyingDutyState = function (parser) { // old - startState
    var that = YAHOO.rp.BaFcDefaultState(parser);
    that.name = "Flying Duty State";

    that.testForTripCrewLine = function() {
        return parser.testForTripCrewLine();
    };

    that.testForMultiDayLine = function() {
        return parser.testForMultiDayLine();
    };
    that.testForFlyingDutyLine = function() {
        return parser.testForFlyingDutyLine();
    };
    that.testForGndDutyLine = function() {
        return parser.testForGndDutyLine();
    };

    that.enterState = function() {
	parser.startDuty();
	return this;
    };

    that.exitState = function() {
	parser.endDuty();
	return this;
    };

    that.foundMultiDayLine = function() {
        // If its a REST day,stay in the trip
	if (parser.lineType === parser.lineTypeEnum.multiRestDay) {
            parser.doMultiRestDayLineAction();
	}
	else {
	    parser.finishTrip(parser.currentTrip);
	    parser.state = parser.state.changeState(parser.lookingForFlyingDutyState);
	}
    };

    that.foundFlyingDutyLine = function() {
	parser.doFlyingDutyLineAction();
    };

    that.foundGndDutyLine = function() {
        // If its a REST day,stay in the trip
	if (parser.lineType === parser.lineTypeEnum.restDay) {
            parser.doRestDayLineAction();
	}
	else {
	    parser.finishTrip(parser.currentTrip);
	    parser.state = parser.state.changeState(parser.lookingForFlyingDutyState);
	}
    };

    that.foundTripCrewLine = function() {
	parser.finishTrip();
        parser.doTripCrewLineAction();
        parser.state = parser.state.changeState(parser.lookingForCrewLineState);
    };
    return that;
};

//---
YAHOO.rp.BaFcLookingForCrewLineState = function(parser) { // old - startState
    var that = YAHOO.rp.BaFcDefaultState(parser);
    that.name = "Crew Names State";

    that.testForCrewNamesLine = function() {
        return parser.testForCrewNamesLine();
    };

    that.foundCrewNamesLine = function() {
        parser.doCrewLineAction();
        parser.ignoreUnrecognisedLines = true;
    };
    return that;
};
