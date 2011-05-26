/*globals YAHOO */

/*jslint white: false, devel: true*/

"use strict";

YAHOO.namespace("rpTest.yuitest");

YAHOO.rpTest.yuitest.RosterTestCase = new YAHOO.tool.TestCase({

    //name of the test case - if not provided, one is auto-generated
    name: "Roster Tests",

    //---------------------------------------------------------------------
    // setUp and tearDown methods - optional
    //---------------------------------------------------------------------
    /*
         * Sets up data that is needed by each test.
         */
    setUp: function() {
        var theText = "line 1\nline 2\nline 3";
        this.roster = new YAHOO.rp.Roster(theText);
    },

    /*
         * Cleans up everything that was created by setUp().
         */
    tearDown: function() {
        delete this.roster;
    },

    //---------------------------------------------------------------------
    // Test methods - names must begin with "test"
    //---------------------------------------------------------------------

    testIsObject: function() {
        var Assert = YAHOO.util.Assert;

        Assert.isObject(this.roster);
    },

    testcreatedDate: function() {
        var Assert = YAHOO.util.Assert;

        Assert.isInstanceOf(Date,this.roster.createdDate);
    },

    // Test rosterText functionality
    testLineNo: function() {
        var Assert = YAHOO.util.Assert,
            r = this.roster.rosterText;

        Assert.isFunction(r.getLineNo);
        Assert.isNumber(r.getLineNo());
        Assert.areSame(0, r.getLineNo());
        r.next();
        Assert.areSame(1, r.getLineNo());

    },

    testHasNext: function() {
        var Assert = YAHOO.util.Assert,
            r = this.roster.rosterText;

        Assert.isFunction(r.hasNext);
        Assert.isTrue(r.hasNext());

    },

    testNext: function() {
        var Assert = YAHOO.util.Assert,
            txt,
            r = this.roster.rosterText;


        Assert.isFunction(r.next);
        txt = r.next();
        Assert.isString(txt);
        Assert.areSame("line 1",txt);
        Assert.isTrue(r.hasNext());
        Assert.areSame(1, r.getLineNo());

        txt = r.next();
        Assert.isString(txt);
        Assert.areSame("line 2",txt);
        Assert.isTrue(r.hasNext());
        Assert.areSame(2, r.getLineNo());

        txt = r.next();
        Assert.isString(txt);
        Assert.areSame("line 3",txt);
        Assert.isFalse(r.hasNext());
        Assert.areSame(3, r.getLineNo());

    },

    testReset: function() {
        var Assert = YAHOO.util.Assert,
            txt,
            r = this.roster.rosterText;


        Assert.isFunction(r.rewind);
        txt = r.next();

        Assert.areSame(1, r.getLineNo());
        r.rewind();
        Assert.areSame(0, r.getLineNo());
    }


});