/**************************************************************
This code is copyright of Jon Lidgard (jonlidgard@gmail.com).
Please do not copy, modify, or distribute without prior consent.

Version 0.1.23, April 20th, 2008.
***************************************************************/


/*
 NOTE: When updating version number: Update in install.rdf, update.rdf, about.xul
*/

debugger;
const DEBUG = true;
const THROW_EXCEPTION_ERROR_LEVEL = 0x100; // DO NOT VARY THIS.
const LOG_LEVEL = 10; // SET logging level here
const icalExt = '.ics';

const PROGRAM_VERSION = '0.1.23';
const RP_EMAIL = 'rosterprocessor@gmail.com';
// Globals
var myRoster = null;
var firstShow = true;

var availableUpdate;
var gExtensionManager = Components.classes['@mozilla.org/extensions/manager;1'].getService(Components.interfaces.nsIExtensionManager);


var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                  .getService(Components.interfaces.nsIPromptService);
const nsLocalFile = Components.Constructor("@mozilla.org/file/local;1",
                                            "nsILocalFile", "initWithPath");
const nsIFilePicker = Components.interfaces.nsIFilePicker;

var rosterTypes = new Array();
    rosterTypes[0] = BaFcRoster;
    rosterTypes[1] = BaCcRoster;

/*
var defaultDir = Components.classes["@mozilla.org/file/directory_service;1"]
                .getService(Components.interfaces.nsIProperties)
                .get("ProfD", Components.interfaces.nsILocalFile);

var sqliteFile = Components.classes["@mozilla.org/file/local;1"].createInstance();
if (sqliteFile instanceof Components.interfaces.nsILocalFile){
  sqlite.initWithPath("rosterbase.sqlite");
}
*/


// Create an object type UserException
function RosterException (message)
{
  this.errorText=message;
  this.name="RosterException";
}

// Make the exception convert to a pretty string when used as
// a string (e.g. by the error console)
RosterException.prototype.toString = function ()
{
  return this.name + ': "' + this.message + '"';
}


    function isValidRoster()
    {
       var theRoster = null;
       for (var testRoster in rosterTypes)
       {
              try
              {
                     theRoster = new rosterTypes[testRoster]();
                     theRoster.getRosterInfo();
                     break;
              }
              catch(err)
              {
                     theRoster = null;
              }
       }
       return (theRoster);
    };

function createValidDestination(path) {
	if (!path) return false;
	if (trimString(path).length==0) return false;
	var directory = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		
	try {
		directory.initWithPath(path);
		if (directory.exists()) 
			return directory;
		} catch(e) {return false;}
	return directory;
}
/*
function browsedir() {
	var current_folder_input = document.getElementById("asf-default-folder").value;

	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

	fp.init(window, "", nsIFilePicker.modeGetFolder);
	//fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);

	// locate current directory
	current_folder_input = createValidDestination(current_folder_input);	
	if (current_folder_input != false) fp.displayDirectory = current_folder_input;

	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK)
	{
		var asf_url = fp.file.path;

		// Set the data into the input box
		document.getElementById("asf-default-folder").value = asf_url;

	}

//needed for linux and Mac: autosaved when changing folder
	if (navigator.appVersion.indexOf("Win")!=-1) { } // = Windows
	else
	{
	//save the default folder
	var default_folder = document.getElementById("asf-default-folder").value;
	prefManager.setCharPref("extensions.asf.defaultfolder", default_folder);
	}
}
*/


var rosterprocessor = {

  showContextMenu: function() {
    myRoster = isValidRoster();
    var invalidRoster = (myRoster instanceof roster)  ? "" : "true";
    document.getElementById("context-rosterprocessor").setAttribute("disabled", invalidRoster);
  },

  showToolsMenu: function() {
   LOG(10,"SHOW_TOOLS_MENU");
    myRoster = isValidRoster();
    var invalidRoster = (myRoster instanceof roster)  ? "" : "true";
    document.getElementById("rosterprocessor-Tools-SaveAsText").setAttribute("disabled", invalidRoster);
    document.getElementById("rosterprocessor-Tools-SaveAsCal").setAttribute("disabled", invalidRoster);
    document.getElementById("rosterprocessor-Tools-MailTo").setAttribute("disabled", invalidRoster);
    document.getElementById("rosterprocessor-Tools-BugReport").setAttribute("disabled", false);
  },
  
  showFileMenu: function() {
    myRoster = isValidRoster();
    var invalidRoster = (myRoster instanceof roster)  ? "" : "true";
    document.getElementById("rosterprocessor-File-SaveAsCal").setAttribute("disabled", invalidRoster);
  },


// Opens the help
    help: function()
    {
        rosterprocessor_loadURL("http://www.aircrewrosters.com/help.php");
    },

// Displays the about dialog
    about: function()
    {
        window.openDialog("chrome://rosterprocessor/content/about/about.xul", "rosterprocessor-about-dialog", "centerscreen,chrome,modal");
    },
    
    // Displays the options dialog
    options: function()
    {
    window.openDialog("chrome://rosterprocessor/content/options/options.xul", "rosterprocessor-options-dialog", "centerscreen,chrome,modal,resizable");

    //rosterprocessor_changeOptions();
    },

    
    onSaveAsText: function()
    {
//         firstShow = true;


        // Set to the os home directory
        var defaultDir = Components.classes["@mozilla.org/file/directory_service;1"]
                .getService(Components.interfaces.nsIProperties)
                .get("Home", Components.interfaces.nsILocalFile);

         var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                         .getService(Components.interfaces.nsIPrefService)
                         .getBranch("extensions.rosterprocessor.");

	var current_folder_input = '';
        if (prefs.prefHasUserValue("defaultfolder"))
         {
            current_folder_input = prefs.getCharPref("defaultfolder");
         }
         LOG(10,"Current Folder: " + current_folder_input + "\n");
         
/*        defaultDir.initWithPath( prefs.getCharPref("txtDefaultDir") );


/*    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                      .getService(Components.interfaces.nsIPrefService)
                      .getBranch("extensions.rosterprocessor.");
    if (prefs.prefHasUserValue("txtDefaultDir"))
    {
        defaultDir.initWithPath( prefs.getCharPref("txtDefaultDir") );
        dump("Saved path = " + defaultDir.path + "\n");
    }

    dump("DefaultDir:" + defaultDir.path + "\n");
*/
      if (myRoster == null) {
         myRoster = isValidRoster(myRoster);
      }
        if ( myRoster && myRoster.parsePage() )
        {
            var fp = Components.classes["@mozilla.org/filepicker;1"]
	           .createInstance(nsIFilePicker);
            fp.defaultString = myRoster.getFileName() + ".txt";
            if ( firstShow )
            {
                fp.displayDirectory = defaultDir;
                firstShow = false;
            }
            fp.init(window, this.strings.getString("saveDialogTitle"), nsIFilePicker.modeSave);
//            fp.init(window, "", nsIFilePicker.modeGetFolder);
            fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);
            fp.filterIndex = 0;

/*            current_folder_input = createValidDestination(current_folder_input);	
            if (current_folder_input != false)  {
               fp.displayDirectory = current_folder_input;
               LOG(10,"CREATED DIRECTORY OBJECT");
            }
            else LOG(10,"COULDN'T CREATE DIRECTORY OBJECT");
*/
            var showResult = fp.show();
            var rosterText = new String(myRoster.getRosterText());
            if (showResult == nsIFilePicker.returnOK || showResult == nsIFilePicker.returnReplace)
            {
		var file = fp.file;
		var path = fp.file.path;
                var outFileStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
		outFileStream.init(file, 0x02 | 0x08 | 0x20, 0660, 0);
		outFileStream.write(rosterText, rosterText.length);
		outFileStream.close();

/*         	if (navigator.appVersion.indexOf("Win")!=-1) { } // = Windows
         	else
         	{
                  //save the default folder
                  prefs.setCharPref("defaultfolder", path);
         	}
*/
            }
        }
/*//-----------------        
        	fp.init(window, "", nsIFilePicker.modeGetFolder);
	//fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);

	// locate current directory
	current_folder_input = createValidDestination(current_folder_input);	
	if (current_folder_input != false) fp.displayDirectory = current_folder_input;

	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK)
	{
		var asf_url = fp.file.path;

		// Set the data into the input box
		document.getElementById("asf-default-folder").value = asf_url;

	}

//needed for linux and Mac: autosaved when changing folder
	if (navigator.appVersion.indexOf("Win")!=-1) { } // = Windows
	else
	{
	//save the default folder
	var default_folder = document.getElementById("asf-default-folder").value;
	prefManager.setCharPref("extensions.asf.defaultfolder", default_folder);
	}
//------------------------
*/        
    },
    
    onAutoSave: function()
    {
        
    },
    sendRoster: function(recipient,subjString,bodyString)
    {
    	try
        {
            var rDoc = rp_getContentDocument();
            var tB = rDoc.getElementById("rosterprocessor-sendLink");
            if ( !tB )
            {
                var x = rDoc.createElement("DIV");
                var y = rDoc.createElement("A");
                y.setAttribute("id","rosterprocessor-sendLink");
                x.appendChild(y);
                rDoc.body.appendChild(x);
                tB = rDoc.getElementById("rosterprocessor-sendLink");
            }
            var hrefString = "mailto:" + recipient + "?&subject=" + subjString + "&body=" + bodyString;
//            dump("---------\n" + hrefString );
            tB.setAttribute("href",encodeURI(hrefString));
            var mEvent = document.createEvent("MouseEvents");
            mEvent.initEvent("click","true","true");
            tB.dispatchEvent(mEvent);
        }
        catch(e)
        {
            alert("Error trying to email roster! ( " + e + " )");
        }
    },
    onMailTo: function()
    {
    var subjString = myRoster.getTitleString();
    var bodyString = subjString + 
        "\n\n" + myRoster.text.body + "\n-----------------------\n" + myRoster.text.footer +
        "\n\n" + this.strings.getString("mailFooter");
    this.sendRoster('',subjString,myRoster.getRosterString());
    },
    
    onBugReport: function()
    {
//    dump("On Bug Report\n");
    var validRoster = isValidRoster(myRoster);
    if ( !validRoster )
    {
        myRoster = new roster();
        myRoster.text.all = rp_getContentDocument().body.textContent;
    }

    var subjString = myRoster.getTitleString();
    var bodyString = "[Please enter description of problem here!]\n\n\n\n\n\n\n------------------------------------------\n" +
        subjString + "\n\n" + myRoster.text.body + "\n------------------------------------------\n" +
        myRoster.text.footer;
    var theDesc = this.strings.getString("rosterprocessor_bugFormEdit");
    var userEmail = "";
    var chopPattern = /^Please enter your bug reports, suggestions, etc here:/;
    var params = { in:{desc:theDesc, id:818995, roster:myRoster, email:userEmail }, out: null }; 
    var url="http://www.aircrewrosters.com/bugreport.php";
    //var url="http://localhost/aircrewrosters/bugtest2.php"; //?&desc=test";
//    dump("Bug params in:"+params.in.email+"\nBug params out:"+params.out+"\n");
do
    {
        validDesc = false;
        params.out = null;
        window.openDialog("chrome://rosterprocessor/content/bugreport/bugform.xul", "rosterprocessor-bugform-dialog", "centerscreen,chrome,modal,resizable", params);
//        dump("Bug params in:"+params.in.email+"\nBug params out:"+params.out+"\n");
        if ( params.out ) // Send pressed
        {
            theDesc = params.out.desc;
            userEmail = params.out.email;
            theDesc = theDesc.replace(this.strings.getString("rosterprocessor_bugFormEdit"),"");
            if ( theDesc == "" )
            { // empty report description
                alert("Please enter some descriptive text of the problem!");
                validDesc = false; // frig to get it to loop
            }
            else
            {
                if ( userEmail == "" )
                { // invalid email address
                    alert("Please enter a valid email address.");
                    validDesc = false; // frig to get it to loop
                }
                else // Everything OK so send to the web database
                {
                	//stream = encodeURI("&id="+params.out.id+"&desc="+theDesc+"&roster="+myRoster.getRosterText()+"&email="+userEmail+"&ver="+PROGRAM_VERSION);
                    //stream = "Extension Version:"+PROGRAM_VERSION + "\nReply Email:" + userEmail + "\n\nReport:\n" + theDesc + "\n\nRoster:\n"+myRoster.getRosterText();
                    stream = "Extension Version:"+PROGRAM_VERSION + "\n\nReport:\n" + theDesc + "\n\nRoster:\n"+myRoster.getRosterText();
                	this.sendRoster(RP_EMAIL,"Bug Report",stream);
                	//sendToWeb(url,stream,this.processBugFormResponse,"There was a problem sending the report!");
                	validDesc = true; // drop out the loop
                }
            }
        }
    }while( params.out && !validDesc );

    },
    processBugFormResponse: function(response)
    {
        var theResults = response.split(",");
        var rCode = (theResults[0].substring((theResults[0].indexOf("=")+1),theResults[0].length)).toLowerCase();
//        dump("\n-------------\nResults[0]="+theResults[0] + "\nrCode=" + rCode + "\n----------\n");
        if( rCode == "true" )
        {
            alert("Thankyou, your report has been registered!");
        }
        else
        {
            alert("Sorry an error occurred processing your report!");
//            dump("Response is " + response + "\n");
        }
    },

 processCollate: function(response)
 {
        dump(response);
        var theResults = response.split(",");
        var rCode = (theResults[0].substring((theResults[0].indexOf("=")+1),theResults[0].length)).toLowerCase();
 },

  onSaveAsCal: function() {
    // Set to the os home directory
    var defaultDir = Components.classes["@mozilla.org/file/directory_service;1"]
                .getService(Components.interfaces.nsIProperties)
                .get("Home", Components.interfaces.nsILocalFile);

//    dump(icalExt + "\n");
    // Grab a copy of the roster
    var validRoster = isValidRoster(myRoster);
    if ( !validRoster )
    {
        myRoster = new roster();
        myRoster.text.all = rp_getContentDocument().body.textContent;
        if (!isvalidRoster(myRoster) ) {
          alert("Unrecognised roster");
          return;
        }
    }
   
   try {
        var rt = (myRoster instanceof BaFcRoster) ? 1 : 0;
        rt = (myRoster instanceof BaCcRoster) ? 2 : rt;
        

       if (myRoster.parsePage(myRoster)) {
        var icalText = outputICAL(myRoster);
        dump("\n" + icalText + "\n");
        var fp = Components.classes["@mozilla.org/filepicker;1"]
	           .createInstance(nsIFilePicker);
        fp.defaultString = myRoster.getFileName() + icalExt;
//        fp.displayDirectory = defaultDir;
        fp.init(window, this.strings.getString("saveDialogTitle"), nsIFilePicker.modeSave);
        fp.appendFilter("Calendar files","*" + icalExt);
        fp.appendFilters(nsIFilePicker.filterAll);
        fp.filterIndex = 0;
        var showResult = fp.show();
        if (showResult == nsIFilePicker.returnOK || showResult == nsIFilePicker.returnReplace) {
        	var file = fp.file;
            var path = fp.file.path;
            var outFileStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
        	outFileStream.init(file, 0x02 | 0x08 | 0x20, 0660, 0);
        	outFileStream.write(icalText, icalText.toString().length);
            outFileStream.close();
        }
        var stream = "Extension Version:"+PROGRAM_VERSION + "\nRosterType:"+rt+"\nFirstName:"+myRoster.firstName+"\nLastName:"+myRoster.lastName+"\nCrewCode:"+myRoster.getFileName()+"\nRoster:\n"+myRoster.getRosterText()+"\n\niCal:\n"+icalText;
        //this.sendRoster(RP_EMAIL,"Decode Error for "+myRoster.getFileName(),stream);
       }
   }
   catch(err) {
      alert("Error decoding roster: " + err.errorText + "\n\nPlease email me the following bug report.");
      var stream = "Extension Version:"+PROGRAM_VERSION + "\nRosterType:"+rt+"\nFirstName:"+myRoster.firstName+"\nLastName:"+myRoster.lastName+"\nCrewCode:"+myRoster.getFileName()+"\nRoster:\n"+myRoster.getRosterText()+"\n\niCal:\n"+icalText;
      this.sendRoster(RP_EMAIL,"Decode Error",stream);
   }
},


  onSaveAsLog: function() {
    window.openDialog("chrome://rosterprocessor/content/logbook.xul", "rosterprocessor-logbook-dialog", "centerscreen,chrome,modal,resizable");
},


  onSync: function() {

    var validRoster = isValidRoster(myRoster);
    if ( !validRoster )
    {
        myRoster = new roster();
        myRoster.text.all = rp_getContentDocument().body.textContent;
        if (!isvalidRoster(myRoster) ) {
          alert("Unrecognised roster");
          return;
        }
    }
   
   try {
        var rt = (myRoster instanceof BaFcRoster) ? 1 : 0;
        rt = (myRoster instanceof BaCcRoster) ? 2 : rt;
        

       if (myRoster.parsePage(myRoster)) {
        var icalText = outputICAL(myRoster);
        var domTree = outputXML(myRoster);
        var serializer = new XMLSerializer();
        dump("\n" + serializer.serializeToString(domTree) + "\n");

//        var stream = encodeURI("&rostype="+rt+"&fname="+myRoster.firstName+"&lname="+myRoster.lastName+"&ccode="+myRoster.getFileName()+"&roster="+myRoster.getRosterText()+"&ics="+icalText+"&ver="+PROGRAM_VERSION);
        var url="http://127.0.0.1/mfcr/updatexml.php";
        //sendToWeb(url,domTree,this.processCollate,"");
       }
   }
   catch(err) {
      alert("Error decoding roster: " + err.errorText );
        var stream = encodeURI("&rostype="+rt+"&fname="+myRoster.firstName+"&lname="+myRoster.lastName+"&ccode="+myRoster.getFileName()+"&roster="+myRoster.getRosterText()+"&ver="+PROGRAM_VERSION);
        var url="http://www.aircrewrosters.com/collate.php";
//        sendToWeb(url,stream,this.processCollate,"");
   }
  },

  serializeXML: function(filePath,domTree) {
   try   {
      var serializer = new XMLSerializer();
      var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
         .createInstance(Components.interfaces.nsIFileOutputStream);
         foStream.init(filePath, 0x02 | 0x08 | 0x20, 0664, 0);   // write, create, truncate
         serializer.serializeToStream(domTree, foStream, "");   // rememeber, doc is the DOM tree
         }
   finally {
      foStream.close();
   }
  },

  onMenuItemCommand: function(e) {
   
//      promptService.alert(window, this.strings.getString("helloMessageTitle"),
//                                this.strings.getString("helloMessage"));
    gBrowser.addTab("https://fgprd-web.baplc.com/statements/currentmenu.do");

  // Get the path as string. Note that you usually won't 
  // need to work with the string paths.
  // work with returned nsILocalFile...
  },

  onToolbarButtonCommand: function(e) {
    // just reuse the function above.  you can change this, obviously!
    rosterprocessor.onMenuItemCommand(e);
  },


  onCheckForUpdates: function() {
        // Check website for an updated version
        var win = window.openDialog("chrome://mozapps/content/extensions/extensions.xul", "", "chrome,menubar,extra-chrome,toolbar,dialog=no,resizable", "updates-only");
  },

  onLoad: function(e) {
    // initialization code
       dump("HERE in onLoad\n");
    this.initialized = true;
    rosterprocessor_setupDefaultOptions();
    this.strings = document.getElementById("rosterprocessor-strings");
//     document.getElementById("context-rosterprocessor").hidden = false;

   IPSO_CheckUpdate(); // check for update
    document.getElementById("contentAreaContextMenu")
            .addEventListener("popupshowing", this.showContextMenu, false);
    document.getElementById("menu_ToolsPopup")
            .addEventListener("popupshowing", this.showToolsMenu, false);
    document.getElementById("menu_FilePopup")
            .addEventListener("popupshowing", this.showFileMenu, false);
  }

};


window.addEventListener("load", function(e) { rosterprocessor.onLoad(e); }, false);

// hide the update button
function updateNotAvailable()
{
//   document.getElementById('HiddenUpdate').hidden = true;
return;
}

function UpdateCheckListener() {

}

UpdateCheckListener.prototype = {

// show the update button
onUpdateStarted: function() {

//   document.getElementById('HiddenUpdate').hidden = false;
   return;
},

// show the update button
onUpdateEnded: function() {

//   document.getElementById('HiddenUpdate').hidden = false;

   return;
},

onAddonUpdateStarted: function(addon) {
   
   return;
},

  onUpdateStarted: function() {

  },
 
  onUpdateEnded: function() {

  },

// if there is update, present the user with a button on the toolbar to let him know about the update
onAddonUpdateEnded: function(addon, status)
{

// nsIExtensionManager.idl
const nsIAUCL = Components.interfaces.nsIAddonUpdateCheckListener;

switch (status) {
   case nsIAUCL.STATUS_UPDATE:
      availableUpdate = addon;
//      document.getElementById('HiddenUpdate').hidden = false;
      var win = window.openDialog("chrome://mozapps/content/extensions/extensions.xul", "", "chrome,menubar,extra-chrome,toolbar,dialog=no,resizable", "updates-only");
    return;
   }
updateNotAvailable();
},


// See nsISupports.idl
QueryInterface: function(iid) {

if (!iid.equals(Components.interfaces.nsIAddonUpdateCheckListener) && !iid.equals(Components.interfaces.nsISupports))
   throw Components.results.NS_ERROR_NO_INTERFACE;
return this;
}

};



// called on startup to check for update
function IPSO_CheckUpdate()
{
var nsIUpdateItem = gExtensionManager.getItemForID("{3AC28DC2-F1AD-4E67-8496-09DF2C38C08B}");
var nsIUpdateItems = new Array(nsIUpdateItem);
var nsIUpdateCheckListener = new UpdateCheckListener();

gExtensionManager.update(nsIUpdateItems, nsIUpdateItems.length, false, nsIUpdateCheckListener);

} 
