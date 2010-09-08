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
 * DataTable
 ******************************************************************************/
var meetingId;
var dsourcePosts;  // TODO: possible not to use global variables?
var dtablePosts;
var oAgeColumn;
var dRefreshInterval;

function initDataSource()
{
	meetingId = document.getElementById("PostMeetingId").value;
	// TODO: count pos/neg votes on client side in DataSource?
	dsourcePosts = new YAHOO.util.DataSource("/meetings/refresh" + "/",
		{
			responseType: YAHOO.util.DataSource.TYPE_JSON,
			connXhrMode: "queueRequests"  // TODO: "cancelStaleRequests"
		}
	);
	// Can also do following instead of 2nd parameter above
	// dsourcePosts.responseType = YAHOO.util.DataSource.TYPE_JSON;
	// dsourcePosts.connXhrMode = "queueRequests";
	dsourcePosts.responseSchema = {
		resultsList: "Post",  // String pointer to result data
		fields: [
			"Post.id",
			"Post.body",
			{
				key: "Post.created",
				// YAHOO.util.DataSource.parseDate uses the JavaScript Date
				// object constructor to parse the data, which takes several
				// textual date formats. However, it does not automatically
				// process my SQL output, so I defined my own custom function
				// as follows. This overrides the YUI, can use diff name.
				// (http://yuiblog.com/blog/2007/09/12/satyam-datatable/)
				parser: function (oData) {
					var parts = oData.split(" ");
					var dateParts = parts[0].split("-");
					var timeParts;
					if (parts.length > 1) {
						timeParts = parts[1].split(":");
						return new Date(
							dateParts[0], dateParts[1]-1, dateParts[2],
							timeParts[0], timeParts[1], timeParts[2]
						);
					}
					else {
						return new Date(
							dateParts[0], dateParts[1]-1, dateParts[2]
						);
					}
				}
			},
			"Post.age",
			"Post.age_unix",
			"Post.pos_votes",
			{
				key: "Post.neg_votes",
				parser: YAHOO.util.DataSource.parseNumber
			},
			"Post.score",
			"User.name",
			"User.affiliation",
			"Post.isDemoted",
			"Post.isDeleted",
			"Post.isPromoted"  // makes it available
			// TODO: "PostEvent.*"
		],
		 metaFields: {  // TODO: *** ////////////////////////////////////////////
		 			sortKey: "Post.age_unix",
		 			sortDir: "desc"
		// 			// // oParsedResponse.meta.totalRecords === 1358
		// 			// totalRecords : 'Response.Total',
		// 			// // oParsedResponse.meta.something === "pot o' gold"
		// 			// something : 'Important.to.me'
		 		}
	};

	return dsourcePosts;
}

function initDataTable()
{
	
	initDataSource();
	
	var colPosts = [
		{
			key: "Post.body",
			label: "Post",  // if no label, default is value of key
			width: 481,
			//minWidth: 475,
			maxWidth: 500,
			resizeable: true,
			formatter: function (elCell, oRecord, oColumn, oData)
			{
				
				if(showAdmin)
				{

					var dataTable = document.getElementById("DataTable");
					YAHOO.util.Dom.addClass(dataTable,"adminWidth");
					// Set a width for the post body so that we can avoid having to wrestle around with the CSS box model...
				
					var elCellParent = YAHOO.util.Dom.getAncestorByTagName(elCell,"td");
					
					if (elCellParent.innerHTML.indexOf("yui-push-button edit") == -1)
					{  // Check to see if the edit button already exists by searching for the class names
					
					    // This is the memory leak avoidance technique, deployed
					    // in the actions column primarily, but also used here
					    // to manage the edit button. The full infrastructure
					    // is included here, even though we could probably get
					    // away without making a list.
					    if(!elCellParent.buttons) {
        				    elCellParent.buttons = [];
        				}
                        // console.log(elCell.buttons);
                        for (var index in elCellParent.buttons) {
                            button = elCellParent.buttons[index];
                            // console.log("Destroying button:");
                            // console.log(button);
                            button.destroy();
                            }

                        elCellParent.buttons = [];
					    
						var bEdit = new YAHOO.widget.Button(
							{
								container: elCellParent,
								type: "push",  // default is "push"
								id: "Edit_" + oRecord.getData("Post.id"),
								onclick: {
									fn: function () {
										doEdit(oRecord.getData("Post.id"));
									}
								}
							}
						);
						bEdit.addClass("edit");
						
						elCellParent.buttons.push(bEdit);
					
					}
					
				}

				var text = "";
				if(oRecord.getData("Post.isDemoted")==1)
				{
					YAHOO.util.Dom.addClass(elCell,"post-accepted");
				}
				
				text += oData;

				elCell.innerHTML = text;

			}
		},
		{
			key: "User.name",
			label: "Author",
			sortable: true,  // sorting based on key in DataSource (string)
			formatter: function (elCell, oRecord , oColumn , oData) {
				elCell.innerHTML =
					'<span class="user-name-in-table">' +
					oData + "</span><br />" +
					'<span class="user-affiliation-in-table">' +
					oRecord.getData("User.affiliation") + "</span>";
			}
		},
		// {
		// 	key: "User.affiliation",
		// 	label: "Affiliation",
		// 	sortable: true,
		// 	formatter: function (elCell, oRecord , oColumn , oData) {
		// 		elCell.innerHTML =
		// 			'<span class="user-affiliation-in-table">' +
		// 			oData + "</span>";
		// 	}
		// },
		{
			key: "Post.pos_votes",
			label: '<img alt="Positive Votes" src="/img/arrow_up.png"/>',
			sortable: true  // sorting based on key in DataSource (string)
			// formatter: YAHOO.widget.DataTable.formatNumber
		},
		{
			key: "Post.neg_votes",
			label: '<img alt="Negative Votes" src="/img/arrow_dn.png"/>',
			sortable: true  // sorting based on key in DataSource (number)
		},
		{
			key: "Post.id",
			label: "Actions",
			// width: 75,
			minWidth: 75,
			formatter: function (elCell, oRecord , oColumn , oData) {
				// TODO: Without following line, each refresh adds buttons to
				//       the cell. But is this really the way to do it in YUI?
				elCell.innerHTML = "";  // TODO: null and "" both work
				
				// Do some cleanup work - delete the buttons that were in the
				// cell in the previous cycle befor we create/add new ones.
				if(!elCell.buttons) {
				    elCell.buttons = [];
				}
                // console.log(elCell.buttons);
                for (var index in elCell.buttons) {
                    button = elCell.buttons[index];
                    // console.log("Destroying button:");
                    // console.log(button);
                    button.destroy();
                    }
                
                elCell.buttons = [];
				
				// Vote Up buttons
				var bVoteUp = new YAHOO.widget.Button(
					{
						container: elCell,
						type: "push",  // default is "push"
						id: "VoteUp_" + oData,
						onclick: {
							fn: function () {
								addPostVote(oData, 1);
							}
						}
					}
				);
				bVoteUp.addClass("vote-up");
				// Vote Dn buttons
				var bVoteDn = new YAHOO.widget.Button(
					{
						container: elCell,
						id: "VoteDn_" + oData,
						onclick: {
							fn: function () {
								addPostVote(oData, -1);
							}
						}
					}
				);
				bVoteDn.addClass("vote-dn");
				
				elCell.buttons.push(bVoteUp);
				elCell.buttons.push(bVoteDn);
				
				if(showAdmin)
				{

					var bAnswered = new YAHOO.widget.Button(
						{
							container: elCell,
							id:"Answered_" + oData,
							onclick: {
								fn: function () {
									setAnswered(oData);
								}
							}
						});
					bAnswered.addClass("answered");

					var bDelete = new YAHOO.widget.Button(
						{
							container: elCell,
							id:"Delete_" + oData,
							onclick: {
								fn: function () {
									setDelete(oData);
								}
							}
						});
					bDelete.addClass("delete");
					
					elCell.buttons.push(bAnswered);
					elCell.buttons.push(bDelete);
				}
				// elCell.style.curcor = "pointer";
			}
		},
		{
			key: "Post.age",
			//field: "Post.age_unix",
			label: "Age",
			sortable: true,  // sorting based on key in DataSource (Date object)
			// sortOptions: {field:"Post.age_unix", defautOrder: "asc"}
			sortOptions: {sortFunction:ageSorter}
			// sortOptions: { defaultOrder: "asc" },

			// If no formatter provided, displays JavaScript Date object,
			// something like: Fri Feb 11 2005 19:30:00 GMT-0500 (EST)
			// formatter: "date"  // same as YAHOO.widget.DataTable.formatDate

			// TODO: age is calculated on client side instead of server side now,
			//       but there is time zone problem, which makes some of the test
			//       actually negative age
			// formatter: function (elCell, oRecord , oColumn , oData) {
			// 	// Constants [minute]
			// 	var OneHour = 60;
			// 	var OneDay = 60 * 24;
			// 	// Post's age so far [minute]
			// 	var totalMinutes = Math.round(
			// 		((new Date()).getTime() - oData.getTime()) /
			// 		(1000 * 60)  // number of milliseconds in a minute
			// 	);
			// 	// In the end, gives '{$nDays}d {$nHours}h {$nMinutes}m'
			// 	var xMinutes = totalMinutes;
			// 	var nDays = (xMinutes - (xMinutes % OneDay)) / OneDay;
			// 	xMinutes = xMinutes % OneDay;
			// 	var nHours = (xMinutes - (xMinutes % OneHour)) / OneHour;
			// 	var nMinutes = xMinutes % OneHour;
			// 	var age;
			// 	if (nDays > 0)
			// 		age = nDays + "d " + nHours + "h " + nMinutes + "m";
			// 	else if (nHours > 0)
			// 		age = nHours + "h " + nMinutes + "m";
			// 	else
			// 		age = nMinutes + "m";
			// 	elCell.innerHTML = age;
			// }
		}
	];
	
	
	dtablePosts = new YAHOO.widget.DataTable("DataTable",
		colPosts,
		dsourcePosts,
		{
			 initialLoad: true,  // default is true
			 initialRequest: meetingId,
			// caption: "My Caption :)",
			// summary: "My Summary :)",
			sortedBy: {  // highlights column, doesn't sort data
				key: "Post.created",  // TODO: this only works on first load,
				dir: "asc"            //       how to make work for subsequent
			}                        //       refreshing?
			// paginator: new YAHOO.widget.Paginator(
			// 	{
			// 		rowsPerPage: 10,
			// 		alwaysVisible: false
			// 	}
			// )
		}
	);
	
	oAgeColumn = dtablePosts.getColumn("Post.age");
	
	setRefreshSecs(15);

}

function setRefreshSecs(secs){
	
	if (dRefreshInterval != null) clearInterval(dRefreshInterval);
	
	dRefreshInterval = dsourcePosts.setInterval(1000 * secs, meetingId + "?stupidienocache=" + Math.random(),
		{
			// TODO: If success, compare # of posts and # of votes with current,
			//       and if not matching, update DataTable, otherwise no,
			//       this requires /meetings/refresh sends back more data,
			//       maybe add two int fields, totalPosts & totalVotes.
			//       Note these #s invariants? Still holds with demote, etc?


			// success: dtablePosts.onDataReturnInitializeTable,
			success: refreshSuccess,


			// silent failure
			scope: dtablePosts
			// timeout: 4000  // TODO: this doesn't seem to work
		}
	);
	
}

function ageSorter(a, b, desc)
{
	if(!YAHOO.lang.isValue(a)) {
        return (!YAHOO.lang.isValue(b)) ? 0 : 1;
    }
    else if(!YAHOO.lang.isValue(b)) {
        return -1;
    }

	var comp = YAHOO.util.Sort.compare;
    var compState = comp(a.getData("Post.age_unix"), b.getData("Post.age_unix"), desc);

    // If values are equal, then compare by Column1
    return (compState !== 0) ? compState : comp(a.getData("Post.age_unix"), b.getData("Post.age_unix"), desc);
}

function refreshDataTable(o, response, dataTable)
{
	dataTable.onDataReturnInitializeTable(o, response);
	dataTable.sortColumn(dtablePosts.getColumn("Post.age"));
	
	// dataTable.setSortState({key:"Post.age", dir:"asc"});
	
	// dataTable.sortedBy = {  // highlights column, doesn't sort data
	// 	key: "Post.created",  // TODO: this only works on first load,
	// 	dir: "asc"            //       how to make work for subsequent
	// };                        //       refreshing?
	
}