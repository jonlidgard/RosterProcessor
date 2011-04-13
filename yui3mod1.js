/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */

/*YUI 3 module */

YUI().add('test1', function (Y) {
    Y.today = new Date();
    Y.utils = {
        testFunc : function () {
            Y.log('Hello from testfunc');
        }
    }

});