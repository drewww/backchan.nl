/**
  * backchan.nl
  * 
  * Copyright (c) 2006-2009, backchan.nl contributors. All Rights Reserved
  * 
  * The contents of this file are subject to the BSD License; you may not
  * use this file except in compliance with the License. A copy of the License
  * is available in the root directory of the project.
  */

function setAlertMessage(message)
{
	var alertDiv = document.getElementById("alert");
	
	alertDiv.innerHTML = message;
	
	// Now if the message is empty, we want to remove the coloring by setting its class to alert-empty, otherwise
	// set its class to alert.
	if(message=="")
	{
		YAHOO.util.Dom.removeClass(alertDiv, "alert");
		YAHOO.util.Dom.addClass(alertDiv, "empty");
	}
	else
	{
		YAHOO.util.Dom.removeClass(alertDiv, "empty");
		YAHOO.util.Dom.addClass(alertDiv, "alert");
	}
}