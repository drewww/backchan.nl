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
 * /conferences/view
 * variables passed from controller: $conference
 */

// Mobile version redirect
if(stripos($_SERVER['HTTP_USER_AGENT'],"iPhone") != null || 
	stripos($_SERVER['HTTP_USER_AGENT'],"iPod") != null || 
	stripos($_SERVER['HTTP_USER_AGENT'],"Android") != null || 
	stripos($_SERVER['HTTP_USER_AGENT'],"SymbianOS") != null) {
		$uri = str_replace('view','mobile',$_SERVER["REQUEST_URI"]);
		header("location: ".$uri);
}

$script = <<<SCRIPT
YAHOO.util.Event.onDOMReady(init);

function init()
{
	var bEditMeeting = new YAHOO.widget.Button("EditMeeting");
}
SCRIPT;

$javascript->codeBlock($script, array("inline"=>false));
?>
<h1 class="meeting"><?php echo $conferenceName ?></h1>
<br />
	
	<?php
	// Loop through $meetings array and print out meeting info

	   	// Not sure why we only do this if it's a valid conference, but not inclined to mess with the logic right now.
		if($validConference)
		{
			// Changing this to show at all times. If you ARE an admin but haven't logged in, you still want a link to the edit page
			// so you can authenticate. Otherwise, there's no way to see this link other than going to the conference page and authenticating
			// there and then coming back, which sucks.
			print '<a class="edit" id="EditMeeting" href="/conferences/edit/'.$conferenceId.'">Edit Conference</a>';
		}

			$previousFormattedDate = "";
			$first = true;
			
			if(count($meetings)==0)
			{
				echo "<div id='EmptyPosts'>No meetings in this conference, yet. Why don't you <a href='/conferences/edit/".$conferenceId."'>add one</a>?</div>";
			}
			
			foreach ($meetings as $meeting)
			{
				$meeting = $meeting['Meeting'];
				// First, check and see if this is a new day we're on. If it is, make a new
				// day header. 
				$formattedDate = date("D, F j", strtotime($meeting['start']));
				
				if(strtotime($meeting['start']) < time() && time() < strtotime($meeting['end']))
					$meetingClass = "meeting current";
				else
					$meetingClass = "meeting";
				
				if($formattedDate != $previousFormattedDate)
				{
					if(!$first)
						echo "</table>";
					
					echo "<h2 class='meeting-day'>" . date("D, F j", strtotime($meeting['start'])) . "</h2>"; // Output the date.
					echo "<table class='meeting-day'>";
					
				}
		
				$previousFormattedDate = $formattedDate;
				$first = false;
		
				// echo "<a class='meeting' href='/meetings/view/" . $meeting['id'] . "'>";
				echo "<tr class='".$meetingClass."'>";
				echo "<td class='duration'>" . "<a class='meeting' href='/meetings/view/" . $meeting['id'] . "'>" . date("g:ia", strtotime($meeting['start'])) . "—" . date("g:ia", strtotime($meeting['end'])) . "</a></td>";

				    
				$action = "view";
				if($username=="ipsos") {$action = "ipsos";}

				echo "<td class='name'><a class='meeting' href='/meetings/".$action."/" . $meeting['id'] . "'>" . $meeting['name'] . "</a></td>";
				
				echo "</tr></a>\n";
			
			}



	?>


		
</table>