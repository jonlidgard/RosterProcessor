Y.RPTest.yuitest.RosterTestCase = new Y.tool.TestCase({

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
        this.roster = new YAHOO.rosterProcessor.Roster(theText);
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
    
/*  Now part of the parser object
     testConstants: function() {
        var Assert = YAHOO.util.Assert;

        Assert.isNumber(this.roster.WHOLEDAY);
        Assert.isNumber(this.roster.ONEMINUTE);
        Assert.isNumber(this.roster.POSTFLIGHTDUTYTIME);
        Assert.isNumber(this.roster.PREFLIGHTDUTYTIME);
        Assert.isNumber(this.roster.LHRCCPREFLIGHTDUTYTIME);
        Assert.isNumber(this.roster.MINREST);

        Assert.areSame(+86400000, this.roster.WHOLEDAY);
        Assert.areSame(+60000, this.roster.ONEMINUTE);
        Assert.areSame(+1800000, this.roster.POSTFLIGHTDUTYTIME);
        Assert.areSame(+3600000, this.roster.PREFLIGHTDUTYTIME);
        Assert.areSame(+4800000, this.roster.LHRCCPREFLIGHTDUTYTIME);
        Assert.areSame(+39600000, this.roster.MINREST);
    },
*/   
    testcreatedDate: function() {
        var Assert = Y.util.Assert;

        Assert.isObject(this.roster);
        Assert.isInstanceOf(Date,this.roster.createdDate);
    },

    // Test rosterText functionality
    testLineNo: function() {
        var Assert = Y.util.Assert;

        Assert.isFunction(this.roster.rosterText.getLineNo);
        Assert.isNumber(this.roster.rosterText.getLineNo());
        Assert.areSame(0, this.roster.rosterText.getLineNo());
        
        this.roster.rosterText.next();

    },

    testHasNext: function() {
        var Assert = Y.util.Assert;
    
        Assert.isFunction(this.roster.rosterText.hasNext);
        Assert.isTrue(this.roster.rosterText.hasNext());
        
    },

    testNext: function() {
        var Assert = Y.util.Assert,
            txt;
    
        Assert.isFunction(this.roster.rosterText.next);
        txt = this.roster.rosterText.next();
        Assert.isString(txt);
        Assert.areSame("line 1",txt);
        Assert.isTrue(this.roster.rosterText.hasNext());
        Assert.areSame(1, this.roster.rosterText.getLineNo());
        
        txt = this.roster.rosterText.next();
        Assert.isString(txt);
        Assert.areSame("line 2",txt);
        Assert.isTrue(this.roster.rosterText.hasNext());
        Assert.areSame(2, this.roster.rosterText.getLineNo());

        txt = this.roster.rosterText.next();
        Assert.isString(txt);
        Assert.areSame("line 3",txt);
        Assert.isFalse(this.roster.rosterText.hasNext());
        Assert.areSame(3, this.roster.rosterText.getLineNo());

    },

    testReset: function() {
        var Assert = Y.util.Assert,
            txt;
    
        Assert.isFunction(this.roster.rosterText.reset);
        txt = this.roster.rosterText.next();

        Assert.areSame(1, this.roster.rosterText.getLineNo());
        this.roster.rosterText.reset();        
        Assert.areSame(0, this.roster.rosterText.getLineNo());
    }
    

});

Y.RPTest.yuitest.ArrayTestCase = new Y.tool.TestCase({

    //name of the test case - if not provided, one is auto-generated
    name: "Array Tests",

    //---------------------------------------------------------------------
    // setUp and tearDown methods - optional
    //---------------------------------------------------------------------
    /*
         * Sets up data that is needed by each test.
         */
    setUp: function() {
        this.data = [0, 1, 2, 3, 4]
    },

    /*
         * Cleans up everything that was created by setUp().
         */
    tearDown: function() {
        delete this.data;
    },

    //---------------------------------------------------------------------
    // Test methods - names must begin with "test"
    //---------------------------------------------------------------------
    testPop: function() {
        var Assert = Y.util.Assert;

        var value = this.data.pop();

        Assert.areEqual(4, this.data.length);
        Assert.areEqual(4, value);
    },

    testPush: function() {
        var Assert = Y.util.Assert;

        this.data.push(5);

        Assert.areEqual(6, this.data.length);
        Assert.areEqual(5, this.data[5]);
    },

    testSplice: function() {
        var Assert = Y.util.Assert;

        this.data.splice(2, 1, 6, 7);

        Assert.areEqual(6, this.data.length);
        Assert.areEqual(6, this.data[2]);
        Assert.areEqual(7, this.data[3]);
    }

});