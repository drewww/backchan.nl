<?php
/**
  * backchan.nl
  * 
  * Copyright (c) 2006-2009, backchan.nl contributors. All Rights Reserved
  * 
  * The contents of this file are subject to the BSD License; you may not
  * use this file except in compliance with the License. A copy of the License
  * is available in the root directory of the project.
  */
?>
<?php

// First and foremost, it should be noted that this page is designed especially
// for MIT Admissions, and is not useful in other applications

$scriptContent = "";

// This bit provides the info necessary for javascript to generate the posts on firstrun,
// without waiting for an HTTP request to get the data.
$scriptContent .= $javascript->object(
	array("Post"=>$posts),
	array("prefix"=>"var initialPosts=",
	"postfix"=>";\n")
	);
$scriptContent .= "var showAdmin=" . $adminInterface . ";\n";

if ($user == false) $scriptContent .= "var showIdentityDialog=true;\n";
else 				 $scriptContent .= "var showIdentityDialog=false;\n";

$scriptContent .= "var isAdmissionsInterface = true;\n";
// This variable sets up identity.js to move the post submitting into a dialog

// This magic "inline"=false bit is a queue for cake to put the scripts
// into the header where they belong. Yay.
$javascript->codeBlock($scriptContent, array("inline"=>false));

?>
<!-- TODO: for production, delete following hidden div -->
<div style="visibility:hidden; position:absolute; left:-1000px;">
<?php
	// echo '$$$user:'; print_r($user);
	// echo '$$$meeting:'; print_r($meeting);
	// echo '$$$posts:'; print_r($posts);
?>
</div>


<?php
	echo $html->css(
		'yui/build/datatable/assets/skins/sam/datatable.css',
		null,
		array(),
		false
	);

	echo $html->css(
		array( 'backchannl.generic.css', 'top.posts.css'),
		null,
		array(),
		false
	);

	echo $javascript->link(
		array(
			'yui/build/datasource/datasource-beta-min.js',
			'yui/build/json/json-min.js',
			'yui/build/dragdrop/dragdrop-min.js',
			'yui/build/calendar/calendar-min.js',
			'yui/build/datatable/datatable-beta.js'
		),
		false
	);
	echo $javascript->link(array("identity", "posting", "datatable", "top_posts","voting", "util", 'meetings_view', 'ipsos'), 
		false  // not inline, but $scripts_for_layout in layout
	);
	
	
	
?>

<?php
/**
 * /meetings/admissions
 * variables passed from controller: ($user,) $meeting, $posts
 */
?>

<div id="AdmissionsVideo">

<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" width="400" height="320" id="utv343051"><param name="flashvars" value="autoplay=false&amp;brand=embed&amp;cid=10921478&amp;v3=1"/><param name="allowfullscreen" value="true"/><param name="allowscriptaccess" value="always"/><param name="movie" value="http://www.ustream.tv/flash/viewer.swf"/><embed flashvars="autoplay=false&amp;brand=embed&amp;cid=10921478&amp;v3=1" width="400" height="320" allowfullscreen="true" allowscriptaccess="always" id="utv343051" name="utv_n_447371" src="http://www.ustream.tv/flash/viewer.swf" type="application/x-shockwave-flash" /></object>

</div>

<div id="AdmissionsChat">
<script async class="speakerdeck-embed" data-id="4f5fe3ad59a3e7001f0035b7" data-ratio="1.3333333333333333" src="//speakerdeck.com/assets/embed.js"></script>
</div>

<div id="agenda">
<table class='meeting-day'><tr class='meeting'><td class='duration'><a class='meeting' href='/meetings/view/1832'>4:00pm—5:00pm</a></td><td class='name'><a class='meeting' href='/meetings/view/1832'>Dry Run</a></td></tr></a>
</table><h2 class='meeting-day'>Thu, May 10</h2><table class='meeting-day'><tr class='meeting'><td class='duration'><a class='meeting' href='/meetings/view/1865'>1:00pm—1:30pm</a></td><td class='name'><a class='meeting' href='/meetings/view/1865'>Mapping the Afternoon</a></td></tr></a>
<tr class='meeting'><td class='duration'><a class='meeting' href='/meetings/view/1866'>1:30pm—2:15pm</a></td><td class='name'><a class='meeting' href='/meetings/view/1866'>Voyage Of A Start-Up: Integrating the Voice of the Customer to Navigate Success</a></td></tr></a>
<tr class='meeting'><td class='duration'><a class='meeting' href='/meetings/view/1867'>3:00pm—3:30pm</a></td><td class='name'><a class='meeting' href='/meetings/view/1867'>Customer Satisfaction Is Not Just Listening To The Customer, It Is Hearing What They Say</a></td></tr></a>
<tr class='meeting'><td class='duration'><a class='meeting' href='/meetings/view/1868'>3:30pm—4:00pm</a></td><td class='name'><a class='meeting' href='/meetings/view/1868'>Getting To The 'Why' Along the Consumer Decision Journey</a></td></tr></a>
<tr class='meeting'><td class='duration'><a class='meeting' href='/meetings/view/1869'>4:00pm—4:30pm</a></td><td class='name'><a class='meeting' href='/meetings/view/1869'>The Triangulation Journey: Aligning Reputation Levers, Issues Impact and Message Fit</a></td></tr></a>
<tr class='meeting'><td class='duration'><a class='meeting' href='/meetings/view/1870'>4:30pm—5:00pm</a></td><td class='name'><a class='meeting' href='/meetings/view/1870'>Final Thoughts & Closing Remarks</a></td></tr></a>		
</table>
</div>

<br class="clear"/>

<div id="AdmissionsUserBar">
	
	<h1>Your questions, powered by <a href="http://backchan.nl/">backchan.nl</a></h1>
	
	<div id="UserButtons">
		<input type="button" id="AdminPassword" value="" />
		<input type="button" id="EditUser" value="Edit your name" />
		<input type="button" id="CreatePost" value="Post a question" />
	</div>
	
	<div id="EnterUser">
		<div class="hd">Who are you?</div>
		<div class="bd">
			<form id="UserAddForm" method="POST" action="/users/add">
				<table>
				<tr>
					<td><label for="name">Name:</label></td>
					<td>
						<input type="text" id="UserName"
							name="data[User][name]" value=""
							maxlength="28" size="20" />
					</td>
				</tr>
				<tr>
					<td><label for="affiliation">Affiliation:</label></td>
					<td>
						<input type="text" id="UserAffiliation"
							name="data[User][affiliation]" value=""
							maxlength="48" size="20" />
					</td>
				</tr>
				</table>
			</form>
		</div>
	</div>

	<div id="AdminUser">
		<div class="hd">Conference Administration Password</div>
		<div class="bd">
			<form id="AdminUserForm" method="POST" action="/conferences/admin/<?php echo $meeting['Conference']['id'];?>">
				<table>
				<tr>
					<td><label for="conference">Conference:</label></td>
					<td>
						<?php echo $meeting['Conference']['name']; ?>
					</td>
				</tr>
				<tr>
					<td><label for="AdminPassword">Password:</label></td>
					<td>
						<input type="password" id="AdminPassword"
							name="data[adminPassword]" value=""
							maxlength="48" size="20" />
					</td>
				</tr>
				</table>
			</form>
		</div>
	</div>

	<div id="EnterPost">
		<div class="hd">Post a question</div>
		<div class="bd">
		<form id="PostAddForm">
			<!-- onkeyup for cut or copy&paste, onkeypress for hold key down -->
			<textarea id="PostBody" name="data[Post][body]"
				onkeyup="updatePostCharCount();"
				onkeypress="updatePostCharCount();"></textarea>
			characters left: <span id="CharCount" class="char-count-good"></span>
			<input type="hidden" id="PostMeetingId"
				name="data[Post][meeting_id]"
				value="<?php echo $meeting['Meeting']['id']; ?>" />
		</form>
		</div>
	</div>

	<div id="SetLocation">
	     <div class="hd">Set your location</div>
	     <div class="bd">
		  <br class="clear">
	     </div>
	</div>

</div>

<div id="AdmissionsUserInfo">Welcome, 
	<span id="UserInfoName">
		<?php
		if ($user != null)
			print $user['User']['name'];
		else print 'post questions and join in with other students';
		?>
	</span> from 
	<span id="UserInfoAffiliation">
		<?php
		if ($user != null)
			print $user['User']['affiliation'];
		else print 'around the world!';
		?>
	</span>
</div>

<div id="alert" class="empty"></div>

<br class="clear"/>
<img class="label" src="/img/top_posts.png"/>
<div id="TopPosts">
</div>

<br class="clear"/>
<div class="hr"></div>
<img class="label" src="/img/recent_posts.png"/>
<div id="DataTable">
</div>
<br class="clear"/>
