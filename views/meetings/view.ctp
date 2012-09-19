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

// Mobile version redirect
if(stripos($_SERVER['HTTP_USER_AGENT'],"iPhone") != null || 
	stripos($_SERVER['HTTP_USER_AGENT'],"iPod") != null || 
	stripos($_SERVER['HTTP_USER_AGENT'],"Android") != null || 
	stripos($_SERVER['HTTP_USER_AGENT'],"SymbianOS") != null) {
		$uri = '/conferences/mobile/'.$meeting['Conference']['id'];
		header("location: ".$uri);
}

$scriptContent = "";

// This bit provides the info necessary for javascript to generate the posts on firstrun,
// without waiting for an HTTP request to get the data.
$scriptContent .= $javascript->object(
	array("Post"=>$posts),
	array("prefix"=>"var initialPosts=",
	"postfix"=>";\n")
	);
$scriptContent .= "var showAdmin=" . $adminInterface . ";\n";

$scriptContent .= "var conferenceUsername=\"". $meeting['Conference']['username'] . "\";\n";

$anonymous = false;
$scriptContent .= "var anonymous = false;\n";

if ($user == false) {
	
	if($anonymous) {
		// if there's no user and we're supposed to be anon, then we need
		// to auto-generate an anon identity.
		// we'll do this by populating the addUser dialog and forcibly
		// submitting it.
		$scriptContent .= "var newAnonIdent = true;\n";
		$scriptContent .= "var showIdentityDialog=false;\n";
	} else {
		$scriptContent .= "var newAnonIdent = false;\n";
		$scriptContent .= "var showIdentityDialog=true;\n";
	}
} else {
	$scriptContent .= "var newAnonIdent = false;\n";
	$scriptContent .= "var showIdentityDialog=false;\n";
}

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
	echo $javascript->link(array("identity", "posting", "datatable", "top_posts","voting", "util", 'meetings_view'), 
		false  // not inline, but $scripts_for_layout in layout
	);
	
	
	
?>

<?php
/**
 * /meetings/view
 * variables passed from controller: ($user,) $meeting, $posts
 */
?>

<div id="MeetingHeader">
<h1><?php echo $meeting['Conference']['name']; ?></h1>
<h2><?php echo $meeting['Meeting']['name'] . " (" . strftime("%R", strtotime($meeting['Meeting']['start'])) . " — " . strftime("%R",strtotime($meeting['Meeting']['end'])) . ")"; ?></h2>

Welcome to backchan.nl! This tool is a way for people in the audience to <strong>post responses to the panel live</strong>, and in a <strong>publicly visible</strong> venue. These responses can be <strong>questions</strong>, <strong>comments</strong>, <strong>links to related resources</strong>, or whatever else you think other people might be interested in.

Even if you don't have anything to say, you can <strong>vote posts up or down</strong> that you think are useful or problematic. Highly ranked and comments will get brought up during the discussion section of the panel.
</div>
<br />


<div id="UserBox">

	<div id="UserInfoHeader">
		<div id="UserInfo">
		<span id="UserInfoName">
			<?php
			if ($user != null)
				print $user['User']['name'];
			?>
		</span><br />
		<span id="UserInfoAffiliation">
			<?php
			if ($user != null)
				print $user['User']['affiliation'];
			?>
		</span>
		</div>
		<div id="UserButtons">
		<input type="button" id="AdminPassword" value="" />
		<input type="button" id="EditUser" value="Edit User" />
		</div>
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
		<form id="PostAddForm">
			<!-- onkeyup for cut or copy&paste, onkeypress for hold key down -->
			<textarea id="PostBody" name="data[Post][body]"
				onkeyup="updatePostCharCount();"
				onkeypress="updatePostCharCount();"></textarea>
			characters left: <span id="CharCount" class="char-count-good"></span>
			<input type="hidden" id="PostMeetingId"
				name="data[Post][meeting_id]"
				value="<?php echo $meeting['Meeting']['id']; ?>" />
			<input type="button" id="SubmitPost"
				name="SubmitPost" value="Submit Post" />
		</form>
	</div>

</div>
<br class="clear"/>

<div id="alert" class="empty"></div>

<br class="clear"/>
<div class="hr"></div>
<img class="label" src="/img/top_posts.png"/>
<div id="TopPosts">
</div>

<br class="clear"/>
<div class="hr"></div>
<img class="label" src="/img/recent_posts.png"/>
<div id="DataTable">
</div>
<br class="clear"/>
