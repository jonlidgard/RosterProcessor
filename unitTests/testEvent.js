/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */


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
        this.event = new YAHOO.rosterProcessor.Event();
    },

    /*
         * Cleans up everything that was created by setUp().
         */
    tearDown: function() {
        delete this.event;
    },

    //---------------------------------------------------------------------
    // Test methods - names must begin with "test"
    //---------------------------------------------------------------------
    testIsObject: function() {
        var Assert = YAHOO.util.Assert;

        Assert.isObject(this.event);
    },
    
});
