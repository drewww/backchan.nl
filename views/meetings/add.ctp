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
 * /meetings/add
 * variables passed from controller: 
 */

$script = <<<SCRIPT
YAHOO.util.Event.onDOMReady(init);

function init()
{	
	
	// Set up the calendar handler
	
	function selectHandler(type, args, object)
	{
		var date = args[0][0];
		var year = date[0]; var month = date[1]; var day = date[2];
		
		var dateInput = document.getElementById("MeetingDate");
		dateInput.value = month + "/" + day + "/" + year;
		
		updateHidden();

	}
	
	function updateCalendar()
	{
		var dateInput = document.getElementById("MeetingDate");
		cal1.cfg.setProperty('selected', dateInput.value);
        var selectedDates = cal1.getSelectedDates();
		var firstDate = selectedDates[0];
		cal1.cfg.setProperty("pagedate", (firstDate.getMonth()+1) + "/" + firstDate.getFullYear());
		cal1.render();
		updateHidden();
	}


	// Set up the date input
	
	var dateInput = document.getElementById("MeetingDate");
	var date = new Date(); var month = date.getMonth() + 1;
	dateInput.value = month + "/" + date.getDate() + "/" + date.getFullYear();
	
	YAHOO.util.Event.addListener(dateInput, "change", updateCalendar);


	// Set up the calendar
	
	cal1 = new YAHOO.widget.Calendar("calendarContainer");
	cal1.selectEvent.subscribe(selectHandler, cal1, true);
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

}

function changeStart()
{
	if (this.value != "")
	{
		var startTime = this.value.split(":");							// Should account for other separators, e.g. ., nothing
		if (startTime[0] == "" || startTime[1] == "" ||					// If either is null
			(isNaN(startTime[0]) || isNaN(startTime[1])) || 			// If either is not a number
			startTime[0].length > 2 || startTime[1].length != 2 ||		// If too many digits
			startTime.length != 2)										// If both values not specified or no colon
		{
			this.className = 'error';
			this.select();
			break;

		} else {
			this.className = '';
		
			var startMeridianSelect = document.getElementById("MeetingStartMeridian");
			var endInput = document.getElementById("MeetingEnd");
			var endMeridianSelect = document.getElementById("MeetingEndMeridian");
			
			if (startTime[0] < 10 && startTime[0].length == 2)
				this.value = startTime[0].substring(1,2) + ":" + startTime[1];
			
			if (startTime[0] == 0) {
				this.value = "12:" + startTime[1];
				startMeridianSelect.value = "am";
			}
			
			if ((startTime[0]*1) >= 12) {
				if ((startTime[0]*1) > 12)
					this.value = (startTime[0]*1 - 12) + ":" + startTime[1];
				startMeridianSelect.value = "pm";
				if ((startTime[0]*1) == 24) var endHour = 1;
				else var endHour = startTime[0]*1 - 11;
				if (endMeridianSelect.value == "am") endMeridianSelect.value = "pm";
				else endMeridianSelect.value == "am";
			} else {
				var endHour = startTime[0]*1 + 1;
			}
			
			endInput.value = endHour + ":" + startTime[1];
			updateHidden();
		}		
	}
	
}

function changeStartMeridian() {

	var startMeridianSelect = document.getElementById("MeetingStartMeridian");
	var endMeridianSelect = document.getElementById("MeetingEndMeridian");
	var startTime = document.getElementById("MeetingStart").value.split(":");
	var startHour = startTime[0];
	
	if (startMeridianSelect.value == "pm" && startHour != 11) endMeridianSelect.value = "pm";

	// do nothing ... for now

	updateHidden();
}

function changeEnd()
{
	if (this.value != "")
	{
		var endTime = this.value.split(":");
		if (endTime[0] == "" || endTime[1] == "" ||					// If either is null
			(isNaN(endTime[0]) || isNaN(endTime[1])) || 			// If either is not a number
			endTime[0].length > 2 || endTime[1].length != 2 ||		// If too many digits
			endTime.length != 2)										// If both values not specified or no colon
		{
			this.className = 'error';
			this.select();
			break;

		} else {
			this.className = '';	
			updateHidden();
		}
	}
}

function alertChanges(event)
{
	alert(this.value)
}

function updateHidden(){
	
	var startYear = document.getElementById("MeetingStartYear");
	var startMonth = document.getElementById("MeetingStartMonth");
	var startDay = document.getElementById("MeetingStartDay");
	var startHour = document.getElementById("MeetingStartHour");
	var startMin = document.getElementById("MeetingStartMin");
	var startMeridian = document.getElementById("MeetingStartMeridian");

	var endYear = document.getElementById("MeetingEndYear");
	var endMonth = document.getElementById("MeetingEndMonth");
	var endDay = document.getElementById("MeetingEndDay");
	var endHour = document.getElementById("MeetingEndHour");
	var endMin = document.getElementById("MeetingEndMin");
	var endMeridian = document.getElementById("MeetingEndMeridian");
	
	// Parse start time
	// Validity check
	
	var startTime = document.getElementById("MeetingStart").value.split(":");
	startHour.value = startTime[0]; startMin.value = startTime[1];
	
	// Parse end time
	// Validity check
	
	var endTime = document.getElementById("MeetingEnd").value.split(":");
	endHour.value = endTime[0]; endMin.value = endTime[1];
	
	// Parse start date and end date
	// Some validity check goes here
	
	var startDate = document.getElementById("MeetingDate").value.split("/");
	startYear.value = startDate[2]; startMonth.value = startDate[0]; startDay.value = startDate[1];
	
	if ((startMeridian.value == "pm" && endMeridian.value == "am") ||
		(startMeridian.value == endMeridian.value && endHour < startHour)) {
		var endDayValue = startDate[1]*1 + 1; }
	else endDayValue = startDate[1];
	
	endYear.value = startDate[2]; endMonth.value = startDate[0]; endDay.value = endDayValue;
	
	
}



// function selectHandler(type, args, object)
// {
// 	var selected = args[0];
// 	
// 	var datePieces = selected.toString().split(",");
// 	alert(selected);
// 
// 	var dateInput = document.getElementById("MeetingDate");
// 	dateInput.value = datePieces[1] + "/" + datePieces[2] + "/" + datePieces[0];
	
	
// 	
// 	// Now push the selected date down onto the hidden
// 	// form elements that need to send it to the server. 
// 	var datePieces = selected.toString().split(",");
// 	
// 	var yearStart = document.getElementById("MeetingStartYear");
// 	var yearEnd = document.getElementById("MeetingEndYear");
// 	
// 	var monthStart = document.getElementById("MeetingStartMonth");
// 	var monthEnd = document.getElementById("MeetingEndMonth");
// 	
// 	var dayStart = document.getElementById("MeetingStartDay");
// 	var dayEnd = document.getElementById("MeetingEndDay");
// 	
// 	yearStart.value = datePieces[0];
// 	yearEnd.value = datePieces[0];
// 	
// 	monthStart.value = datePieces[1];
// 	monthEnd.value = datePieces[1];
// 	
// 	dayStart.value = datePieces[2];
// 	dayEnd.value = datePieces[2];
// }

SCRIPT;

$javascript->codeBlock($script, array("inline"=>false));

echo $javascript->link(
	array(
		'/js/dateparse.js'
	),
	false
);

// if($conferenceSelected == true) {

?>
<div class="meetings form">
<?php echo $form->create('Meeting', array('url'=>array('action'=>'add/'.$conference['id'])));?>

	<fieldset>
 		<legend><?php __('Add Meeting to');?> &#8220;<?php echo $conference['name'] ?>&#8221;</legend>
		<input type="hidden" id="MeetingConferenceId" value="<?php echo $conference['id'];?>" maxlength="11" name="data[Meeting][conference_id]"/>

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
			
			<div class="column">
				<h3>2. Confirm details</h3>
				
			<ul>
				
				<li>
				<div class="input time">
				<label for="MeetingDate">Date</label>
				<input id="MeetingDate" type="text" value="" />
				</div>
				</li>

				<li>
				<div class="input time">
				<label for="MeetingStart">From</label>
				<input id="MeetingStart" type="text" value="" />
				<select id="MeetingStartMeridian" name="data[Meeting][start][meridian]">
					<option value="am">a.m.</option>
					<option value="pm">p.m.</option>
				</select>
				</div>
				</li>

				<!--<td style="opacity: 0.5"><?php echo $form->input('start', array('type' => 'time', 'interval' => 5)); ?></td>-->

				<li>
				<div class="input time">
				<label for="MeetingEnd">Until</label>
				<input id="MeetingEnd" type="text" value="" />
				<select id="MeetingEndMeridian" name="data[Meeting][end][meridian]">
					<option value="am">a.m.</option>
					<option value="pm">p.m.</option>
				</select>
				</div>
				</li>
				
				<!--<td style="opacity: 0.5"><?php echo $form->input('end', array('type' => 'time', 'interval' => 5));?></td>-->
			

				<li>
				<?php echo $form->input('name');?>
				</li>
				
				<li>	
				<?php echo $form->submit('Add Meeting');?>
				</li>

			</ul>
			</div>
			
			<div class="column">
				<h3>All Meetings</h3>
				
				<dl id="meetings_list">
					<dt>Wed, Dec 31, 7:00 p.m.&ndash;8:00 p.m.</dt>
					<dd>Meeting 1</dd>
				</dl>
			
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

		


<?php // } else { ?>
	
<!-- <div class="meetings">Not a valid conference</div> -->


<?php // } ?>


