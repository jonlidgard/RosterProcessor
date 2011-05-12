/*globals YAHOO */

/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */

/*jslint white: false, devel: true */

"use strict";

YAHOO.rpTest.yuitest.UtilsTestCase = new YAHOO.tool.TestCase({

    //name of the test case - if not provided, one is auto-generated
    name: "Utils Tests",

    //---------------------------------------------------------------------
    // setUp and tearDown methods - optional
    //---------------------------------------------------------------------
    /*
         * Sets up data that is needed by each test.
         */
    setUp: function() {
        this.utils = YAHOO.rp.utils;
    },

    /*
         * Cleans up everything that was created by setUp().
         */
    tearDown: function() {
//        delete this.utils;
    },

    _should: {
        ignore: {
        },
        error: {
            testIndexOfMonthBadInput : TypeError,
            testDaysInMonthBadInput : TypeError,
            testDaysInMonth2BadInput : TypeError,
            testDaysSince1970BadInput : TypeError
        }
    },
    //---------------------------------------------------------------------
    // Test methods - names must begin with "test"
    //---------------------------------------------------------------------
    testIsObject: function() {
        var Assert = YAHOO.util.Assert;

        Assert.isObject(this.utils);
    },

    testEmailFunction: function() {
        var Assert = YAHOO.util.Assert,
            result,
            testString1 = "not an email",
            testString2 = "someone@somedomain",
            testString3 = "someone@somedomain.com";

        Assert.isFunction(this.utils.checkEmail);
        result = this.utils.checkEmail(testString1);
        Assert.isFalse(result,"No @ sign");

        result = this.utils.checkEmail(testString2);
        Assert.isFalse(result, "No top level domain");

        result = this.utils.checkEmail(testString3);
        Assert.isTrue(result, "rejected valid email");
    },

    testTrimFunction: function() {
        var Assert = YAHOO.util.Assert,
            result,
            testString1 = "      leading_spaces",
            testString2 = "trailing_spaces     ",
            testString3 = "      leading_&_trailing_spaces     ";

        Assert.isFunction(String.trim);
        result = testString1.trim();
        Assert.areSame("leading_spaces",result,"didn't trim leading whitespace");

        result = testString2.trim();
        Assert.areSame("trailing_spaces",result,"didn't trim trailing whitespace");

        result = testString3.trim();
        Assert.areSame("leading_&_trailing_spaces",result,"didn't trim leading & trailing whitespace");
    },

    /**
     * Checks that indexOfMonth returns 0 - 11 for jan - dec
     * and -1 for an unrecognised string
     * @returns {number} month index
     */

    testIndexOfMonth: function() {
        var Assert = YAHOO.util.Assert,
            result;

        Assert.isFunction(this.utils.indexOfMonth);
        result = this.utils.indexOfMonth("Jan");
        Assert.areSame(0,result,"Didn't recognise JAN");

        result = this.utils.indexOfMonth("Dec");
        Assert.areSame(11,result,"Didn't recognise DEC");
    },

    testIndexOfMonthBadInput: function() {
        // should throw a type error
        var result = this.utils.indexOfMonth("???");
    },

    testDaysInMonth: function() {
        var Assert = YAHOO.util.Assert,
            result;

        Assert.isFunction(this.utils.daysInMonth);
        result = this.utils.daysInMonth("JAN",2011);
        Assert.areSame(31,result,"JAN,2011 should be 31");

        result = this.utils.daysInMonth("feb",2012);
        Assert.areSame(29,result,"FEB,2012 should be 29");
    },

    testDaysInMonthBadInput: function() {
        // should throw a type error
        var result = this.utils.daysInMonth("???",0);
    },

    testDaysInMonth2: function() {
        var Assert = YAHOO.util.Assert,
            result;

        Assert.isFunction(this.utils.daysInMonth2);
        result = this.utils.daysInMonth2(new Date(0));
        Assert.areSame(31,result);

        result = this.utils.daysInMonth2(new Date("FEB 20 2012"));
        Assert.areSame(29,result);

    },

    testDaysInMonth2BadInput: function() {
        // should throw a type error
        var result = this.utils.daysInMonth2(undefined);
    },

    testDaysSince1970: function() {
        var Assert = YAHOO.util.Assert,
            result;

        Assert.isFunction(this.utils.daysSince1970);
        result = this.utils.daysSince1970(new Date(0));
        Assert.areSame(0,result);

        result = this.utils.daysSince1970(new Date("JAN 01 1971"));
        Assert.areSame(364,result);

    },

    testIncDecUTCMonth: function() {
        var Assert = YAHOO.util.Assert,
            c = YAHOO.rp.constants,
            result;

        Assert.isFunction(this.utils.incUTCMonth, 'incUTCMonth not defined');
        result = this.utils.incUTCMonth(new Date("JAN 01, 2011 00:00:00 UTC"));
        Assert.areSame(new Date("FEB 01 2011 00:00:00 UTC"), result, 'did not increment month correctly');

        Assert.isFunction(this.utils.decUTCMonth, 'decUTCMonth not defined');
        result = this.utils.decUTCMonth(new Date("FEB 01 2011 00:00:00 UTC"));
        Assert.areSame(new Date("JAN 01, 2011 00:00:00 UTC"),result, 'did not decrement month correctly');
    },

    testIncDecUTCDay: function() {
        var Assert = YAHOO.util.Assert,
            c = YAHOO.rp.constants,
            result;

        Assert.isFunction(this.utils.incUTCDay, 'incUTCDay not defined');
        result = this.utils.incUTCDay(new Date(0));
        Assert.areSame(c.WHOLEDAY,result.valueOf(), 'did not increment day correctly');

        Assert.isFunction(this.utils.decUTCDay, 'decUTCDay not defined');
        result = this.utils.decUTCDay(new Date(c.WHOLEDAY));
        Assert.areSame(0,result.valueOf(), 'did not decrement day correctly');

    },

    testDaysSince1970BadInput: function() {
        // should throw a type error
        var result = this.utils.daysSince1970(undefined);
    },

    testAbbrevBase: function() {
        var Assert = YAHOO.util.Assert,
            result,
            testString1 = "LGW",
            testString2 = "LHR",
            testString3 = "??";

        Assert.isFunction(this.utils.abbrevBase);
        result = this.utils.abbrevBase(testString1);
        Assert.areSame("G",result);

        result = this.utils.abbrevBase(testString2);
        Assert.areSame("L",result);

        result = this.utils.abbrevBase(testString3);
        Assert.areSame(testString3,result);
    },

    testAbbrevName: function() {
        var Assert = YAHOO.util.Assert,
            an = this.utils.abbrevName,
            result,
            testString1 = "",
            testString2 = "No Colon",
            testString3 = "  First Person. ",
            testString4 = "  First Person.   Second Person.  ",
            testString5 = "  First-Second Name.  ";

        Assert.isFunction(an);
        result = an(testString1);
        Assert.areSame("",result);

        result = an(testString2);
        Assert.areSame("",result);

        result = an(testString3);
        Assert.areSame("F Person.",result);

        result = an(testString4);
        Assert.areSame("F Person. S Person.",result);

        result = an(testString5);
        Assert.areSame("FS Name.",result);
    }






});
