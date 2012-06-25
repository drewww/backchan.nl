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
 * User
 ******************************************************************************/

var dEditUser;
function initAddUser() {
	var bEditUser = new YAHOO.widget.Button("EditUser",
		{
			onclick: {
				fn: function () {
					dEditUser.show();
				}
			}
		}
	);
	var handleSubmit = function() { this.submit(); };
	dEditUser = new YAHOO.widget.Dialog("EnterUser",
		{
			width : "320px",
			fixedcenter : true,
			visible : false,
			constraintoviewport : true,
			zIndex: 1000,
			underlay: false,
			buttons : [
				{
					text: "Submit",
					handler: handleSubmit,  // pre-defined handler
					isDefault: true
				},
				{
					text: "Cancel",
					handler: function() { this.cancel(); }  // in-line handler
				}
			]
		}
	);
	dEditUser.callback = {
		success: function(o) {
			var r = eval("(" + o.responseText + ")");  // could use YUI's JSON
			if (r.User.name) {
				document.getElementById("UserInfoName").innerHTML =
					r.User.name;
				document.getElementById("UserInfoAffiliation").innerHTML =
					r.User.affiliation;
			}
			else if (r.User.message)
				setAlertMessage(r.User.message);
		},
		failure: function(o) {  // about connection, not server data validation
			setAlertMessage("Submission failed: " + o.status);
		}
	};
	dEditUser.validate = function() {
		// var data = this.getData();
		// // TODO: YUI can't handle Cake's name data[.][.]
		// if (data.data[User][name] == "") {
		// 	alert("Username cannot be empty!");
		// 	return false;
		// }
		// else if (data.username.indexOf(" ") != -1) {
		// 	alert("Username cannot contain space!");
		// 	return false;
		// }
		var userName = YAHOO.util.Dom.get("UserName").value;
		var userAffiliation = YAHOO.util.Dom.get("UserAffiliation").value;
		if (userName == "")
			setAlertMessage("Cannot submit empty user name!");
		// Removing this requirement, because in many situations it's okay for people not to list an affiliation. Besides, they can always do cheap
		// tricks like make their affiliation " " or "none" which is uglier.
		// else if (userAffiliation == "")
		// 	setAlertMessage("Cannot submit empty user affiliation!");
		else
		{
			setAlertMessage("");
			return true;
		}
	};
	dEditUser.render();

	// Position the user dialog at the top center of the screen
	// Use half of the body width - 160 because the dialog itself is 320px wide (160 * 2)
	dEditUser.moveTo( document.body.offsetWidth / 2 - 160, 240 );
	
	if(newAnonIdent) {
	    generateRandomIdentity();
	}
	
	// showIdentityDialog is set by the controller in JS that's injected into the page by PHP. It should be set in the meeting view. 
	if(showIdentityDialog)
	{
		dEditUser.show();
	}

	if(typeof(isAdmissionsInterface) != "undefined" && isAdmissionsInterface == true)
	{

		var bCreatePost = new YAHOO.widget.Button("CreatePost",
			{
				onclick: {
					fn: function () {
						dCreatePost.show();
					}
				}
			}
		);

		function createPostCallback(){
			addPost();
			dCreatePost.hide();
		}
				
		var dCreatePost = new YAHOO.widget.Dialog("EnterPost",
			{
				width : "450px",
				fixedcenter : false,
				visible : false,
				constraintoviewport : true,
				buttons : [
					{
						text: "Submit",
						handler: createPostCallback,  // pre-defined handler
						isDefault: true
					},
					{
						text: "Cancel",
						handler: function() { this.cancel(); }  // in-line handler
					}
				]
			}
		);
		

		dCreatePost.render();

		dCreatePost.moveTo( document.body.offsetWidth / 2 - 225, 600 );

	}

	// TODO: What these 4 lines do? Drew skipped them. Don't seem to make a diff.
	// YAHOO.util.Event.addListener("show", "click",
	// 	addplayerdialog.show, addplayerdialog, true);
	// YAHOO.util.Event.addListener("hide", "click",
	// 	addplayerdialog.hide, addplayerdialog, true);
		
}

function initAdminDialog()
{
	
	var dAdminPassword = new YAHOO.widget.Dialog("AdminUser",
		{
			width : "320px",
			fixedcenter : true,
			visible : false,
			constraintoviewport : true,
			buttons : [
				{
					text: "Submit",
					handler: function () { this.submit(); },  // pre-defined handler
					isDefault: true
				},
				{
					text: "Cancel",
					handler: function() { this.cancel(); }  // in-line handler
				}
			]
		}
	);
	
	dAdminPassword.callback = {
		success: function(o) {
			var response = eval("(" + o.responseText + ")");
			if(response.admin)
			{
				showAdmin = true;
				window.location.reload();
			} else
				showAdmin = false;
		},
		failure: function(o) { alert("Could not authenticate admin password.");}
	};
	
	dAdminPassword.render();
	
	var bAdminPassword = new YAHOO.widget.Button("AdminPassword",
		{
			onclick: {
				fn: function () {
					dAdminPassword.show();
				}
			}
		}
	);
	
}

function generateRandomIdentity() {
    document.getElementById("UserName").value = new Date().getTime() +"_" + Math.floor(Math.random()*1000);
	document.getElementById("UserAffiliation").value = "Anonymous";
	
	// submit it.
	dEditUser.submit();
}
