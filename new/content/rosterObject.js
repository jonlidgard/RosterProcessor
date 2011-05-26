/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */

//-------------------------------------------------------------
YAHOO.rp.Roster = function (rosterLines) {

    this.createdDate = new Date(0);

    this.rosterText = (function() {
        var index = 0,
            lines = rosterLines.split('\n'),
            length = lines.length,
	    matchDashedLine = /^-+$/,
            bookMark = 0,
            rosterLine = {text : '',
                    lineNo : 0
                    };


        return {
            go: function(line) {
		if ((line >= 0) && (line < length)) {
		    index = line;
		}
	    },
            bookMark: function() {
                bookMark = index;
            },
            gotoBookMark: function() {
                index = bookMark;
            },
            hasPrev: function() {
                return index > 0;
            },
	    prev: function() {
                var element,trimmedElement,matchDashed;
                do {
                    if (!this.hasPrev()) {
                        return null;
                    }
                    index -= 1;
                    element = lines[index]; // Do not trim - whitespace is important to parser
                    trimmedElement = element.trim(); //
		    matchDashed = (matchDashedLine.exec(trimmedElement) !== null);

                    // skip blank or dashed lines
                } while ( (trimmedElement.length === 0) || matchDashed );
                return { text : element.replace(/\t/g,"        "),
                         lineNo : index
                        };
            },

	    next: function() {
                var element,trimmedElement,matchDashed;
                do {
                    if (!this.hasNext()) {
                        return null;
                    }
                    element = lines[index]; // Do not trim - whitespace is important to parser
                    trimmedElement = element.trim(); //
		    matchDashed = (matchDashedLine.exec(trimmedElement) !== null);
		    index += 1;
                    // skip blank or dashed lines
                } while ( (trimmedElement.length === 0) || matchDashed );
                return { text : element.replace(/\t/g,"        "),
                         lineNo : index
                        };
            },
            hasNext: function() {
                return index < length;
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
