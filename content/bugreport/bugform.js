/**************************************************************
This code is copyright of Jon Lidgard (jonlidgard@gmail.com).
Please do not copy, modify, or distribute without prior consent.

Version 0.1.25, April 20th, 2008.
***************************************************************/


// Initialise dialog
function rosterprocessor_onInitBugForm()
{
var params = window.arguments[0];
//dump("Init params in:"+params.in.email+"\nInit params out:"+params.out+"\n");
var firstShow = false; //(params.in.desc == rosterprocessor.strings.getString("rosterprocessor_bugFormEdit"));
document.getElementById("rosterprocessor-bugform-editor").clickSelectsAll = firstShow ? "true" : "";

//document.getElementById("rosterprocessor-bugform-ticketNo").setAttribute("value","Ticket No:#00001");
document.getElementById("rosterprocessor-bugform-roster").setAttribute("value",params.in.roster.text.all);
document.getElementById("rosterprocessor-bugform-editor").setAttribute("value",params.in.desc);
//document.getElementById("rosterprocessor-bugform-email").setAttribute("value",params.in.email);
document.getElementById("rosterprocessor-bugform-editor").focus();
/*
var iframe = document.getElementById("rosterprocessor-bugform-iframe");
var newNode = document.importNode(rp_getContentDocument().body,true);
iframe.appendChild(newNode);
//iframe.normalize();

//var oldNode = iframe.contentDocument.getElementById("myNode");
//var newNode = document.importNode(oldNode,true);
//document.getElementById("container").appendChild(newNode);
*/
}

//--------------------------------------------------------------------------------------------------
// Send
function rosterprocessor_onSendBugReportClick()
{
    window.arguments[0].out = {desc:document.getElementById("rosterprocessor-bugform-editor").value};
    return true;
}

//--------------------------------------------------------------------------------------------------
function rosterprocessor_onClearBugFormClick()
{
    document.getElementById("rosterprocessor-bugform-editor").clickSelectsAll = "";
    document.getElementById("rosterprocessor-bugform-editor").value = "";
    document.getElementById("rosterprocessor-bugform-editor").focus();
} 