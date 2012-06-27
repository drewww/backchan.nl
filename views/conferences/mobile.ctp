<?php
/**
  * backchan.nl
  * 
  * Copyright (c) 2006-2010, backchan.nl contributors. All Rights Reserved
  * 
  * The contents of this file are subject to the BSD License; you may not
  * use this file except in compliance with the License. A copy of the License
  * is available in the root directory of the project.
  */
?>

<?php
/**
 * /conferences/mobile
 * 
 */

$scriptObject = $javascript->object(
	$conferenceName,
	array("prefix"=>"var conferenceName=",
	"postfix"=>";\n")
	);

$javascript->codeBlock($scriptObject, array("inline"=>false));

$javascript->codeBlock($javascript->object($anonymous, array("prefix"=>"var anonymous=", "postfix"=>";\n")), array("inline"=>false));

?>

<div id="meetingsData"><dl id="meetings">
<?php
	
foreach($meetings as &$meeting) {

	$meeting = $meeting['Meeting'];

	$formattedDate = date("D, F d", strtotime($meeting['start']));
	
	// if (time() < strtotime($meeting['end'])) {
	
	// if(strtotime($meeting['start']) < time() && time() < strtotime($meeting['end']))
	// 	$meetingClass = ' class="current"';
	
	if($formattedDate != $previousFormattedDate)
	{
		echo "<dt><div></div><span>" . date("D, F j", strtotime($meeting['start'])) . "</span></dt>"; // Output the date.
	}
	
	$previousFormattedDate = $formattedDate;

	echo '<dd id="mtg'.$meeting['id'].'" '. $meetingClass . '><a href="#' . $meeting['id'] . '"><strong>' . $meeting['name'] . '</strong>';
	echo ' <span class="date">' . date("g:ia", strtotime($meeting['start'])) . "&ndash;" . date("g:ia", strtotime($meeting['end'])) . "</span>";
	echo '</a>'."</dd>";
	
	// }

}

?>
</dl></div>