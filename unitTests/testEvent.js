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
        delete this.eventCollection;
    },

    //---------------------------------------------------------------------
    // Test methods - names must begin with "test"
    //---------------------------------------------------------------------
    testIsObject: function() {
        var Assert = YAHOO.util.Assert;

        Assert.isObject(this.eventCollection);
    },

    testEventDate: function() {
        var Assert = YAHOO.util.Assert,
        ed = YAHOO.rp.EventDate;
        
        var d = new ed(),
            e = new ed();
        
        Assert.isFunction(ed);
        Assert.isObject(d);
        
        d.setDate(new Date("NOV 01 2011 00:00:00 UTC").valueOf());
        Assert.areSame(new Date("NOV 01 2011 00:00:00 UTC").valueOf(), d.valueOf(), 'assign date from number failed' );
        d.incYear();
        Assert.areSame(new Date("NOV 01 2012 00:00:00 UTC").valueOf(), d.valueOf(), 'inc year failed' );
        d.decYear();
        Assert.areSame(new Date("NOV 01 2011 00:00:00 UTC").valueOf(), d.valueOf(), 'dec year failed' );
        
        var anotherDate = new Date("JAN 01 2011 00:00:00 UTC");
        d.setDate(anotherDate);
        Assert.areSame(new Date("JAN 01 2011 00:00:00 UTC").valueOf(), d.valueOf(), 'assign date from date failed' );
        d.decMonth();
        Assert.areSame(new Date("DEC 01 2010 00:00:00 UTC").valueOf(), d.valueOf(), 'dec month failed' );
        d.incMonth();
        Assert.areSame(new Date("JAN 01 2011 00:00:00 UTC").valueOf(), d.valueOf(), 'inc month failed' );

        e.setDate(new Date("DEC 31 2010 00:00:00 UTC"));
        Assert.isTrue(e.isLessThan(d), 'isLessThan not working');
        Assert.isTrue(d.isGreaterThan(e), 'isGreaterThan not working');
        
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
