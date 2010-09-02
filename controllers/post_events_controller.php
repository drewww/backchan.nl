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

class PostEventsController extends AppController {

	var $scaffold;
	
	// I'm not sure that I need this, but I think I do?
	var $uses = array("Post", "PostEvent", "Meeting");
	
	function add()
	{
		Configure::write('debug', 0);
		
		if(empty($this->data))
		{
			$this->set("result", "false");
			$this->set("message", "No POST parameters provided.");
			$this->render(null, 'ajax');
			return;
		}
		
		// First check the admin cookie against the meeting Id for this meeting.
		$postId = $this->data['PostEvent']['post_id'];
		
		// First see if the cookie exists.
		$adminConferenceId = $this->Cookie->read("AdminConference.id");
		if(!isset($adminConferenceId))
		{
			// Fail out.
			$this->set("result", "false");
			$this->set("message", "User does not have admin access.");
			$this->render(null, 'ajax');
			return;
		}
		
		$post = $this->Post->find(array("Post.id"=>$postId), array(), null, 1);
		$meeting = $this->Meeting->find(array("Meeting.id"=>$post['Meeting']['id']), array(), null, 1);
		
		// The $post should have Conference data with it, so we can check against
		// the id of the cookie.
		$conferenceId = $meeting['Conference']['id'];
		
		if($conferenceId != $adminConferenceId)
		{
			$this->set("result", "false");
			$this->set("message", "User has admin access, but not on this conference.");
			$this->render(null, 'ajax');
			return;
		}
		
		// Now we know they're legit. Add a new PostEvent of the appropriate type.

		// Grab the data.
		$eventType = $this->data['PostEvent']['event_type'];
		
		if($eventType == "promote" || $eventType=="demote" || $eventType=="delete")
		{
			
			// Make a new event!
			$this->PostEvent->save($this->data);
			$this->set("result", "true");
			$this->set("message", "PostEvent: " . $eventType . " created on Post.id: " . $postId);
			$this->render(null, 'ajax');
		}
	}
	
	function edit()
	{
		//Configure::write('debug', 0);
		
		if(empty($this->data))
		{
			$this->set("result", "false");
			$this->set("message", "No POST parameters provided.");
			$this->render(null, 'ajax');
			return;
		}
		
		// First check the admin cookie against the meeting Id for this meeting.
		$postId = $this->data['PostEvent']['post_id'];
		
		// First see if the cookie exists.
		$adminConferenceId = $this->Cookie->read("AdminConference.id");
		if(!isset($adminConferenceId))
		{
			// Fail out.
			$this->set("result", "false");
			$this->set("message", "User does not have admin access.");
			$this->render(null, 'ajax');
			return;
		}
		
		$post = $this->Post->find(array("Post.id"=>$postId), array(), null, 1);
		$meeting = $this->Meeting->find(array("Meeting.id"=>$post['Meeting']['id']), array(), null, 1);
		
		// The $post should have Conference data with it, so we can check against
		// the id of the cookie.
		$conferenceId = $meeting['Conference']['id'];
		
		if($conferenceId != $adminConferenceId)
		{
			$this->set("result", "false");
			$this->set("message", "User has admin access, but not on this conference.");
			$this->render(null, 'ajax');
			return;
		}
		
		// Now we know they're legit. Add a new PostEvent of the appropriate type.

		// Grab the data.
		$eventType = $this->data['PostEvent']['event_type'];
		if ($this->data['PostEvent']['new_post_content'] != null)
			$newPost = $this->data['PostEvent']['new_post_content'];

		if (isset($newPost))
		{
			// Update the post body
			$this->Post->read(null, $postId);
			$this->Post->set('body',$newPost);
			$this->Post->save();
			$this->set("result", "true");
			$this->set("message", "Post.id: " . $postId . " body updated to '" . $newPost . "'");
			$this->render(null, 'ajax');
			return;
		}

		if($eventType == "promote" || $eventType=="demote" || $eventType=="delete" || $eventType=="edit")
		{
			// Make a new event!
			$this->PostEvent->save($this->data);
			$this->set("result", "true");
			$this->set("message", "PostEvent: " . $eventType . " created on Post.id: " . $postId);
			$this->render(null, 'ajax');
		}
	}

}

?>