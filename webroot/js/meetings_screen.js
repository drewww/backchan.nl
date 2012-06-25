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
 * Constants
 ******************************************************************************/

var NUM_TOP_POSTS_TO_SHOW = 8;

var showAdmin = false;


YAHOO.util.Event.onDOMReady(init);

function init()
{
	
	generateTopPosts({"results":initialPosts['Post']});

	meetingId = document.getElementById("PostMeetingId").value;
	
	var dsourcePosts = initDataSource();
	dsourcePosts.setInterval(1000 * 15, meetingId + "?stupidienocache=" + Math.random(),
		{
			success: refreshSuccessScreen,
		}
	);
	
	header = document.getElementById("header");
	baseURL = conferenceUsername + ".backchan.nl";
	header.innerHTML = "<h2><a href='http://" + baseURL +"'>participate at http://" + baseURL + "</a></h2>";
	
}

function refreshSuccessScreen(o, response)
{
	refreshTopPosts(response);
}
