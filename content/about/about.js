/**************************************************************
This code is copyright of Jon Lidgard (jonlidgard@gmail.com).
Please do not copy, modify, or distribute without prior consent.

Version 0.1.9, April 20th, 2008.
***************************************************************/

// Loads the extension home page in a new tab
rp.visitHomePage = function (preferences) {
    var parentWindow = window.opener,
        url = "http://www.aircrewrosters.com";

    parentWindow = parentWindow.opener ? parentWindow.opener : parentWindow;

    // If a parent window was found
    if(parentWindow) {
        // If the open in windows preference is set to true
        if(preferences.openAsTab === true) {
            var newTab = parentWindow.getBrowser().addTab(url);

            // If the open tabs in background preference is not set or is set to false
            if(preferences.openTabsInBackground === false) {
                parentWindow.getBrowser().selectedTab = newTab;
            }
        }
        else {
            parentWindow.open(url);
        }
        window.close();
    }
}