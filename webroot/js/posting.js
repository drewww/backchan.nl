/**
  * backchan.nl
  * 
  * Copyright (c) 2006-2009, backchan.nl contributors. All Rights Reserved
  * 
  * The contents of this file are subject to the BSD License; you may not
  * use this file except in compliance with the License. A copy of the License
  * is available in the root directory of the project.
  */

/******************************************************************************
 * Post
 ******************************************************************************/
function initAddPost() {
	updatePostCharCount();
	var bSubmitPost = new YAHOO.widget.Button("SubmitPost",
		{ onclick: { fn: function () { addPost(); } } }
	);
}

function addPost() {
	var body = YAHOO.util.Dom.get("PostBody").value;  // <textarea> has value!?
	if (body.length > 255)
		setAlertMessage("Cannot submit post longer than 255 characters!");
	else if (body == "")
		setAlertMessage("Cannot submit empty post!");
	else {
		setAlertMessage("");
		
		var form = document.getElementById("PostAddForm");
		YAHOO.util.Connect.setForm(form);
		var request = YAHOO.util.Connect.asyncRequest("POST",
			"/posts/add",
			{
				success: function (o) {
					var r = eval("(" + o.responseText + ")");
					if (r.Post.body) {
						refreshMeeting();
						// refresh();  // TODO: reset setInterval(...)						
						if(typeof(isAdmissionsInterface) != "undefined" && isAdmissionsInterface == true)
							document.getElementById("PostBody").value = "";
					}
					else if (r.Post.message)
						setAlertMessage(r.Post.message);
				},
				failure: function (o) {
					setAlertMessage("Submission failed: " + o.status);
				},
				timeout: 5000
			}
		);
	}
}

function updatePostCharCount() {
	var postBody = document.getElementById("PostBody");
	// TODO: Why convert? What about parseInt()?
	var charsLeft = 235 - Number(postBody.value.length);
	var charCount = document.getElementById("CharCount");
	charCount.innerHTML = charsLeft;
	// set class of char count
	if (charsLeft >= 0) {
		YAHOO.util.Dom.removeClass(charCount, "char-count-bad");
		YAHOO.util.Dom.addClass(charCount, "char-count-good");
		// submitItemButton.set("disabled", false);  // TODO: disable's
	}
	else {
		YAHOO.util.Dom.removeClass(charCount, "char-count-good");
		YAHOO.util.Dom.addClass(charCount, "char-count-bad");
		// submitItemButton.set("disabled", true);
	}
}

