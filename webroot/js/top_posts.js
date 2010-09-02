/**
  * backchan.nl
  * 
  * Copyright (c) 2006-2009, backchan.nl contributors. All Rights Reserved
  * 
  * The contents of this file are subject to the BSD License; you may not
  * use this file except in compliance with the License. A copy of the License
  * is available in the root directory of the project.
  */

// Comparator function for sorting posts based on their score.
function sortPosts(a, b)
{
	// This issue is described in more detail in generateTopPosts. It has to do with object hierarchy
	// differences between datasource versions and controller versions.
    if(!('Post.score' in a))
		a['Post.score'] = a['Post']['score'];
		
    if(!('Post.score' in b))
		b['Post.score'] = b['Post']['score'];

	return a['Post.score'] - b['Post.score'];
}

// Given a JSON result set from the server, generates the HTML for the top
// posts and inserts it into the DOM, replacing the old one. 
function generateTopPosts(response)
{
	
	var results = response.results;

	if(results.length==0)
	{
			newHTML = "<div id='EmptyPosts'>No posts yet. Why don't you submit one?</div>";
			document.getElementById("TopPosts").innerHTML = newHTML;		
	}
	else if(results[0])
	{
		
		// first we need to sort the list so it's actually a "top" listing, because
		// they come in being sorted by time.
		results.sort(sortPosts);
		results.reverse();
		
		var newHTML = "";
		
		var numPosts;
		
		if(results.length > NUM_TOP_POSTS_TO_SHOW)
			numPosts = NUM_TOP_POSTS_TO_SHOW;
		else
			numPosts = results.length;
		
		
		// If there's no posts, put up a message that says that nothing has been posted yet.
		// This also serves to space out the TopPosts and Recent Posts sections so the images
		// don't overlap in an ugly way.
		
				
		for(var i=0; i< numPosts; i++)
		{
			// For each set, generate a bunch of HTML.
			var post = results[i];
			var postHTML = "";
			
			if(!post['Post.id'])
			{
				// convert over all the pieces of information we need to the other format.
				// The core issue here is that when the data comes in from the datasource, it's
				// of the form post['Post.id'], etc. But when it comes in direct from the controller,
				// it's of the form post['Post']['id']. I'm not sure why this is, but this seems to
				// be a reasonable way to fix it.
				post['Post.id'] = post['Post']['id'];
				post['Post.pos_votes'] = post['Post']['pos_votes'];
				post['Post.neg_votes'] = post['Post']['neg_votes'];
				post['Post.body'] = post['Post']['body'];
				post['User.name'] = post['User']['name'];
				post['User.affiliation'] = post['User']['affiliation'];
				post['Post.age'] = post['Post']['age'];
				
			}
			
			// TODO Convert this over to DOM scripting. Will make button addition
			// more graceful, as well as being a little less rigid.
			
			// This is going to need some IDs for scriptability.
			postHTML += "<div class='post-container'>";
			postHTML += "<div class='voting'>";
			postHTML += '<span id="VoteUp-' + post['Post.id'] + '" class="yui-button vote-up"><span class="first-child"><button type="button">'+ post['Post.pos_votes']+'</button></span></span>';
			postHTML += '<span id="VoteDown-' + post['Post.id'] + '" class="yui-button vote-dn"><span class="first-child"><button type="button">'+ post['Post.neg_votes']+'</button></span></span>';
			
			if(showAdmin)
			{
				postHTML += '<span id="Answered-' + post['Post.id'] + '" class="yui-button answered"><span class="first-child"><button type="button"></button></span></span>';
				postHTML += '<span id="Delete-' + post['Post.id'] + '" class="yui-button delete"><span class="first-child"><button type="button"></button></span></span>';
			}
			else
			{
				// Was having troubles getting this to go behind the moderation buttons when they're shown.
				// Now, just don't print it if we're in admin mode.
				postHTML += '<div class="rank">' + (i+1) + "</div>";
			}
			
			postHTML += '</div>';
			
			postHTML += '<div class="post">';
			postHTML += '<div class="content">';
			postHTML += post['Post.body'];
			postHTML += "</div>";
			
			postHTML += '<div class="footer">';
			postHTML += '<div class="attribution">';
			postHTML += '<span class="name">' + post['User.name'] + '</span> ';
			postHTML += '<span class="affiliation">' + post['User.affiliation'] + '</span>';
			postHTML += '</div>';
			postHTML += "<div class='age'>posted "+ post['Post.age']+" ago</div>";
			postHTML += "</div></div></div></div>";
			
			
			newHTML += postHTML;
		}
		
		document.getElementById("TopPosts").innerHTML = newHTML;
		
		addTopPostVoteButtons();
	}
}

function refreshTopPosts(response)
{
	// Now generate the top N list.
	generateTopPosts(response);
	
}