/**
  * backchan.nl
  * 
  * Copyright (c) 2006-2010, backchan.nl contributors. All Rights Reserved
  * 
  * The contents of this file are subject to the BSD License; you may not
  * use this file except in compliance with the License. A copy of the License
  * is available in the root directory of the project.
  */

/******************************************************************************
 * Constants
 ******************************************************************************/

var NUM_TOP_POSTS_TO_SHOW = 8;

/******************************************************************************
 * Init
 ******************************************************************************/

YAHOO.util.Event.onDOMReady(init);

function init() {
	// User Add
	initAddUser();
	// Post Add
	initAddPost();
	// Post Vote Add
	initAddPostVote();
	// Admin dialog
	initAdminDialog();
	
	generateTopPosts({"results":initialPosts['Post']});
	
	// Post Table
	initDataTable();
}

function refreshMeeting() {    

	// TODO: refreshing messes up user sorting
    dsourcePosts.sendRequest(meetingId + "?stupidienocache=" + Math.random(),
		{
			success: refreshSuccess,
			// silent failure
			scope: dtablePosts
			// timeout: 4000  // TODO: this doesn't seem to work
		}
	);
}

function refreshSuccess(o, response)
{
		refreshTopPosts(response);
		
		// Update the data table.
		
		refreshDataTable(o, response, this);
}

/******************************************************************************
 * Periodic AJAX refresh
 ******************************************************************************/
// function refresh() {
// 	var meetingId = document.getElementById("PostMeetingId").value;
// 	var request = YAHOO.util.Connect.asyncRequest("GET",
// 		"/meetings/refresh" + "/" + meetingId,
// 		{
// 			success: function (o) {
// 				var r = eval("(" + o.responseText + ")");
// 				if (r.Post.message)
// 					document.getElementById("alert").innerHTML =
// 						r.Post.message;
// 				else if (r.Post[0]) {
// 					var t = "";
// 					t += "<tr>";
// 					t += '<th id="PostColumn">Post</th>';
// 					t += '<th id="AuthorColumn">Author</th>';
// 					t += '<th><img alt="Pos Votes" src="/img/arrow_up.png"/></th>';
// 					t += '<th><img alt="Neg Votes" src="/img/arrow_dn.png"/></th>';
// 					t += '<th id="VoteColumn">Actions</th>';
// 					t += "<th>Age</th>";
// 					t += "</tr>";
// 					for (var i = 0, len = r.Post.length; i < len; i++) {
// 						if (i % 2 == 1)
// 							t += '<tr class="altrow">';
// 						else
// 							t += "<tr>";
// 						t += "<td>" + r.Post[i].Post.body + "</td>";
// 						t += "<td>" + '<span class="user-name-in-table">' +
// 						 	r.Post[i].User.name + "</span><br />" +
// 							'<span class="user-affiliation-in-table">' +
// 							r.Post[i].User.affiliation + "</span>" + "</td>";
// 						t += '<td class="number">' +
// 							r.Post[i].Post.pos_votes + "</td>";
// 						t += '<td class="number">' +
// 							r.Post[i].Post.neg_votes + "</td>";
// 						t += "<td>" + '<form id="PostVoteAddForm-' +
// 							r.Post[i].Post.id +
// 							'" method="POST" action="/post_votes/add">' +
// 							'<input type="button" class="vote-up" id="VoteUp-' +
// 							r.Post[i].Post.id + '" name="VoteUp" value="" />' +
// 							'<input type="button" class="vote-dn" id="VoteDn-' +
// 							r.Post[i].Post.id + '" name="VoteDn" value="" />' +
// 							"</form>" + "</td>";
// 						t += '<td class="number">' +
// 							r.Post[i].Post.age + "</td>";
// 						t += "</tr>";
// 					}
// 					YAHOO.util.Dom.get("Posts").innerHTML = t;
// 					initAddPostVote();
// 				}
// 			},
// 			failure: function (o) {
// 				document.getElementById("alert").innerHTML =
// 					"Submission failed: " + o.status;
// 				// var results = document.getElementById("results");
// 				// results.innerHTML = "<b>" + o.argument.failmsg + "</b><br />";
// 			},
// 			timeout: 8000
// 		}
// 	);
// }

/******************************************************************************
 * TOP N Listing
 ******************************************************************************/

// Started down this path and then realized it was a bad idea. 
// var dsourceTopPosts;
// 
// function initTopPosts()
// {
// 	// This sets up the data source object that handles the updating and rendering
// 	// of the top ten.
// 	meetingId = document.getElementById("PostMeetingId").value;
// 	
// 	dsourceTopPosts = new YAHOO.util.DataSource("/meetings/topPosts/");
// 	dsourceTopPosts.responseType = YAHOO.util.DataSource.TYPE_JSON;
// 	dsourceTopPosts.setInterval(1000*15, meetingId, function (o)
// 		{
// 			alert("got top posts response: " + o);
// 		});
// }






// TODO: *** when user haven't id'ed himself and:
//       (1). post empty body, then no request is sent to server
//       (2). vote, then err msg is from server
//       fix it so that both activities are checked on the client side first
//       whether user id cookie is already set


function createCookie(name, value, days) {
	var expires = "";
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		expires = "; expires=" + date.toGMTString();
	}
	document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
	var searchName = name + "=";
	var cookies = document.cookie.split(";");
	for (var i = 0; i < cookies.length; i++) {
		var c = cookies[i];
		while (c.charAt(0) == " ")
			c = c.substring(1, c.length);
		if (c.indexOf(searchName) == 0)
			return c.substring(searchName.length, c.length);
	}
	return null;
}

function deleteCookie(name) {
	createCookie(name, "", -1);
}



function setFormState(disabled) {
	var textArea = document.getElementById("question-field");
	textArea.disabled = disabled;
	submitItemButton.set("disabled", disabled);
	if(disabled ==false)
		textArea.innerHTML = "";
}