/*globals YAHOO */

/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */

/*jslint white: false, devel: true, browser: true */

"use strict";


YAHOO.rpTest.yuitest.ParserTestCase = new YAHOO.tool.TestCase({

    //name of the test case - if not provided, one is auto-generated
    name: "Parser Tests",

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

    testSetDutyTimes: function () {
        var Assert = YAHOO.util.Assert,
            c = YAHOO.rp.constants,
            e = YAHOO.rp.eventMaker.factory('GroundDuty'),
            parser = this.parser,
            t;

    //    f('  BEGIN  0123  END  1234  ' , e);

        // Test for whole day recognition
        e.start.setDate(new Date("FEB 28, 2012"));
        e.end.setDate(new Date("FEB 28, 2012"));
        this.parser.setDutyTimes('BEGIN 0001 END 2400' , e);
        t = e.end.valueOf() - e.start.valueOf();
        Assert.areSame(c.WHOLEDAY, t);
        Assert.areSame(new Date("FEB 28, 2012").valueOf(), e.start.valueOf(), 'startTime has changed');
        Assert.areSame(new Date("FEB 29, 2012").valueOf(), e.end.valueOf(), 'endTime has changed');

        // Check a day gets added if no BEGIN END found
        e.start.setDate(new Date("FEB 28, 2011"));
        e.end.setDate(new Date("FEB 28, 2011"));
        this.parser.setDutyTimes('blah' , e);
        t = e.end.valueOf() - e.start.valueOf();
        Assert.areSame(c.WHOLEDAY, t);
        Assert.areSame(new Date("FEB 28, 2011").valueOf(), e.start.valueOf(), 'startTime has changed');
        Assert.areSame(new Date("MAR 01 2011").valueOf(), e.end.valueOf(), 'endTime has changed');

        // Check a day gets added if no BEGIN END found
        e.start.setDate(new Date("FEB 28, 2012"));
        e.end.setDate(new Date("FEB 28, 2012"));
        this.parser.setDutyTimes('BEGIN 0930 END 1745' , e);
        Assert.areSame(new Date("FEB 28, 2012 09:30:00 UTC").valueOf(), e.start.valueOf(), 'startTime not updated');
        Assert.areSame(new Date("FEB 28, 2012 17:45:00 UTC").valueOf(), e.end.valueOf(), 'endTime not updated');

        // Check a day gets added if no BEGIN END found
        e.start.setDate(new Date("FEB 28, 2011"));
        e.end.setDate(new Date("FEB 28, 2011"));
        this.parser.setDutyTimes('BEGIN 2230 END 0045' , e);
        Assert.areSame(new Date("FEB 28, 2011 22:30:00 UTC").valueOf(), e.start.valueOf(), 'startTime not updated');
        Assert.areSame(new Date("MAR 01, 2011 00:45:00 UTC").valueOf(), e.end.valueOf(), 'endTime not updated');

    },

    testCheckDate: function () {
        var Assert = YAHOO.util.Assert,
            parser = this.parser;

            Assert.isFunction(parser.checkDate);
            Assert.isTrue(parser.checkDate(' we ', new Date('APR 20, 2011 00:00:00 UTC')));
            Assert.isTrue(parser.checkDate(' fr ', new Date('JAN 01, 2010 00:00:00 UTC')));
    },


    testNextSector: function () {
        var Assert = YAHOO.util.Assert,
            c = YAHOO.rp.constants,
            l1 = "   2578 LGW 1245 1345 TRN 1530  CK,CP   2579 TRN 1615 LGW 1800  CK,CP",
            l2 = "   2931 EDI 0425 0525 LGW 0700 F        8033 LGW 0735 JER 0835          8036 JER 0915 LGW 1010 F        8037 LGW 1045 JER 1145       ",
            parser = this.parser,
            s;

            Assert.isFunction(parser.nextSector);
            s = parser.nextSector(l1);
            Assert.isString(s.line);
            Assert.areSame('',s.preCode);
            Assert.areSame('2578',s.flightNo);
            Assert.areSame('LGW',s.origin);
            Assert.areSame('1245',s.report);
            Assert.areSame('1345',s.start);
            Assert.areSame('TRN',s.dest);
            Assert.areSame('1530',s.end);
            Assert.areSame('CK,CP',s.postCodes);
            s = parser.nextSector(s.line);
            Assert.areSame('',s.preCode);
            Assert.areSame('2579',s.flightNo);
            Assert.areSame('TRN',s.origin);
            Assert.isUndefined(s.report);
            Assert.areSame('1615',s.start);
            Assert.areSame('LGW',s.dest);
            Assert.areSame('1800',s.end);
            Assert.areSame('CK,CP',s.postCodes);
            Assert.isUndefined(s.line);

            s = parser.nextSector(l2);
            Assert.isString(s.line);
            Assert.areSame('F',s.postCodes);
            s = parser.nextSector(s.line);
            Assert.isString(s.line);
            s = parser.nextSector(s.line);
            Assert.isString(s.line);
            s = parser.nextSector(s.line);
            Assert.isUndefined(s.line);
            Assert.areSame('1145',s.end);
            Assert.areSame('',s.postCodes);
    },


    testParse: function() {
        var Assert = YAHOO.util.Assert,
            element = document.getElementById("parseButton1");

        //simulate a click
//        YAHOO.util.UserAction.click(element);

    }


});
