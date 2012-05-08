
YAHOO.util.Event.onDOMReady(function() {
	var dSetLocation = new YAHOO.widget.Dialog("SetLocation",
		{
		    visible : false,
		    fixedcenter:true,
		    constraintoviewport : true,
		    modal: true,
		    buttons : [
	{
	    text: "In Person",
	    handler: function() {

		dEditUser.show();
		this.hide();
	    },  // pre-defined handler                                                 
	    isDefault: true,
	    height: 90
	},
	{
	    text: "Watching Remotely",
	    handler: function() {
		YAHOO.util.Dom.setStyle('AdmissionsVideo', 'display', 'block');
		YAHOO.util.Dom.setStyle('agenda', 'display', 'none');
		dEditUser.show();
		this.hide();
	    },  // in-line handler                                     
	    height: 90
	}
        ]
	});


	YAHOO.util.Dom.setStyle('AdmissionsVideo', 'display', 'none');
	dEditUser.hide();
	dSetLocation.render();
      	dSetLocation.show();
	
    });