/*******************************************************************************
 * This code is copyright of Jon Lidgard (jonlidgard@gmail.com). Please do not
 * copy, modify, or distribute without prior consent.
 * 
 * Version 0.1.25, April 20th, 2008.
 ******************************************************************************/

/*
 * NOTE: When updating version number: Update in install.rdf, update.rdf,
 * about.xul
 */

debugger;
const DEBUG = true;
const THROW_EXCEPTION_ERROR_LEVEL = 0x100; // DO NOT VARY THIS.
const LOG_LEVEL = 10; // SET logging level here
const icalExt = '.ics';

const PROGRAM_VERSION = '0.1.25';
const RP_EMAIL = 'rosterprocessor@gmail.com';
const RP_STATEMENTS_URL = 'https://crewlink.baplc.com/crewlink/portal.jsp';
const RP_HELP_URL = 'http://www.aircrewrosters.com/help.html';

// Globals
var myRoster = null;
var firstShow = true;

var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
const nsLocalFile = Components.Constructor("@mozilla.org/file/local;1", "nsILocalFile", "initWithPath");
const nsIFilePicker = Components.interfaces.nsIFilePicker;

var rosterTypes = new Array();
rosterTypes[0] = BaFcRoster;
rosterTypes[1] = BaCcRoster;

// Create an object type UserException
function RosterException(message) {
  this.errorText = message;
  this.name = "RosterException";
}

// Make the exception convert to a pretty string when used as
// a string (e.g. by the error console)
RosterException.prototype.toString = function() {
  return this.name + ': "' + this.message + '"';
}

function isValidRoster() {
  var theRoster = null;
  for (var testRoster in rosterTypes) {
    try {
      theRoster = new rosterTypes[testRoster]();
      theRoster.getRosterInfo();
      break;
    } catch(err) {
      theRoster = null;
    }
  }
  return (theRoster);
};

function createValidDestination(path) {
  if (!path) return false;
  if (trimString(path).length == 0) return false;
  var directory = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

  try {
    directory.initWithPath(path);
    if (directory.exists()) return directory;
  } catch(e) {
    return false;
  }
  return directory;
}

var rosterprocessor = {

  showContextMenu: function() {
    myRoster = isValidRoster();
    var invalidRoster = (myRoster instanceof roster) ? "": "true";
    document.getElementById("context-rosterprocessor").setAttribute("disabled", invalidRoster);
  },

  showToolsMenu: function() {
    myRoster = isValidRoster();
    var invalidRoster = (myRoster instanceof roster) ? "": "true";
    document.getElementById("rosterprocessor-Tools-SaveAsText").setAttribute("disabled", invalidRoster);
    document.getElementById("rosterprocessor-Tools-SaveAsCal").setAttribute("disabled", invalidRoster);
    document.getElementById("rosterprocessor-Tools-MailTo").setAttribute("disabled", invalidRoster);
    document.getElementById("rosterprocessor-Tools-BugReport").setAttribute("disabled", false);
  },

  showFileMenu: function() {
    myRoster = isValidRoster();
    var invalidRoster = (myRoster instanceof roster) ? "": "true";
    document.getElementById("rosterprocessor-File-SaveAsCal").setAttribute("disabled", invalidRoster);
  },

  // Opens the help
  help: function() {
    rosterprocessor_loadURL(RP_HELP_URL);
  },

  // Displays the about dialog
  about: function() {
    window.openDialog("chrome://rosterprocessor/content/about/about.xul", "rosterprocessor-about-dialog", "centerscreen,chrome,modal");
  },

  // Displays the options dialog
  options: function() {
    window.openDialog("chrome://rosterprocessor/content/options/options.xul", "rosterprocessor-options-dialog", "centerscreen,chrome,modal,resizable");

  },

  onSaveAsText: function() {

    // Set to the os home directory
    var defaultDir = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("Home", Components.interfaces.nsILocalFile);

    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.rosterprocessor.");

    var current_folder_input = '';
    if (prefs.prefHasUserValue("defaultfolder")) {
      current_folder_input = prefs.getCharPref("defaultfolder");
    }
    LOG(10, "Current Folder: " + current_folder_input + "\n");

    if (myRoster == null) {
      myRoster = isValidRoster(myRoster);
    }
    if (myRoster && myRoster.parsePage()) {
      var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
      fp.defaultString = myRoster.getFileName() + ".txt";
      if (firstShow) {
        fp.displayDirectory = defaultDir;
        firstShow = false;
      }
      fp.init(window, this.strings.getString("saveDialogTitle"), nsIFilePicker.modeSave);
      fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);
      fp.filterIndex = 0;

      var showResult = fp.show();
      var rosterText = new String(myRoster.getRosterText());
      if (showResult == nsIFilePicker.returnOK || showResult == nsIFilePicker.returnReplace) {
        var file = fp.file;
        var path = fp.file.path;
        var outFileStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
        outFileStream.init(file, 0x02 | 0x08 | 0x20, 0660, 0);
        outFileStream.write(rosterText, rosterText.length);
        outFileStream.close();
      }
    }
  },

  launchEmail: function(recipient, subjString, bodyString, attachmentPath) // email function
  {
    try {
      var rDoc = rp_getContentDocument();
      var tB = rDoc.getElementById("rosterprocessor-sendLink");
      if (!tB) {
        var x = rDoc.createElement("DIV");
        var y = rDoc.createElement("A");
        y.setAttribute("id", "rosterprocessor-sendLink");
        x.appendChild(y);
        rDoc.body.appendChild(x);
        tB = rDoc.getElementById("rosterprocessor-sendLink");
      }
      //            var hrefString = "mailto:" + recipient + "?attachment=" + attachmentPath + "&subject=" + subjString + "&body=" + bodyString;
      var hrefString = "mailto:" + encodeURI(recipient) +
      //            	"?attachment=" + encodeURI(attachmentPath) +
      "?subject=" + encodeURI(subjString) + "&body=" + encodeURI(bodyString);
      tB.setAttribute("href", hrefString);
      //            tB.setAttribute("href",encodeURI(hrefString));
      //            if( attachmentPath != '') {
      //            	hrefString = hrefString + "&attachment=" + attachmentPath;
      //            }
      dump("\nhref:=" + hrefString + "\n\n");
      var mEvent = document.createEvent("MouseEvents");
      mEvent.initEvent("click", "true", "true");
      tB.dispatchEvent(mEvent);
    } catch(e) {
      alert("Error trying to launch email! ( " + e + " )");
    }
  },

  onMailTo: function() {

    // Grab a copy of the roster
    var validRoster = isValidRoster(myRoster);
    if (!validRoster) {
      myRoster = new roster();
      myRoster.text.all = rp_getContentDocument().body.textContent;
      if (!isvalidRoster(myRoster)) {
        alert("Unrecognised roster");
        return;
      }
    }

    try {
      var rt = (myRoster instanceof BaFcRoster) ? 1 : 0;
      rt = (myRoster instanceof BaCcRoster) ? 2 : rt;

      if (myRoster.parsePage(myRoster)) {
        var icalText = outputICAL(myRoster);
        /*
            var file = Components.classes["@mozilla.org/file/directory_service;1"].
                    getService(Components.interfaces.nsIProperties).
                    get("TmpD", Components.interfaces.nsIFile);

            file.append("roster.ics");
            file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666); //adds text to make filename unique if already exists
          
            var outFileStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
            outFileStream.init(file, 0x02 | 0x08 | 0x20, 0660, 0);
            outFileStream.write(icalText, icalText.toString().length);
            outFileStream.close();
 */
        var subjString = myRoster.getTitleString();
        var bodyString = subjString + "\n\n" + myRoster.text.body + "\n-----------------------\n" + myRoster.text.footer;
        // "\n\n" + this.strings.getString("mailFooter");
        // this.launchEmail('',subjString,bodyString,file.path);
        this.launchEmail('', subjString, bodyString, '');
      }
    } catch(err) {
      alert("Error decoding roster: " + err.errorText + "\n\nPlease email me the following bug report.");
      var stream = "Extension Version:" + PROGRAM_VERSION + "\nRosterType:" + rt + "\nFirstName:" + myRoster.firstName + "\nLastName:" + myRoster.lastName + "\nCrewCode:" + myRoster.getFileName() + "\nRoster:\n" + myRoster.getRosterText() + "\n\niCal:\n" + icalText;
      this.launchEmail(RP_EMAIL, "Decode Error", stream, '');
    }
    dump("\nonMailTo:\n");
  },

  onBugReport: function() {
    var validRoster = isValidRoster(myRoster);
    if (!validRoster) {
      myRoster = new roster();
      myRoster.text.all = rp_getContentDocument().body.textContent;
    }

    var subjString = myRoster.getTitleString();
    var bodyString = "[Please enter description of problem here!]\n\n\n\n\n\n\n------------------------------------------\n" + subjString + "\n\n" + myRoster.text.body + "\n------------------------------------------\n" + myRoster.text.footer;
    var theDesc = this.strings.getString("rosterprocessor_bugFormEdit");
    var userEmail = "";
    var chopPattern = /^Please enter your bug reports, suggestions, etc here:/;
    var params = { in :{
        desc: theDesc,
        id: 818995,
        roster: myRoster,
        email: userEmail
      },
      out: null
    };
    var url = "http://www.aircrewrosters.com/bugreport.php";
    do {
      validDesc = false;
      params.out = null;
      window.openDialog("chrome://rosterprocessor/content/bugreport/bugform.xul", "rosterprocessor-bugform-dialog", "centerscreen,chrome,modal,resizable", params);
      if (params.out) // Send pressed
      {
        theDesc = params.out.desc;
        userEmail = params.out.email;
        theDesc = theDesc.replace(this.strings.getString("rosterprocessor_bugFormEdit"), "");
        if (theDesc == "") { // empty report description
          alert("Please enter some descriptive text of the problem!");
          validDesc = false; // frig to get it to loop
        } else {
          stream = "Extension Version:" + PROGRAM_VERSION + "\n\nReport:\n" + theDesc + "\n\nRoster:\n" + myRoster.getRosterText();
          this.launchEmail(RP_EMAIL, "Bug Report", stream, '');
          // sendToWeb(url,stream,this.processBugFormResponse,"There
          // was a problem sending the report!");
          validDesc = true; // drop out the loop
        }
      }
    } while ( params . out && ! validDesc );

  },
  processBugFormResponse: function(response) {
    var theResults = response.split(",");
    var rCode = (theResults[0].substring((theResults[0].indexOf("=") + 1), theResults[0].length)).toLowerCase();
    // dump("\n-------------\nResults[0]="+theResults[0] + "\nrCode=" + rCode +
    // "\n----------\n");
    if (rCode == "true") {
      alert("Thankyou, your report has been registered!");
    } else {
      alert("Sorry an error occurred processing your report!");
      // dump("Response is " + response + "\n");
    }
  },

  processCollate: function(response) {
    dump(response);
    var theResults = response.split(",");
    var rCode = (theResults[0].substring((theResults[0].indexOf("=") + 1), theResults[0].length)).toLowerCase();
  },

  onSaveAsCal: function() {
    // Set to the os home directory
    var defaultDir = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("Home", Components.interfaces.nsILocalFile);

    // Grab a copy of the roster
    var validRoster = isValidRoster(myRoster);
    if (!validRoster) {
      myRoster = new roster();
      myRoster.text.all = rp_getContentDocument().body.textContent;
      if (!isvalidRoster(myRoster)) {
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
        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        fp.defaultString = myRoster.getFileName() + icalExt;
        // fp.displayDirectory = defaultDir;
        fp.init(window, this.strings.getString("saveDialogTitle"), nsIFilePicker.modeSave);
        fp.appendFilter("Calendar files", "*" + icalExt);
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
      }
    } catch(err) {
      alert("Error decoding roster: " + err.errorText + "\n\nPlease email me the following bug report.");
      var stream = "Extension Version:" + PROGRAM_VERSION + "\nRosterType:" + rt + "\nFirstName:" + myRoster.firstName + "\nLastName:" + myRoster.lastName + "\nCrewCode:" + myRoster.getFileName() + "\nRoster:\n" + myRoster.getRosterText() + "\n\niCal:\n" + icalText;
      this.launchEmail(RP_EMAIL, "Decode Error", stream, '');
    }
  },

  onSaveAsLog: function() {
    window.openDialog("chrome://rosterprocessor/content/logbook.xul", "rosterprocessor-logbook-dialog", "centerscreen,chrome,modal,resizable");
  },

  onMenuItemCommand: function(e) {

    gBrowser.addTab(RP_STATEMENTS_URL);
  },

  onToolbarButtonCommand: function(e) {
    // just reuse the function above. you can change this, obviously!
    rosterprocessor.onMenuItemCommand(e);
  },

  onCheckForUpdates: function() {
    // Check website for an updated version
    var win = window.openDialog("chrome://mozapps/content/extensions/extensions.xul", "", "chrome,menubar,extra-chrome,toolbar,dialog=no,resizable", "updates-only");
  },

  onLoad: function(e) {
    // initialization code

    this.initialized = true;
    rosterprocessor_setupDefaultOptions();
    this.strings = document.getElementById("rosterprocessor-strings");
    // document.getElementById("context-rosterprocessor").hidden = false;
    document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", this.showContextMenu, false);
    document.getElementById("menu_ToolsPopup").addEventListener("popupshowing", this.showToolsMenu, false);
    document.getElementById("menu_FilePopup").addEventListener("popupshowing", this.showFileMenu, false);
  }

};

window.addEventListener("load",
function(e) {
  rosterprocessor.onLoad(e);
},
false);