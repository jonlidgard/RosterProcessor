/**************************************************************
This code is copyright of Jon Lidgard (jonlidgard@gmail.com).
Please do not copy, modify, or distribute without prior consent.

Version 0.1.24, April 20th, 2008.
***************************************************************/

// Deletes a preference
function rosterprocessor_deletePreference(preference)
{
    // If the preference is set
    if(preference)
    {
        // If a user preference is set
        if(rosterprocessor_isPreferenceSet(preference))
        {
            Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("").clearUserPref(preference);
        }
    }
}

// Deletes a preference branch
function rosterprocessor_deletePreferenceBranch(branch)
{
    // If the branch is set
    if(branch)
    {
        Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("").deleteBranch(branch);
    }
}

// Gets a boolean preference, returning false if the preference is not set
function rosterprocessor_getBooleanPreference(preference, userPreference)
{
    // If the preference is set
    if(preference)
    {
        // If not a user preference or a user preference is set
        if(!userPreference || rosterprocessor_isPreferenceSet(preference))
        {
            try
            {
                return Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("").getBoolPref(preference);
            }
            catch(exception)
            {
                // Do nothing
            }
        }
    }

    return false;
}

// Gets an integer preference, returning 0 if the preference is not set
function rosterprocessor_getIntegerPreference(preference, userPreference)
{
    // If the preference is set
    if(preference)
    {
        // If not a user preference or a user preference is set
        if(!userPreference || rosterprocessor_isPreferenceSet(preference))
        {
            try
            {
                return Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("").getIntPref(preference);
            }
            catch(exception)
            {
                // Do nothing
            }
        }
    }

    return 0;
}

// Gets a string preference, returning null if the preference is not set
function rosterprocessor_getStringPreference(preference, userPreference)
{
    // If the preference is set
    if(preference)
    {
        // If not a user preference or a user preference is set
        if(!userPreference || rosterprocessor_isPreferenceSet(preference))
        {
            try
            {
                return Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("").getComplexValue(preference, Components.interfaces.nsISupportsString).data.trim();
            }
            catch(exception)
            {
                // Do nothing
            }
        }
    }

    return null;
}

// Is a preference set
function rosterprocessor_isPreferenceSet(preference)
{
    // If the preference is set
    if(preference)
    {
        return Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("").prefHasUserValue(preference);
    }

    return false;
}

// Sets a boolean preference
function rosterprocessor_setBooleanPreference(preference, value)
{
    // If the preference is set
    if(preference)
    {
        Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("").setBoolPref(preference, value);
    }
}

// Sets a boolean preference if it is not already set
function rosterprocessor_setBooleanPreferenceIfNotSet(preference, value)
{
    // If the preference is not set
    if(!rosterprocessor_isPreferenceSet(preference))
    {
        Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("").setBoolPref(preference, value);
    }
}

// Sets an integer preference
function rosterprocessor_setIntegerPreference(preference, value)
{
    // If the preference is set
    if(preference)
    {
        Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("").setIntPref(preference, value);
    }
}

// Sets an integer preference if it is not already set
function rosterprocessor_setIntegerPreferenceIfNotSet(preference, value)
{
    // If the preference is not set
    if(!rosterprocessor_isPreferenceSet(preference))
    {
        rosterprocessor_setIntegerPreference(preference, value);
    }
}

// Sets a string preference
function rosterprocessor_setStringPreference(preference, value)
{
    // If the preference is set
    if(preference)
    {
        var supportsStringInterface = Components.interfaces.nsISupportsString;
        var string                  = Components.classes["@mozilla.org/supports-string;1"].createInstance(supportsStringInterface);

        string.data = value;

        Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("").setComplexValue(preference, supportsStringInterface, string);
    }
}

// Sets a string preference if it is not already set
function rosterprocessor_setStringPreferenceIfNotSet(preference, value)
{
    // If the preference is not set
    if(!rosterprocessor_isPreferenceSet(preference))
    {
        rosterprocessor_setStringPreference(preference, value);
    }
}