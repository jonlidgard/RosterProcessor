/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */
/*globals YAHOO */

/*jslint white: false, devel: true */
"use strict";

//-------------------------------------------------------------
YAHOO.rp.Roster = function (rosterLines) {

    this.createdDate = new Date(0);

    this.rosterText = (function() {
        var index = 0,
            lines = rosterLines.split('\n'),
    //        length = lines.length,
	    matchDashedLine = /^-+$/,
            bookMark = 0,
            rosterLine = {text : '',
                    lineNo : 0
                    },
            getNext = function() {
                var trimmedElement,matchDashed;
                while (index < lines.length) {
                    trimmedElement = lines[index].trim();
		    matchDashed = (matchDashedLine.exec(trimmedElement) !== null);
                    // skip blank or dashed lines
                    if (trimmedElement === '' || matchDashed === true) {
                        index += 1;
                        continue;
                    }
                    break;
                }
            };


        return {
            hasNext: function() {
                getNext();
                return index < lines.length;
            },
	    next: function() {
                var element = null;
                getNext();
                if (index < lines.length) {
                    element = lines[index].replace(/\t/g,"        "); // Do not trim - whitespace is important to parser
		    index += 1;
                }
                return { text : element,
                         lineNo : index
                        };
            },
            getLineNo: function() {
               return index;
            },
            rewind: function() {
                index = 0;
            }
        };
    } ());
};
