/**************************************************************
This code is copyright of Jon Lidgard (jonlidgard@gmail.com).
Please do not copy, modify, or distribute without prior consent.

Version 0.1.25, April 20th, 2008.
***************************************************************/


var rosterprocessor_optionsDataBoolean        = new Array();
var rosterprocessor_optionsDataInteger        = new Array();
var rosterprocessor_optionsDataString         = new Array();

//--------------------------------------------------------------------------------------------------
// Handles changing the options page
function rosterprocessor_changePage(pageList)
{
    rosterprocessor_storeOptions();

    document.getElementById("rosterprocessor-options-iframe").setAttribute("src", pageList.selectedItem.value);
}

//--------------------------------------------------------------------------------------------------
// Resets the user's options
// GENERIC - COMPLETE
function rosterprocessor_resetOptions()
{
    var promptServiceInterface = Components.interfaces.nsIPromptService;
    var stringBundle           = document.getElementById("rosterprocessor-string-bundle");

    // If the reset is confirmed
    if(Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(promptServiceInterface).confirmEx(null, stringBundle.getString("rosterprocessor_resetConfirmation"), stringBundle.getString("rosterprocessor_resetConfirmationMessage"), promptServiceInterface.BUTTON_TITLE_YES * promptServiceInterface.BUTTON_POS_0 + promptServiceInterface.BUTTON_TITLE_CANCEL * promptServiceInterface.BUTTON_POS_1, stringBundle.getString("rosterprocessor_reset"), null, null, null, {}) == 0)
    {
//        rosterprocessor_localizedOptionsSetup = false;
        rosterprocessor_optionsDataBoolean    = new Array();
        rosterprocessor_optionsDataInteger    = new Array();
        rosterprocessor_optionsDataString     = new Array();

        rosterprocessor_deletePreferenceBranch("rosterprocessor.");

        rosterprocessor_setupDefaultOptions();
//        rosterprocessor_setupLocalizedOptions();
        rosterprocessor_initializeOptions();
    }
}

//--------------------------------------------------------------------------------------------------
// Sets up the default options
function rosterprocessor_setupDefaultOptions()
{
//    rosterprocessor_setBooleanPreferenceIfNotSet("rosterprocessor.useReportTime", true);
    rosterprocessor_setBooleanPreferenceIfNotSet("rosterprocessor.useUTC", false);

    rosterprocessor_setBooleanPreferenceIfNotSet("rosterprocessor.fcSplitTrip", false);
    rosterprocessor_setBooleanPreferenceIfNotSet("rosterprocessor.helpOpenTab", true);
    rosterprocessor_setBooleanPreferenceIfNotSet("rosterprocessor.fcShowFltNo", true);
    rosterprocessor_setBooleanPreferenceIfNotSet("rosterprocessor.fcShowWrapDays", false);
    rosterprocessor_setBooleanPreferenceIfNotSet("rosterprocessor.fcShowLeaveDays", false);
    rosterprocessor_setBooleanPreferenceIfNotSet("rosterprocessor.fcCrewOnSummary", true);
    rosterprocessor_setBooleanPreferenceIfNotSet("rosterprocessor.fcShowAbbrevNames", true);
    rosterprocessor_setBooleanPreferenceIfNotSet("rosterprocessor.fcNoSummary", false);

    rosterprocessor_setBooleanPreference("rosterprocessor.ccSplitTrip", false);
    rosterprocessor_setBooleanPreferenceIfNotSet("rosterprocessor.ccShowFltNo", true);
    rosterprocessor_setBooleanPreferenceIfNotSet("rosterprocessor.ccShowLeaveDays", false);
    rosterprocessor_setBooleanPreferenceIfNotSet("rosterprocessor.ccNoSummary", false);
}


//--------------------------------------------------------------------------------------------------
// Stores the user's options to be saved later
function rosterprocessor_storeOptions()
{
    var childNodes   = null;
    var description  = null;
    var i            = 0;
    var iFrame       = document.getElementById("rosterprocessor-options-iframe");
    var iFrameSrc    = iFrame.getAttribute("src");
    var key          = null;
    var listCell     = null;
    var listItem     = null;
    var pageDocument = iFrame.contentDocument;
    var path         = null;
    var stringBundle = document.getElementById("rosterprocessor-string-bundle");

    dump(iFrameSrc + "\n");
    if(iFrameSrc.indexOf("general") != -1)
    {
        rosterprocessor_optionsDataBoolean["rosterprocessor.useUTC"] = pageDocument.getElementById("rosterprocessor.useUTC").checked;
        rosterprocessor_optionsDataBoolean["rosterprocessor.helpOpenTab"] = pageDocument.getElementById("rosterprocessor.helpOpenTab").checked;
    }
    else if(iFrameSrc.indexOf("bafc_options") != -1)
    {
        rosterprocessor_optionsDataBoolean["rosterprocessor.fcSplitTrip"]  = pageDocument.getElementById("rosterprocessor.fcSplitTrip").checked;
        rosterprocessor_optionsDataBoolean["rosterprocessor.fcShowFltNo"] = pageDocument.getElementById("rosterprocessor.fcShowFltNo").checked;
        rosterprocessor_optionsDataBoolean["rosterprocessor.fcShowOffDays"] = pageDocument.getElementById("rosterprocessor.fcShowOffDays").checked;
        rosterprocessor_optionsDataBoolean["rosterprocessor.fcShowWrapDays"] = pageDocument.getElementById("rosterprocessor.fcShowWrapDays").checked;
        rosterprocessor_optionsDataBoolean["rosterprocessor.fcShowLeaveDays"] = pageDocument.getElementById("rosterprocessor.fcShowLeaveDays").checked;
        rosterprocessor_optionsDataBoolean["rosterprocessor.fcCrewOnSummary"] = pageDocument.getElementById("rosterprocessor.fcCrewOnSummary").checked;
        rosterprocessor_optionsDataBoolean["rosterprocessor.fcShowAbbrevNames"] = pageDocument.getElementById("rosterprocessor.fcShowAbbrevNames").checked;
        rosterprocessor_optionsDataBoolean["rosterprocessor.fcNoSummary"] = pageDocument.getElementById("rosterprocessor.fcNoSummary").checked;
    }
    else if(iFrameSrc.indexOf("bacc_options") != -1)
    {
        rosterprocessor_optionsDataBoolean["rosterprocessor.ccSplitTrip"]  = pageDocument.getElementById("rosterprocessor.ccSplitTrip").checked;
        rosterprocessor_optionsDataBoolean["rosterprocessor.ccShowOffDays"] = pageDocument.getElementById("rosterprocessor.ccShowOffDays").checked;
        rosterprocessor_optionsDataBoolean["rosterprocessor.ccShowFltNo"] = pageDocument.getElementById("rosterprocessor.ccShowFltNo").checked;
        rosterprocessor_optionsDataBoolean["rosterprocessor.ccShowLeaveDays"] = pageDocument.getElementById("rosterprocessor.ccShowLeaveDays").checked;
        rosterprocessor_optionsDataBoolean["rosterprocessor.ccNoSummary"] = pageDocument.getElementById("rosterprocessor.ccNoSummary").checked;
    }
}

//--------------------------------------------------------------------------------------------------
// Initialise options
function rosterprocessor_initializeOptions()
{
    var selectedPage = document.getElementById("rosterprocessor-page-list").selectedItem.value;

    // If this is the general page
    if(selectedPage.indexOf("general") != -1)
    {
        rosterprocessor_initializeGeneral();
    }
    else if(selectedPage.indexOf("bafc_options") != -1)
    {
        rosterprocessor_initializeBaFc();
    }
    else if(selectedPage.indexOf("bacc_options") != -1)
    {
        rosterprocessor_initializeBaCc();
    }
}

//--------------------------------------------------------------------------------------------------
// Initializes the general page
function rosterprocessor_initializeGeneral()
{
    var pageDocument = document.getElementById("rosterprocessor-options-iframe").contentDocument;

    // If the hide menu preference is set
    if(typeof rosterprocessor_optionsDataBoolean["rosterprocessor.useUTC"] != "undefined")
    {
        pageDocument.getElementById("rosterprocessor.useUTC").checked = rosterprocessor_optionsDataBoolean["rosterprocessor.useUTC"];
    }
    else if(rosterprocessor_isPreferenceSet("rosterprocessor.useUTC"))
    {
        pageDocument.getElementById("rosterprocessor.useUTC").checked = rosterprocessor_getBooleanPreference("rosterprocessor.useUTC", true);
    }
    else
    {
        pageDocument.getElementById("rosterprocessor.useUTC").checked = false;
    }

    if(typeof rosterprocessor_optionsDataBoolean["rosterprocessor.helpOpenTab"] != "undefined")
    {
        pageDocument.getElementById("rosterprocessor.helpOpenTab").checked = rosterprocessor_optionsDataBoolean["rosterprocessor.helpOpenTab"];
    }
    else if(rosterprocessor_isPreferenceSet("rosterprocessor.helpOpenTab"))
    {
        pageDocument.getElementById("rosterprocessor.helpOpenTab").checked = rosterprocessor_getBooleanPreference("rosterprocessor.helpOpenTab", true);
    }
    else
    {
        pageDocument.getElementById("rosterprocessor.helpOpenTab").checked = false;
    }
}


// Initializes the general page
function rosterprocessor_initializeBaFc()
{
    var pageDocument = document.getElementById("rosterprocessor-options-iframe").contentDocument;

    if(typeof rosterprocessor_optionsDataBoolean["rosterprocessor.fcSplitTrip"] != "undefined")
    {
        pageDocument.getElementById("rosterprocessor.fcSplitTrip").checked = rosterprocessor_optionsDataBoolean["rosterprocessor.fcSplitTrip"];
    }
    else if(rosterprocessor_isPreferenceSet("rosterprocessor.fcSplitTrip"))
    {
        pageDocument.getElementById("rosterprocessor.fcSplitTrip").checked = rosterprocessor_getBooleanPreference("rosterprocessor.fcSplitTrip", true);
    }
    else
    {
        pageDocument.getElementById("rosterprocessor.fcSplitTrip").checked = false;
    }
    if(typeof rosterprocessor_optionsDataBoolean["rosterprocessor.fcShowFltNo"] != "undefined")
    {
        pageDocument.getElementById("rosterprocessor.fcShowFltNo").checked = rosterprocessor_optionsDataBoolean["rosterprocessor.fcShowFltNo"];
    }
    else if(rosterprocessor_isPreferenceSet("rosterprocessor.fcShowFltNo"))
    {
        pageDocument.getElementById("rosterprocessor.fcShowFltNo").checked = rosterprocessor_getBooleanPreference("rosterprocessor.fcShowFltNo", true);
    }
    else
    {
        pageDocument.getElementById("rosterprocessor.fcShowFltNo").checked = false;
    }
    if(typeof rosterprocessor_optionsDataBoolean["rosterprocessor.fcShowOffDays"] != "undefined")
    {
        pageDocument.getElementById("rosterprocessor.fcShowOffDays").checked = rosterprocessor_optionsDataBoolean["rosterprocessor.fcShowOffDays"];
    }
    else if(rosterprocessor_isPreferenceSet("rosterprocessor.fcShowOffDays"))
    {
        pageDocument.getElementById("rosterprocessor.fcShowOffDays").checked = rosterprocessor_getBooleanPreference("rosterprocessor.fcShowOffDays", true);
    }
    else
    {
        pageDocument.getElementById("rosterprocessor.fcShowOffDays").checked = false;
    }
    if(typeof rosterprocessor_optionsDataBoolean["rosterprocessor.fcShowWrapDays"] != "undefined")
    {
        pageDocument.getElementById("rosterprocessor.fcShowWrapDays").checked = rosterprocessor_optionsDataBoolean["rosterprocessor.fcShowWrapDays"];
    }
    else if(rosterprocessor_isPreferenceSet("rosterprocessor.fcShowWrapDays"))
    {
        pageDocument.getElementById("rosterprocessor.fcShowWrapDays").checked = rosterprocessor_getBooleanPreference("rosterprocessor.fcShowWrapDays", true);
    }
    else
    {
        pageDocument.getElementById("rosterprocessor.fcShowWrapDays").checked = false;
    }
    if(typeof rosterprocessor_optionsDataBoolean["rosterprocessor.fcShowLeaveDays"] != "undefined")
    {
        pageDocument.getElementById("rosterprocessor.fcShowLeaveDays").checked = rosterprocessor_optionsDataBoolean["rosterprocessor.fcShowLeaveDays"];
    }
    else if(rosterprocessor_isPreferenceSet("rosterprocessor.fcShowLeaveDays"))
    {
        pageDocument.getElementById("rosterprocessor.fcShowLeaveDays").checked = rosterprocessor_getBooleanPreference("rosterprocessor.fcShowLeaveDays", true);
    }
    else
    {
        pageDocument.getElementById("rosterprocessor.fcShowLeaveDays").checked = false;
    }
    if(typeof rosterprocessor_optionsDataBoolean["rosterprocessor.fcCrewOnSummary"] != "undefined")
    {
        pageDocument.getElementById("rosterprocessor.fcCrewOnSummary").checked = rosterprocessor_optionsDataBoolean["rosterprocessor.fcCrewOnSummary"];
    }
    else if(rosterprocessor_isPreferenceSet("rosterprocessor.fcCrewOnSummary"))
    {
        pageDocument.getElementById("rosterprocessor.fcCrewOnSummary").checked = rosterprocessor_getBooleanPreference("rosterprocessor.fcCrewOnSummary", true);
    }
    else
    {
        pageDocument.getElementById("rosterprocessor.fcCrewOnSummary").checked = false;
    }
    if(typeof rosterprocessor_optionsDataBoolean["rosterprocessor.fcShowAbbrevNames"] != "undefined")
    {
        pageDocument.getElementById("rosterprocessor.fcShowAbbrevNames").checked = rosterprocessor_optionsDataBoolean["rosterprocessor.fcShowAbbrevNames"];
    }
    else if(rosterprocessor_isPreferenceSet("rosterprocessor.fcShowAbbrevNames"))
    {
        pageDocument.getElementById("rosterprocessor.fcShowAbbrevNames").checked = rosterprocessor_getBooleanPreference("rosterprocessor.fcShowAbbrevNames", true);
    }
    else
    {
        pageDocument.getElementById("rosterprocessor.fcShowAbbrevNames").checked = false;
    }
    if(typeof rosterprocessor_optionsDataBoolean["rosterprocessor.fcNoSummary"] != "undefined")
    {
        pageDocument.getElementById("rosterprocessor.fcNoSummary").checked = rosterprocessor_optionsDataBoolean["rosterprocessor.fcNoSummary"];
    }
    else if(rosterprocessor_isPreferenceSet("rosterprocessor.fcNoSummary"))
    {
        pageDocument.getElementById("rosterprocessor.fcNoSummary").checked = rosterprocessor_getBooleanPreference("rosterprocessor.fcNoSummary", true);
    }
    else
    {
        pageDocument.getElementById("rosterprocessor.fcNoSummary").checked = false;
    }
}
// Initializes the general page
function rosterprocessor_initializeBaCc()
{
    var pageDocument = document.getElementById("rosterprocessor-options-iframe").contentDocument;

    // If the hide menu preference is set
    if(typeof rosterprocessor_optionsDataBoolean["rosterprocessor.ccSplitTrip"] != "undefined")
    {
        pageDocument.getElementById("rosterprocessor.ccSplitTrip").checked = rosterprocessor_optionsDataBoolean["rosterprocessor.ccSplitTrip"];
    }
    else if(rosterprocessor_isPreferenceSet("rosterprocessor.ccSplitTrip"))
    {
        pageDocument.getElementById("rosterprocessor.ccSplitTrip").checked = rosterprocessor_getBooleanPreference("rosterprocessor.ccSplitTrip", true);
    }
    else
    {
        pageDocument.getElementById("rosterprocessor.ccSplitTrip").checked = false;
    }
    if(typeof rosterprocessor_optionsDataBoolean["rosterprocessor.ccShowFltNo"] != "undefined")
    {
        pageDocument.getElementById("rosterprocessor.ccShowFltNo").checked = rosterprocessor_optionsDataBoolean["rosterprocessor.ccShowFltNo"];
    }
    else if(rosterprocessor_isPreferenceSet("rosterprocessor.ccShowFltNo"))
    {
        pageDocument.getElementById("rosterprocessor.ccShowFltNo").checked = rosterprocessor_getBooleanPreference("rosterprocessor.ccShowFltNo", true);
    }
    else
    {
        pageDocument.getElementById("rosterprocessor.ccShowFltNo").checked = false;
    }
    if(typeof rosterprocessor_optionsDataBoolean["rosterprocessor.ccShowOffDays"] != "undefined")
    {
        pageDocument.getElementById("rosterprocessor.ccShowOffDays").checked = rosterprocessor_optionsDataBoolean["rosterprocessor.ccShowOffDays"];
    }
    else if(rosterprocessor_isPreferenceSet("rosterprocessor.ccShowOffDays"))
    {
        pageDocument.getElementById("rosterprocessor.ccShowOffDays").checked = rosterprocessor_getBooleanPreference("rosterprocessor.ccShowOffDays", true);
    }
    else
    {
        pageDocument.getElementById("rosterprocessor.ccShowOffDays").checked = false;
    }
    if(typeof rosterprocessor_optionsDataBoolean["rosterprocessor.ccShowLeaveDays"] != "undefined")
    {
        pageDocument.getElementById("rosterprocessor.ccShowLeaveDays").checked = rosterprocessor_optionsDataBoolean["rosterprocessor.ccShowLeaveDays"];
    }
    else if(rosterprocessor_isPreferenceSet("rosterprocessor.ccShowLeaveDays"))
    {
        pageDocument.getElementById("rosterprocessor.ccShowLeaveDays").checked = rosterprocessor_getBooleanPreference("rosterprocessor.ccShowLeaveDays", true);
    }
    else
    {
        pageDocument.getElementById("rosterprocessor.ccShowLeaveDays").checked = false;
    }
    if(typeof rosterprocessor_optionsDataBoolean["rosterprocessor.ccNoSummary"] != "undefined")
    {
        pageDocument.getElementById("rosterprocessor.ccNoSummary").checked = rosterprocessor_optionsDataBoolean["rosterprocessor.ccNoSummary"];
    }
    else if(rosterprocessor_isPreferenceSet("rosterprocessor.ccNoSummary"))
    {
        pageDocument.getElementById("rosterprocessor.ccNoSummary").checked = rosterprocessor_getBooleanPreference("rosterprocessor.ccNoSummary", true);
    }
    else
    {
        pageDocument.getElementById("rosterprocessor.ccNoSummary").checked = false;
    }
}

//--------------------------------------------------------------------------------------------------
// Saves the user's options
// GENERIC - COMPLETE
function rosterprocessor_saveOptions()
{
    var parentWindow = null;
    var option       = null;
    var optionValue  = null;

    // Make sure current page is stored
    rosterprocessor_storeOptions();

    // Loop through the boolean options
    for(option in rosterprocessor_optionsDataBoolean)
    {
        rosterprocessor_setBooleanPreference(option, rosterprocessor_optionsDataBoolean[option]);
    }

    // Loop through the integer options
    for(option in rosterprocessor_optionsDataInteger)
    {
        optionValue = rosterprocessor_optionsDataInteger[option];

        // If the option value is set
        if(optionValue)
        {
            rosterprocessor_setIntegerPreference(option, optionValue);
        }
        else if(rosterprocessor_isPreferenceSet(option))
        {
            rosterprocessor_deletePreference(option);
        }
    }

    // Loop through the string options
    for(option in rosterprocessor_optionsDataString)
    {
        optionValue = rosterprocessor_optionsDataString[option];

        // If the option value is set or the preference currently has a value
        if(optionValue || rosterprocessor_isPreferenceSet(option))
        {
            rosterprocessor_setStringPreference(option, optionValue);
        }
    }

//    rosterprocessor_configureKeyboardShortcuts(false);
}

//--------------------------------------------------------------------------------------------------
