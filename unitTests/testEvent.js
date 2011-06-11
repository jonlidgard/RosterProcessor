/*globals YAHOO */

/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */

/*jslint white: false, devel: true */

"use strict";


YAHOO.rpTest.yuitest.EventTestCase = new YAHOO.tool.TestCase({

    //name of the test case - if not provided, one is auto-generated
    name: "Event Tests",

    //---------------------------------------------------------------------
    // setUp and tearDown methods - optional
    //---------------------------------------------------------------------
    /*
         * Sets up data that is needed by each test.
         */
    setUp: function() {
        this.eventCollection = new YAHOO.rp.EventCollection();
    },

    /*
         * Cleans up everything that was created by setUp().
         */
    tearDown: function() {
        delete this.events;
    },

    //---------------------------------------------------------------------
    // Test methods - names must begin with "test"
    //---------------------------------------------------------------------
    testIsObject: function() {
        var Assert = YAHOO.util.Assert;

        Assert.isObject(this.eventCollection);
    },

        // Test rosterText functionality
    testNewEvent: function() {
        var Assert = YAHOO.util.Assert,
            e = this.eventCollection,
            myEvent;

        Assert.isFunction(e.add);
        myEvent = YAHOO.rp.eventMaker.factory('GroundDuty');
        Assert.isObject(myEvent);
        Assert.isString(myEvent.summary);
        e.add(myEvent);
    }

});
