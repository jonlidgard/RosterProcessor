/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */

/*YUI 3 module */

YUI().add('test1', function (Y) {
    Y.namespace('foo.bar');
    Y.today = new Date();
    Y.foo.bar = {
        testFunc : function () {
            Y.log('Hello from foo.bar.testfunc');
        }
    };
    
    Y.foo2 = function(y) {
        var x = y;
        Y.log('Hello from foo 2: ' + x);
        var hello = function () {
            Y.log('Hello func from foo 2: ' + x);
        };
    };

    
}, '0.0.1', {requires: ['node']} );