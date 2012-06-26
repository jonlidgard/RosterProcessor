/*globals YAHOO */

/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */

/*jslint white: false, devel: true, browser: true */

"use strict";


YAHOO.rpTest.yuitest.BaCcParserTestCase = new YAHOO.tool.TestCase({

    //name of the test case - if not provided, one is auto-generated
    name: "BaCcParser Tests",

    //---------------------------------------------------------------------
    // setUp and tearDown methods - optional
    //---------------------------------------------------------------------
    /*
         * Sets up data that is needed by each test.
         */
    setUp: function() {
        var theText = "line 1\nline 2\nline 3";
        this.roster = new YAHOO.rp.Roster(theText);
        this.parser = new YAHOO.rp.BaCcParser(this.roster);
        this.roster.createdDate = new Date();
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
    testIsObject: function() {
        var Assert = YAHOO.util.Assert;

        Assert.isObject(this.parser);
    },

    testConstants: function() {
        var Assert = YAHOO.util.Assert,
            c = YAHOO.rp.constants;

        Assert.isNumber(c.WHOLEDAY);
        Assert.isNumber(c.ONEMINUTE);
        Assert.isNumber(c.POSTFLIGHTDUTYTIME);
        Assert.isNumber(c.PREFLIGHTDUTYTIME);
        Assert.isNumber(c.MINREST);

        Assert.areSame(+86400000, c.WHOLEDAY);
        Assert.areSame(+60000, c.ONEMINUTE);
        Assert.areSame(+1800000, c.POSTFLIGHTDUTYTIME);
        Assert.areSame(+3600000, c.PREFLIGHTDUTYTIME);
        Assert.areSame(+39600000, c.MINREST);
    },

    testDateLineMatchAndAction: function () {
        var Assert = YAHOO.util.Assert;
        this.parser.roster.createdDate = new Date('JUN 30, 2010 00:00:00 UTC');
        this.parser.line = "   WE 23 MAY   REST_OF_LINE";
        Assert.isFunction(this.parser.testForDateInLine);
        var result = this.parser.testForDateInLine();
        var errorMsg = "regex didn't match: " + this.parser.line;
        Assert.isTrue(result, errorMsg);

        Assert.isFunction(this.parser.doDateInLineAction);
        result = this.parser.doDateInLineAction();
        Assert.isTrue(result, 'doDateLineAction must return true to continue tests');
        Assert.areSame("REST_OF_LINE", this.parser.line, 'Date not being chopped correctly from line');

        var actualDate = this.parser.lineDate,
            expectedDate = new Date('MAY 23, 2010 00:00:00 UTC');
        Assert.isObject(actualDate, 'lineDate undefined');
        YAHOO.log('ActualDate: ' + actualDate.date());
        YAHOO.log('ExpectedDate: ' + expectedDate);
        Assert.areSame(expectedDate.valueOf(), actualDate.valueOf(),'lineDate not correct');
    },
    
    testAbbreviateText : function () {
        var Assert = YAHOO.util.Assert;
        var testData = ['   AVIATION MEDICINE',' LOCAL TIME LGW',' LOCAL TIME LHR',
                    '   STANDBY AT HOME',' STANDBY','   OFF DUTY','   ANNUAL LEAVE',
                    '  900 HRS GROUND WORK','  PT-TIME NON WORKING',
                    ' JOBSHARE NONWORKING',' MAN HAND ONLINE','  AVAILABLE',
                    '  DAY IN LIEU'],
            expectedResult = [' AVMED','L','L',' HSB',' STBY',' OFF',' LEAVE',' 900H GW',' PT-NW',' JS-NW',
                          ' MAN HND',' AVAIL',' LIEU DAY'],
            text, expected;
       
       for (var i = 0; i < testData.length; i++) {
            text = '  blah blah  blah   ' +  testData[i] + '  more blah';
            expected = 'blah blah blah' + expectedResult[i] + ' more blah';
            Assert.areSame(expected, this.parser.abbreviateText(text),"Didn't abbreviate " + testData[i]);
       }
    },

    testAddEvent: function () {
        var Assert = YAHOO.util.Assert;

        Assert.isFunction(this.parser.addEvent, "addEvent doesn't exist");
        this.parser.line = "TESTING   STANDBY at HOME  Should be HSB";
        this.parser.lineDate = new YAHOO.rp.EventDate();
        this.parser.lineDate.setDate(new Date('JUN 30, 2010 00:00:00 UTC'));
        var e = this.parser.addEvent('GroundDuty');
        Assert.isObject(e, 'event not created');
        Assert.areSame(new Date('JUN 30, 2010 00:00:00 UTC').valueOf(),e.start.valueOf(),'start date not correct');
        Assert.areSame(this.parser.line.trim(), e.description, 'desription incorrect');
        Assert.areSame('TESTING HSB Should be HSB', e.summary, 'summary incorrect');
        
    },
    
    testMultiDayLineMatchAndAction: function () {
        var Assert = YAHOO.util.Assert;
        this.parser.line = "ANNUAL LEAVE THRU 18 FEB 08";
        Assert.isFunction(this.parser.testForMultiDayLine, "testForMultiDayLine doesn't exist");
        var result = this.parser.testForMultiDayLine();
        var errorMsg = "regex didn't match: " + this.parser.line;
        Assert.isTrue(result, errorMsg);

        Assert.isFunction(this.parser.doMultiDayLineAction, "doMultiDayLineAction doesn't exist");
        result = this.parser.doMultiDayLineAction();
        Assert.isUndefined(result, 'doMultiDayLineAction must not return true to stop further tests'); // need to test for false = OK too
    },

    testParse: function() {
        var Assert = YAHOO.util.Assert,
            element = document.getElementById("parseButton1");

        //simulate a click
//        YAHOO.util.UserAction.click(element);

    }


});
