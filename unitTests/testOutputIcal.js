/*globals YAHOO */

/*jslint white: false, devel: true*/

"use strict";

YAHOO.rpTest.yuitest.OutputIcalTestCase = new YAHOO.tool.TestCase({

    //name of the test case - if not provided, one is auto-generated
    name: "OutputIcal Tests",

    //---------------------------------------------------------------------
    // setUp and tearDown methods - optional
    //---------------------------------------------------------------------
    /*
         * Sets up data that is needed by each test.
         */
    setUp: function() {
        var theText = "line 1\nline 2\nline 3";
        this.roster = new YAHOO.rp.Roster(theText);
        this.parser = new YAHOO.rp.BaFcParser(this.roster);
    },

    /*
         * Cleans up everything that was created by setUp().
         */
    tearDown: function() {
        delete this.parser;
        delete this.roster;
    },

    //---------------------------------------------------------------------
    // Test methods - names must begin with "test"
    //---------------------------------------------------------------------
    
    testIsFunction: function() {
        var Assert = YAHOO.util.Assert,
            o = YAHOO.rp.outputIcal;

        Assert.isFunction(o);
    }

});