/* Copyright (c) 2006 YourNameHere
   See the file LICENSE.txt for licensing information. */

const logBookExt = '.csv';
var defaultDir = Components.classes["@mozilla.org/file/directory_service;1"]
                .getService(Components.interfaces.nsIProperties)
                .get("Home", Components.interfaces.nsILocalFile);

function rosterprocessor_onInitLogbook()
{
    dump("\n\n---------------------\nHERE in InitLogbook\n----------------------------------\n\n\n\n");
    var validRoster = isValidRoster(myRoster);
    dump("HERE in logbookForm: " + PROGRAM_VERSION + "\n");
    if ( !validRoster )
    {
        myRoster = new roster();
        myRoster.text.all = rp_getContentDocument().body.textContent;
        if (!isvalidRoster(myRoster) ) {
          alert("Unrecognised roster");
          return;
        }
    }
    dump("HERE1\n");
   
   try {
        var rt = (myRoster instanceof BaFcRoster) ? 1 : 0;
        rt = (myRoster instanceof BaCcRoster) ? 2 : rt;
        
        if (!(myRoster instanceof BaFcRoster) ) {
          alert("Only for Flight Crew Rosters");
          return;
        }
        dump("HERE2\n");

       if (myRoster.parsePage(myRoster)) {
        var logBookText = outputLogbook(myRoster);
        dump("\n" + logBookText + "\n");
       }
   }
   catch(err) {
      alert("Error decoding roster: " + err.errorText );
        var stream = encodeURI("&rostype="+rt+"&fname="+myRoster.firstName+"&lname="+myRoster.lastName+"&ccode="+myRoster.getFileName()+"&roster="+myRoster.getRawRosterText()+"&ver="+PROGRAM_VERSION);
        var url="http://www.aircrewrosters.com/collate.php";
        //sendToWeb(url,stream,this.processCollate,"");
   }
}

function rosterprocessor_onDoneClick()
{
    return true;
}



function rosterprocessor_onResetLogbookClick()
{
}

function rosterprocessor_onCopyLogbookClick()
{
}

function rosterprocessor_onSaveLogbookClick()
{

  var logBookText = "";

  var fp = Components.classes["@mozilla.org/filepicker;1"]
	           .createInstance(Components.interfaces.nsIFilePicker);
//        fp.defaultString = myRoster.getFileName() + logBookExt;
//        fp.displayDirectory = defaultDir;
        fp.init(window, "Save logbook", Components.interfaces.nsIFilePicker.modeSave);
        fp.appendFilter("Logbook files","*" + logBookExt);
        fp.appendFilters(Components.interfaces.nsIFilePicker.filterAll);
        fp.filterIndex = 0;
        var showResult = fp.show();
        if (showResult == Components.interfaces.nsIFilePicker.returnOK || showResult == Components.interfaces.nsIFilePicker.returnReplace) {
        	var file = fp.file;
            var path = fp.file.path;
            var outFileStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
        	outFileStream.init(file, 0x02 | 0x08 | 0x20, 0660, 0);
        	outFileStream.write(logBookText, logBookText.toString().length);
            outFileStream.close();
        }

}
