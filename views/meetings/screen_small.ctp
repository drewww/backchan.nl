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
$scriptContent = "";

// This bit provides the info necessary for javascript to generate the posts on firstrun,
// without waiting for an HTTP request to get the data.
$scriptContent .= $javascript->object(
	array("Post"=>$posts),
	array("prefix"=>"var initialPosts=",
	"postfix"=>";\n")
	);

// This magic "inline"=false bit is a queue for cake to put the scripts
// into the header where they belong. Yay.
$javascript->codeBlock($scriptContent, array("inline"=>false));

?>
<?php
	echo $html->css(
		'yui/build/datatable/assets/skins/sam/datatable.css',
		null,
		array(),
		false
	);

	echo $html->css(
		array( 'backchannl.generic.css', 'top.posts.small.css'),
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
			'yui/build/datatable/datatable-beta-min.js'
		),
		false
	);
echo $javascript->link(array("top_posts","voting","datatable", "meetings_screen"), 
	false  // not inline, but $scripts_for_layout in layout
);
	
	
	
?>

<!-- Ugh, this is a bad hack. Copying it in only because it's the way view.ctp does it, so it's too much of a hassle to change. But this isn't how it should be. TODO Fix. -->
<input type="hidden" id="PostMeetingId"
	name="data[Post][meeting_id]"
	value="<?php echo $meeting['Meeting']['id']; ?>" />

<img class="label" src="/img/top_posts.png"/>
<div id="TopPosts" class="screen">
</div>