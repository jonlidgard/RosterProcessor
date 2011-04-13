/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */


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
        this.roster = new YAHOO.rosterProcessor.Roster(theText);
        this.parser = new YAHOO.rosterProcessor.Parser(this.roster);
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
        var Assert = YAHOO.util.Assert;
        var c = YAHOO.rosterProcessor.constants;
        
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
    
    testParse: function() {
        var Assert = YAHOO.util.Assert,
            element = document.getElementById("parseButton1");
 
        //simulate a click
        YAHOO.util.UserAction.click(element);
 
    }    
    

});
