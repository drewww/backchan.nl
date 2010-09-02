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
 * /conferences/edit
 * variables passed from controller: 
 */

$scriptObject = "";

// This bit provides the info necessary for javascript to generate the posts on firstrun,
// without waiting for an HTTP request to get the data.
$scriptObject .= $javascript->object(
	array("Meetings"=>$meetings),
	array("prefix"=>"var meetingsSchedule=",
	"postfix"=>";\n")
	);

echo $javascript->link(array("conference_edit"), 
		false  // not inline, but $scripts_for_layout in layout
	);

$script = <<<SCRIPT
YAHOO.util.Event.onDOMReady(init);

function init()
{	
	
	initEditing();


	// Set up the date input
	
	var dateInput = document.getElementById("MeetingDate");
	var date = new Date(); var month = date.getMonth() + 1;
	dateInput.value = month + "/" + date.getDate() + "/" + date.getFullYear();
	
	YAHOO.util.Event.addListener(dateInput, "keyup", updateCalendar);


	// Set up the calendar
	
	cal1 = new YAHOO.widget.Calendar("calendarContainer");
	cal1.selectEvent.subscribe(calendarHandler, cal1, true);
	cal1.cfg.setProperty('selected', dateInput.value);
	cal1.render();
	
	
	// Set up start and end time handling

	var startInput = document.getElementById("MeetingStart");
	var startMeridianSelect = document.getElementById("MeetingStartMeridian");
	var endInput = document.getElementById("MeetingEnd");
	var endMeridianSelect = document.getElementById("MeetingEndMeridian");
	
	YAHOO.util.Event.addListener(startInput, 'change', changeStart);
	YAHOO.util.Event.addListener(startMeridianSelect, 'change', changeStartMeridian);
	YAHOO.util.Event.addListener(endInput, 'change', changeEnd);
	YAHOO.util.Event.addListener(endMeridianSelect, 'change', updateHidden);
	
	startInput.value = "9:00"; endInput.value = "10:00";
	
	updateHidden();
	
	initMeetingSchedule();

}

SCRIPT;

$javascript->codeBlock($scriptObject, array("inline"=>false));

$javascript->codeBlock($script, array("inline"=>false));

echo $javascript->link(
	array(
		'/js/dateparse.js'
	),
	false
);

?>
<div class="conferences edit_panel form">
	
	<div id="editHeader" class="header">
		<h2><?php __('Manage');?> &#8220;<?php echo $conference['name'] ?>&#8221;</h2>
		
		<button id="finishEditing" type="button">Finish &amp; Close</button>

	</div>
	
	<div class="schedule">
		
		<h3><?php __('Meeting Schedule');?> <button id="addMeeting" type="button">Add</button></h3>
	
	<dl id="meetings_list">
		
<?php

if(count($meetings)==0)
{
	echo "No meetings in this conference, yet. Why don't you add one?";
}

foreach($meetings as &$meeting) {

	$meeting = $meeting['Meeting'];

	$formattedDate = date("D, F j", strtotime($meeting['start']));

	if($formattedDate != $previousFormattedDate)
	{
		echo "<dt>" . date("D, F j", strtotime($meeting['start'])) . "</dt>"; // Output the date.
	}
	
	$previousFormattedDate = $formattedDate;
	$first = false;

	echo '<dd class="meeting"><a href="#">';
	echo '<span class="date">' . date("g:ia", strtotime($meeting['start'])) . "&ndash;" . date("g:ia", strtotime($meeting['end'])) . "</span> " . $meeting['name'];
	echo '<span class="buttons"></span></a>'."\n</dd>";

}

?>

	</dl>

	</div>

<form id="ConferenceEditForm" method="post" action="/conferences/edit/<?php echo $conference['id']; ?>?action=edit">

	<fieldset>
		<input type="hidden" id="MeetingConferenceId" value="<?php echo $conference['id'];?>" maxlength="11" name="data[Meeting][conference_id]"/>
		<input type="hidden" id="MeetingId" value="" name="data[Meeting][id]" />

			<!-- <tr><td><?php echo $form->input('conference_id'); ?></td><td class="FieldDescription">The name of the conference.</td> 
				<tr><td>
				<div class="input text">
					<label for="MeetingName">Conference Name</label>
					<input id="MeetingName" disabled type="text" value="<?php echo $conference['name'] ?>" maxlength="255" name="MeetingName"/>
				</div>
				</td>
				</tr>-->


			<div class="column">
				<h3>1. Select a date</h3>
				
			<ul>
				<li>
				<div class="input">
				<div id="calendarContainer"></div>
				</div>
				</li>
			</ul>

			</div>
			
			<div class="column confirm_details">
				<h3>2. Confirm details</h3>
				
			<ul>
				
				<li>
				<div class="input time">
				<label for="MeetingDate">Date</label>
				<input id="MeetingDate" type="text" value="" disabled="disabled" />
				</div>
				</li>

				<li>
				<div class="input time">
				<label for="MeetingStart">From</label>
				<input id="MeetingStart" type="text" value="" disabled="disabled" />
				<select id="MeetingStartMeridian" name="data[Meeting][start][meridian]" disabled="disabled">
					<option value="am">a.m.</option>
					<option value="pm">p.m.</option>
				</select>
				</div>
				</li>

				<li>
				<div class="input time">
				<label for="MeetingEnd">Until</label>
				<input id="MeetingEnd" type="text" value="" disabled="disabled" />
				<select id="MeetingEndMeridian" name="data[Meeting][end][meridian]" disabled="disabled">
					<option value="am">a.m.</option>
					<option value="pm">p.m.</option>
				</select>
				</div>
				</li>
			

				<li>
				<div class="input text"><label for="MeetingName">Name</label><input name="data[Meeting][name]" type="text" maxlength="255" value="" id="MeetingName" disabled="disabled" /></div>
				</li>
				
				<li>	
				<button id="formSubmit" type="submit">Save Meeting</button>
				<button id="formCancel" type="button">Cancel</button>
				</li>

			</ul>
			</div>
			
		<input type="hidden" id="MeetingStartMonth" name="data[Meeting][start][month]" value=""/>
		<input type="hidden" id="MeetingStartDay" name="data[Meeting][start][day]" value=""/>
		<input type="hidden" id="MeetingStartYear"name="data[Meeting][start][year]" value=""/>

		<input type="hidden" id="MeetingStartHour" name="data[Meeting][start][hour]" value=""/>
		<input type="hidden" id="MeetingStartMin" name="data[Meeting][start][min]" value=""/>
		
		<input type="hidden" id="MeetingEndMonth" name="data[Meeting][end][month]" value=""/>
		<input type="hidden" id="MeetingEndDay" name="data[Meeting][end][day]" value=""/>
		<input type="hidden" id="MeetingEndYear"name="data[Meeting][end][year]" value=""/>

		<input type="hidden" id="MeetingEndHour" name="data[Meeting][end][hour]" value=""/>
		<input type="hidden" id="MeetingEndMin" name="data[Meeting][end][min]" value=""/>
		
		</fieldset>
		
		</form>

</div>


