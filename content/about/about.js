/**************************************************************
This code is copyright of Jon Lidgard (jonlidgard@gmail.com).
Please do not copy, modify, or distribute without prior consent.

Version 0.1.9, April 20th, 2008.
***************************************************************/

// Loads the extension home page in a new tab
function rosterprocessor_visitHomePage()
{
    var parentWindow = null;
    var url          = "http://www.aircrewrosters.com";

    // If there is a parent window
    if(window.opener)
    {
        // If there is a grand parent window
        if(window.opener.opener)
        {
            parentWindow = window.opener.opener;
        }
        else
        {
            parentWindow = window.opener;
        }
    }

    // If a parent window was found
    if(parentWindow)
    {
        // If the open in windows preference is set to true
        if(rosterprocessor_getBooleanPreference("rosterprocessor.open.tabs", true))
        {
            var newTab = parentWindow.getBrowser().addTab(url);

            // If the open tabs in background preference is not set or is set to false
            if(!rosterprocessor_getBooleanPreference("rosterprocessor.open.tabs.background", true))
            {
                parentWindow.getBrowser().selectedTab = newTab;
            }
        }
        else
        {
            parentWindow.open(url);
        }

        window.close();
    }
}