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
 * Post Vote
 ******************************************************************************/
 
 // Used for keeping track of created button objects so we can clean them up
 // when we regenerate new ones. This helps us avoid leaking memory.
 var buttons = [];
 
function initAddPostVote() {
	// Vote Up buttons
	var voteUpButtons =
		YAHOO.util.Dom.getElementsByClassName("vote-up", "input", null);
	for (var i = 0, len = voteUpButtons.length; i < len; i++) {
		var bVoteUp = new YAHOO.widget.Button(voteUpButtons[i],
			{
				onclick: {
					fn: function (mouseEvent, postId) {
						addPostVote(postId, 1);
					},
					obj: voteUpButtons[i].id.replace("VoteUp-", "")
				}
			}
		);
		bVoteUp.addClass("vote-up");
	}
	// Vote Dn buttons
	var voteDnButtons =
		YAHOO.util.Dom.getElementsByClassName("vote-dn", "input", null);
	for (var i = 0, len = voteDnButtons.length; i < len; i++) {
		var bVoteDn = new YAHOO.widget.Button(voteDnButtons[i],
			{
				onclick: {
					fn: function (mouseEvent, postId) {
						addPostVote(postId, -1);
					},
					obj: voteDnButtons[i].id.replace("VoteDn-", "")
				}
			}
		);
		bVoteDn.addClass("vote-dn");
	}
}

// This is a minor change to the initAddPostVote method. I think initAddPostVote is still 
// getting used, but is going to get pulled out soon. Until then, though, I think it makes
// sense to have a separate function. This one adds buttons to the top posts up/down
// vote buttons. 
function addTopPostVoteButtons() {
	var voteContainers = YAHOO.util.Dom.getElementsByClassName("voting");
	
    // Infrastructure for avoiding memory leaks with button objects.
    // We keep track of them in buttons, and then destroy all the objects
    // from the previous cycle.
	for (var index in buttons) {
	    var button = buttons[index];
	    button.destroy();
	}
	
	buttons = [];
	
	for (var i=0; i < voteContainers.length; i++)
	{
		// For each vote container get the button in question.
		var eVoteUp = YAHOO.util.Dom.getElementsByClassName("vote-up", "span", voteContainers[i]);
		var eVoteDown = YAHOO.util.Dom.getElementsByClassName("vote-dn", "span", voteContainers[i]);
		
		// There should only be one item in each of these.
		var bVoteUp = new YAHOO.widget.Button(eVoteUp[0],
			{
				onclick: {
					fn: function (mouseEvent, postId) {
						addPostVote(postId, 1);
					},
					obj: eVoteUp[0].id.replace("VoteUp-", "")
				}
			});
		bVoteUp.addClass("vote-up");
			
		var bVoteDown = new YAHOO.widget.Button(eVoteDown[0],
			{
				onclick: {
					fn: function (mouseEvent, postId) {
						addPostVote(postId, -1);
					},
					obj: eVoteDown[0].id.replace("VoteDown-", "")
				}
			});
		bVoteDown.addClass("vote-dn");
		
		buttons.push(bVoteUp);
		buttons.push(bVoteDown);
		
		if(showAdmin)
		{
			var eAnswered = YAHOO.util.Dom.getElementsByClassName("answered", "span", voteContainers[i]);
			var eDelete = YAHOO.util.Dom.getElementsByClassName("delete", "span", voteContainers[i]);
			
			var bAnswered = new YAHOO.widget.Button(eAnswered[0],
				{
					onclick: {
						fn: function (mouseEvent, postId) {
							setAnswered(postId);
						},
						obj: eAnswered[0].id.replace("Answered-", "")
					}
				});
			bAnswered.addClass("answered");
			
			var bDelete = new YAHOO.widget.Button(eDelete[0],
				{
					onclick: {
						fn: function (mouseEvent, postId) {
							setDelete(postId);
						},
						obj: eDelete[0].id.replace("Delete-", "")
					}
				});
			bDelete.addClass("delete");
		}
	}
	
}

function addPostVote(postId, value) {
	// document.getElementById("results").innerHTML =
	// 	"<img src='./images/wait.gif' alt='Searching...' />";
	// document.getElementById("stats").innerHTML =
	// 	"Searching ...";

	// var form = document.getElementById("PostVoteAddForm-" + postId);
	// YAHOO.util.Connect.setForm(form);
	var request = YAHOO.util.Connect.asyncRequest("POST",
		"/post_votes/add",
		{
			success: function (o) {
				// Can have server send back this post's info including positive
				// and negative votes and use that info to update its votes.
				// I don't do it because the posts and related info on the page
				// automatically get updated periodically anyway, plus I want
				// the user who click on a vote button to immediately get the
				// result reflecting his specific action, so if succeeds, only
				// add that one vote at the corresponding place, and if fails,
				// alert the user.
				var r = eval("(" + o.responseText + ")");
				if (r.PostVote.value) {
					refreshMeeting();
					setAlertMessage("");
					// refresh();  // TODO: reset setInterval(...)
				}
				else if (r.PostVote.message)
					setAlertMessage(r.PostVote.message);
			},
			failure: function (o) {
				setAlertMessage("Submission failed: " + o.status);
				// var results = document.getElementById("results");
				// results.innerHTML = "<b>" + o.argument.failmsg + "</b><br />";
			},
			argument: { failmsg: "Search has failed." },
			timeout: 4000
		},
		"data[PostVote][post_id]=" + postId + "&" +
		"data[PostVote][value]=" + value  // POST body
	);
}

function doEdit(postId)
{

	var cell = YAHOO.util.Dom.getAncestorByTagName("Edit_"+postId, "td");
	var currentPost = YAHOO.util.Dom.getFirstChild(cell).innerHTML;

	if (cell.innerHTML.indexOf("textarea") == -1) {
		var textarea = '<textarea id="EditInput_'+postId+'">'+currentPost+'</textarea>';
		YAHOO.util.Dom.getFirstChild(YAHOO.util.Dom.get(cell)).innerHTML = textarea;
		YAHOO.util.Dom.addClass(cell, "editmode");
		document.getElementById("EditInput_"+postId).focus();
		setRefreshSecs(120);
	} else {
		var newPost = document.getElementById("EditInput_"+postId).value;
		YAHOO.util.Dom.removeClass(cell, "editmode");
		sendEdit(postId,newPost);
	}

}

function sendEdit(postId,newPost) {
	
	setRefreshSecs(1200); // Temporarily deactivate refreshing of the datatable
	
	// alert("Data to save:\n"+newPost);

	var request = YAHOO.util.Connect.asyncRequest("POST",
		"/post_events/edit",
		{
			success: function (o) {
				// alert(o.responseText)
				var r = eval("(" + o.responseText + ")");
				if (r.result) {
					refreshMeeting();
				}
				// else if (r.PostVote.message)
				// 	document.getElementById("alert").innerHTML =
				// 		r.PostVote.message;
				setRefreshSecs(15);
			},
			failure: function (o) {
				document.getElementById("alert").innerHTML =
					"Editing failed: " + o.status;
			},
			argument: { failmsg: "Search has failed." },
			timeout: 4000
		},
		"data[PostEvent][post_id]=" + postId + "&" +
		"data[PostEvent][new_post_content]=" + newPost + "&" +
		"data[PostEvent][event_type]=edit"
	);
	
	var cell = YAHOO.util.Dom.getAncestorByTagName("Edit_"+postId, "td");
	YAHOO.util.Dom.getFirstChild(YAHOO.util.Dom.get(cell)).innerHTML = newPost;
	
}

function setAnswered(postId)
{
	var request = YAHOO.util.Connect.asyncRequest("POST",
		"/post_events/add",
		{
			success: function (o) {
				var r = eval("(" + o.responseText + ")");
				if (r.result) {
					refreshMeeting();
				}
				// else if (r.PostVote.message)
				// 	document.getElementById("alert").innerHTML =
				// 		r.PostVote.message;
			},
			failure: function (o) {
				setAlertMessage("Submission failed: " + o.status);
				// var results = document.getElementById("results");
				// results.innerHTML = "<b>" + o.argument.failmsg + "</b><br />";
			},
			argument: { failmsg: "Search has failed." },
			timeout: 4000
		},
		"data[PostEvent][post_id]=" + postId + "&" +
		"data[PostEvent][event_type]=demote"
	);
}


function setDelete(postId)
{
	var request = YAHOO.util.Connect.asyncRequest("POST",
		"/post_events/add",
		{
			success: function (o) {
				var r = eval("(" + o.responseText + ")");
				if (r.result) {
					refreshMeeting();
				}
				// else if (r.PostVote.message)
				// 	document.getElementById("alert").innerHTML =
				// 		r.PostVote.message;
			},
			failure: function (o) {
				document.getElementById("alert").innerHTML =
					"Submission failed: " + o.status;
				// var results = document.getElementById("results");
				// results.innerHTML = "<b>" + o.argument.failmsg + "</b><br />";
			},
			argument: { failmsg: "Search has failed." },
			timeout: 4000
		},
		"data[PostEvent][post_id]=" + postId + "&" +
		"data[PostEvent][event_type]=delete"
	);
}
