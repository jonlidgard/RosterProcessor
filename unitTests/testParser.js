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
            e = (new YAHOO.rp.EventCollection).events.newEvent(),
            parser = this.parser,
            t;

    //    f('  BEGIN  0123  END  1234  ' , e);

        // Test for whole day recognition        
        e.startDate = new Date("FEB 28, 2012");
        e.endDate = new Date("FEB 28, 2012");
        this.parser.setDutyTimes('BEGIN 0001 END 2400' , e);
        t = e.endDate.valueOf() - e.startDate.valueOf();
        Assert.areSame(c.WHOLEDAY, t);
        Assert.areSame(new Date("FEB 28, 2012").valueOf(), e.startDate.valueOf(), 'startTime has changed');
        Assert.areSame(new Date("FEB 29, 2012").valueOf(), e.endDate.valueOf(), 'endTime has changed');
        
        // Check a day gets added if no BEGIN END found
        e.startDate = new Date("FEB 28, 2011");
        e.endDate = new Date("FEB 28, 2011");
        this.parser.setDutyTimes('blah' , e);
        t = e.endDate.valueOf() - e.startDate.valueOf();
        Assert.areSame(c.WHOLEDAY, t);
        Assert.areSame(new Date("FEB 28, 2011").valueOf(), e.startDate.valueOf(), 'startTime has changed');
        Assert.areSame(new Date("MAR 01 2011").valueOf(), e.endDate.valueOf(), 'endTime has changed');

        // Check a day gets added if no BEGIN END found
        e.startDate = new Date("FEB 28, 2012");
        e.endDate = new Date("FEB 28, 2012");
        this.parser.setDutyTimes('BEGIN 0930 END 1745' , e);
        Assert.areSame(new Date("FEB 28, 2012 09:30:00 UTC").valueOf(), e.startDate.valueOf(), 'startTime not updated');
        Assert.areSame(new Date("FEB 28, 2012 17:45:00 UTC").valueOf(), e.endDate.valueOf(), 'endTime not updated');

        // Check a day gets added if no BEGIN END found
        e.startDate = new Date("FEB 28, 2011");
        e.endDate = new Date("FEB 28, 2011");
        this.parser.setDutyTimes('BEGIN 2230 END 0045' , e);
        Assert.areSame(new Date("FEB 28, 2011 22:30:00 UTC").valueOf(), e.startDate.valueOf(), 'startTime not updated');
        Assert.areSame(new Date("MAR 01, 2011 00:45:00 UTC").valueOf(), e.endDate.valueOf(), 'endTime not updated');

    },
    
    testCheckDate: function () {
        var Assert = YAHOO.util.Assert,
            parser = this.parser;
            
            Assert.isFunction(parser.checkDate);
            Assert.isTrue(parser.checkDate(' we ', new Date('APR 20, 2011 00:00:00 UTC')));
            Assert.isTrue(parser.checkDate(' fr ', new Date('JAN 01, 2010 00:00:00 UTC')));
    },
    

    testParse: function() {
        var Assert = YAHOO.util.Assert,
            element = document.getElementById("parseButton1");
 
        //simulate a click
        YAHOO.util.UserAction.click(element);
 
    }    
    

});
