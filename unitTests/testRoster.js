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
        var Assert = YAHOO.util.Assert;

        Assert.isFunction(this.roster.rosterText.getLineNo);
        Assert.isNumber(this.roster.rosterText.getLineNo());
        Assert.areSame(0, this.roster.rosterText.getLineNo());
        
        this.roster.rosterText.next();

    },

    testHasNext: function() {
        var Assert = YAHOO.util.Assert;
    
        Assert.isFunction(this.roster.rosterText.hasNext);
        Assert.isTrue(this.roster.rosterText.hasNext());
        
    },

    testNext: function() {
        var Assert = YAHOO.util.Assert,
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
        var Assert = YAHOO.util.Assert,
            txt;
    
        Assert.isFunction(this.roster.rosterText.reset);
        txt = this.roster.rosterText.next();

        Assert.areSame(1, this.roster.rosterText.getLineNo());
        this.roster.rosterText.reset();        
        Assert.areSame(0, this.roster.rosterText.getLineNo());
    }
    

});