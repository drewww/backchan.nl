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
 * Edit Conferences
 ******************************************************************************/

function initEditing() {

	// Instantiate the various YUI buttons which comprise the interface
	
	var bFinish = new YAHOO.widget.Button(
		"finishEditing",
		{
			onclick: {
				fn: function () {
					
					var editForm = document.getElementById('ConferenceEditForm');
					var editAction = editForm.action.substring(0,editForm.action.length);
					if (editAction.indexOf("?") == -1) editForm.action = editAction + "?finished=true";
					else editForm.action = editAction + "&finished=true";

					document.getElementById('ConferenceEditForm').submit();
				}
			}
	});
	
	var bAdd = new YAHOO.widget.Button(
		"addMeeting",
		{
			onclick: {
				fn: function () {
					addMeeting();
					this.blur();
				}
			}
	});
	
	bSubmit = new YAHOO.widget.Button(
		"formSubmit",
		{
			disabled: true,
			onclick: {
				fn: function () {
					return checkErrors();
				}
			}
	});
	
	bCancel = new YAHOO.widget.Button(
		"formCancel",
		{
			disabled: true,
			onclick: {
				fn: function () {
					disableEditor();
					return false;
				}
			}
	});
	
	var onFormSubmit = function(e, myForm) {
		checkErrors();
		if (isError == true) YAHOO.util.Event.preventDefault(e);
	};

	YAHOO.util.Event.addListener(YAHOO.util.Dom.get("ConferenceEditForm"), "submit", onFormSubmit);
	
	window.isError = false;
	
	
}

function initMeetingSchedule() {
	
	var meetings = YAHOO.util.Dom.getElementsByClassName("meeting");

	// Bind the edit meeting handler to the dd itself
	// (the button actually does nothing)
	YAHOO.util.Event.addListener(meetings, "click", editMeeting);
	
	// 
	var buttonContainers = YAHOO.util.Dom.getElementsByClassName("buttons",null,meetings[i]);
	
	for (var i=0; i < buttonContainers.length; i++)
	{
	
		// Meeting delete button
		var bDelete = new YAHOO.widget.Button(
			{
				container: buttonContainers[i],
				id: "Delete_" + i,
				onclick: {
					fn: function (e) {

						YAHOO.util.Event.stopPropagation(e);
						YAHOO.util.Event.preventDefault(e);
						deleteMeeting(e);

					}
				}
			}
		);
		bDelete.addClass("delete");
	
		// Meeting edit button
		var bEdit = new YAHOO.widget.Button(
			{
				container: buttonContainers[i],
				id: "Edit_" + i,
				onclick: {
					fn: function (e) {
						this.blur(); YAHOO.util.Dom.addClass(this,"yui-button-activeedit");
					}
				}
			}
		);
		bEdit.addClass("edit-meeting");
		
		// Lazy way to hardcode the index value of the dd into the meeting dd
		YAHOO.util.Dom.addClass(buttonContainers[i].parentNode.parentNode,"i"+i)
	
	}
}

function checkErrors(){
	var name = document.getElementById('MeetingName');
	if (name.value == "") {
		YAHOO.util.Dom.addClass(name,"error");
		isError = true;
	} else {
		YAHOO.util.Dom.removeClass(name,"error");
		isError = false;
	}
	if (isError == true) {
		alert("Please fix the errors highlighted in red.");
		return false;
	} else return true;
}
	
function calendarHandler(type, args, object)
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
	var maxDays = ['31','29','31','30','31','30','31','31','30','31','30','31'];
	if (dateInput.value.split("/")[0] == "2" &&
		dateInput.value.split("/")[2]%4 != 0) maxDays[1] = '28';

	if(dateInput.value.split("/").length == 3 &&
		dateInput.value.split("/")[0].length > 0 &&
		dateInput.value.split("/")[0].length <= 2 &&
		dateInput.value.split("/")[1].length > 0 &&
		dateInput.value.split("/")[1].length <= 2 &&
		dateInput.value.split("/")[2].length == 4 &&
		dateInput.value.split("/")[1]*1 <= maxDays[dateInput.value.split("/")[0]-1]) {
		YAHOO.util.Dom.removeClass(dateInput,"error");
		isError = false;
		cal1.cfg.setProperty('selected', dateInput.value);
    	var selectedDates = cal1.getSelectedDates();
		var firstDate = selectedDates[0];
		cal1.cfg.setProperty("pagedate", (firstDate.getMonth()+1) + "/" + firstDate.getFullYear());
		cal1.render();
		updateHidden();
	} else {
		YAHOO.util.Dom.addClass(dateInput,"error");
		isError = true;
	}
}

function addMeeting() {
	
	var date = new Date();
	var month = (date.getMonth() < 10) ? "0"+(date.getMonth()+1) : (date.getMonth()+1);
	var day = (date.getDate() < 10) ? "0"+date.getDate() : date.getDate();
	var date = date.getFullYear()+"-"+month+"-"+day;
	
	var meetingData = [];
	meetingData['name'] = '';
	meetingData['start'] = date+' 09:00:00';
	meetingData['end'] = date+' 10:00:00';
	
	setupEditor('Add',meetingData);

	var addButton = document.getElementById('addMeeting');
	YAHOO.util.Dom.addClass(addButton,"yui-button-activeedit");
	
	var editForm = document.getElementById('ConferenceEditForm');
	var actionPath = editForm.action.substring(0,editForm.action.indexOf('?'));
	editForm.action = actionPath + "?action=add";

	editForm.style.top = "0px";
	
	// Enable the editor
	enableEditor();

}

function editMeeting(e) {
	
	/*  If the user clicks on any of the elements inside the span,
		we still need to make sure we are obtaining the dd object.
		So, traverse up until the e.target has a class of "meeting" */

	function findDD(el) {
		while(!YAHOO.util.Dom.hasClass(el, 'meeting'))
		{
			el = findDD(el.parentNode);
		}
		return el;
	}
	
	var meeting = findDD(e.target.parentNode); // Start with the target element's parent
	var meetings = YAHOO.util.Dom.getElementsByClassName('meeting','dd',meeting.parentNode)
	var meetingIndex = meetings.indexOf(meeting);
	var meetingData = meetingsSchedule['Meetings'][meetingIndex]['Meeting'];
	
	var editForm = document.getElementById('ConferenceEditForm');
	editForm.style.top = meeting.offsetTop - 150 + "px";
	// alert(meeting.offsetTop)

	// First thing we want to do is to prevent the link target from firing
	YAHOO.util.Event.preventDefault(e);

	setupEditor('Save',meetingData);

	// Add in the selection styling
	YAHOO.util.Dom.addClass(this,"selected");
	var editButton = YAHOO.util.Dom.getElementsByClassName("edit-meeting", "span", this);
	YAHOO.util.Dom.addClass(editButton,"yui-button-activeedit");
	
	// Set the right path on the form
	var actionPath = editForm.action.substring(0,editForm.action.indexOf('?'));
	editForm.action = actionPath + "?action=edit";
	
	// And set the right meeting Id in the form
	
	var meetingId = meetingData['id'];
	var meetingIdField = document.getElementById('MeetingId');
	meetingIdField.value = meetingId;
	
	// Enable the editor
	enableEditor();

}

function deleteMeeting(e) {

	if(confirm("Are you sure you want to delete this meeting?\nThis cannot be undone."))
	{

		function findDD(el) {
			while(!YAHOO.util.Dom.hasClass(el, 'meeting'))
			{
				el = findDD(el.parentNode);
			}
			return el;
		}
		
		var meeting = findDD(e.target.parentNode.parentNode); // Start with the target element's parent
		var meetings = YAHOO.util.Dom.getElementsByClassName('meeting','dd',meeting.parentNode)
		var meetingIndex = meetings.indexOf(meeting);
		var meetingData = meetingsSchedule['Meetings'][meetingIndex]['Meeting'];
		var meetingId = meetingData['id'];
    	
		var request = YAHOO.util.Connect.asyncRequest("POST",
			"/meetings/delete/"+meetingId,
			{
				success: function (o) {
					var r = eval("(" + o.responseText + ")");
					if (r.Meeting.value) {
						alert("success")
					}
					else if (r.PostVote.message)
						alert(r.PostVote.message);
				},
				failure: function (o) {
					setAlertMessage("Delete failed: " + o.status);
				},
				argument: { failmsg: "Delete failed. Please refresh and try again." },
				timeout: 4000
			}
		);
    	
		// If the meeting is the only meeting in a particular day, then delete the dt, as well
		// The second condition exists to catch single meetings at the bottom of the list
		if (meeting.previousSibling.tagName == "DT" && meeting.nextSibling.tagName == "DT" ||
			meeting.previousSibling.tagName == "DT" && meetings.length-1 == meetingIndex ) {
			meeting.parentNode.removeChild(meeting.previousSibling);
		}

		// Finally, remove the meeting itself from the dl
		// and the meeting data from the meetingsSchedule object
		// Would be nice to have some animation here
		meeting.parentNode.removeChild(meeting);
		meetingsSchedule['Meetings'].splice(meetingIndex,1);
    
	}
	
	disableEditor();

}

function cleanDate(dateString) {
	var date = dateString.split("-")
	var month = date[1]; if (month*1 < 10) month = month.substring(1,2);
	var day = date[2]; if (day*1 < 10) day = day.substring(1,2);
	return month+"/"+day+"/"+date[0];
}

function setupEditor(action,data) {
	
	var submitButton = document.getElementById('formSubmit');
	submitButton.firstChild.firstChild.innerHTML = action+" Meeting";

	// Set group variables (if we want we can probably grab an index from the button id)
	var meetings = YAHOO.util.Dom.getElementsByClassName("meeting");
	var editButtons = YAHOO.util.Dom.getElementsByClassName("edit-meeting", "span");
	var addButton = document.getElementById('addMeeting');

	// Remove styling from all other meetings in the list
	for (var i=0; i<meetings.length; i++) {
		YAHOO.util.Dom.removeClass(meetings[i],"selected");
		YAHOO.util.Dom.removeClass(addButton,"yui-button-activeedit");
		YAHOO.util.Dom.removeClass(editButtons[i],"yui-button-activeedit"); }
		
	// Sanitize the MeetingId variable (used only for editing)
	document.getElementById('MeetingId').value = "";

	// Fill in the meeting data
	
	if (data != null) {

		// Name
		document.getElementById("MeetingName").value = data['name'];
    	
		// Date
		var start = data['start'].split(" ");
		document.getElementById("MeetingDate").value = cleanDate(start[0]);

		// Start
		var startTime = start[1].substring(0,5);
		var startHour = startTime.substring(0,2)*1;
		if (startHour >= 12) {
			if (startHour != 12) startHour -= 12;
			document.getElementById("MeetingStartMeridian").value = "pm";
			startTime = startHour + ":" + startTime.substring(3,5); }
		if (startTime.indexOf("0") == 0) startTime = startTime.substring(1,5);
		document.getElementById("MeetingStart").value = startTime;
		
		// End
		var endTime = data['end'].split(" ")[1].substring(0,5);
		var endHour = endTime.substring(0,2)*1;
		if (endHour >= 12) {
			if (endHour != 12) endHour -= 12;
			document.getElementById("MeetingEndMeridian").value = "pm";
			endTime = endHour + ":" + endTime.substring(3,5); }
		if (endTime.indexOf("0") == 0) startTime = endTime.substring(1,5);
		document.getElementById("MeetingEnd").value = endTime;
		
		updateHidden(); updateCalendar();

	}
	
}

function enableEditor() {
	
	var editor = document.getElementById('ConferenceEditForm');
	
	// reenable buttons
	var inputs = ['MeetingDate','MeetingStart','MeetingStartMeridian','MeetingEnd','MeetingEndMeridian','MeetingName'];
	for (var i=0;i<inputs.length;i++) { document.getElementById(inputs[i]).removeAttribute('disabled','disabled'); }
	bSubmit.set("disabled", false);
	bCancel.set("disabled", false);

	editor.style.opacity = 1;
	
}

function disableEditor() {
	
	setupEditor('Save',null,null);
	
	var editor = document.getElementById('ConferenceEditForm');
	
	// disable buttons here
	var inputs = ['MeetingDate','MeetingStart','MeetingStartMeridian','MeetingEnd','MeetingEndMeridian','MeetingName'];
	for (var i=0;i<inputs.length;i++) { document.getElementById(inputs[i]).setAttribute('disabled','disabled');
		document.getElementById(inputs[i]).className = ""; }
	bSubmit.set("disabled", true);
	bCancel.set("disabled", true);
	
	editor.style.opacity = 0.25;
	editor.style.top = "0px";
	
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
			isError = true;
			this.select();
		} else {
			this.className = '';
			isError = false;
		
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