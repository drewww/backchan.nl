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

class ConferencesController extends AppController {

	// var $scaffold;
	var $uses = array("Conference","Meeting");

	function view($id = null) {

		// $this->Cookie->write('Meeting.conference_id',
		// 	$id,
		// 	false,  // encrypt  // TODO: for production, change to true
		// 	null  // expire [second], null means end of session (browser closed)
		// );

		$meetingsInfo = $this->Meeting->find('all', array('conditions'=>array("Meeting.conference_id"=>$id),'order'=>"start ASC", 'recursive'=>0));
		$conferenceInfo = $this->Conference->find(array("Conference.id"=>$id), array(""), null, 0);
		
		if($conferenceInfo==null)
		{
			$conferenceName = "Conference Not Found";
		}
		else
			$conferenceName = $conferenceInfo['Conference']['name'];
		
		if($meetingsInfo==null)
		{
			$validConference = false;
		}
		else
			$validConference = true;
			
		
		// Check and see if this person is authorized. 
		$adminConferenceId = $this->Cookie->read("AdminConference.id");
		
		// Compare the stored conferenceId in the cookie with the id of the conference
		// that this meeting is in. This implicitly checks that the cookie key is set at all; 
		// if it's not, presumably it will always fail the first check. 
		debug($conferenceInfo);
		
		if($adminConferenceId == $conferenceInfo['Conference']['id'])
		{
			$this->set('adminInterface', true);
			$this->set('conferenceId', $conferenceInfo['Conference']['id']);
		}
		else
		{
			$this->set('adminInterface', false);
			$this->set('conferenceId', $conferenceInfo['Conference']['id']);
		}
		
		$this->set('meetings', $meetingsInfo);
		$this->set('validConference', $validConference);
		$this->set('conferenceName', $conferenceName);
	}

	/**
	 * Home page, starting point for conference admins to register a conference
	 */
	function start()
	{
		$hostName = env("HTTP_HOST");

		// Need to do something else here instead. Hmm.
		if($hostName=="localhost")
			return;
		
		// Now cut off the subdomain. That should be a conference username.
		$hostPieces = explode(".", $hostName);
		
		// Make sure there IS a subdomain at all. (we expect foo.backchan.nl, so 3 pieces is right here.)
		// Also maintain an exception here for testing on the dev subdomain. 
		if(count($hostPieces)==3 || ($hostPieces[1]=="dev" && count($hostPieces==4)))
		{
			$subDomain = $hostPieces[0];
			
			// Look up subdomain against list of conference user names.
			$conferenceInfo = $this->Conference->find(array("Conference.username"=>$subDomain), array("id"), null, 0);
			
			// Now redirect to a view action on that conference.
			$this->redirect("/conferences/view/" . $conferenceInfo['Conference']['id']);
		}
		
	}


	
	// Check to see if the submitted password matches the conference password.
	//
	function admin($id)
	{
		$submittedPassword = $this->data['adminPassword'];
		
		// Get the info for the matching conference.
		$conferenceInfo = $this->Conference->find(
			array("Conference.id"=>$id),
			array(),
			null,
			0
			);
		
		// debug($conferenceInfo);
		
		// Check to see if the password they submitted matches the
		// internal password. (TODO: This really needs to be hashed in the database. It's a travesty that
		//                           it's not this way already. I don't have time to do it now, though.)
		if($submittedPassword == $conferenceInfo['Conference']['password'])
		{
			// Set the admin cookie. Ecrypt it to avoid end-users monkeying with it to get admin status set for
			// themselves.
			$this->Cookie->write("AdminConference.id", $id, true);
			$this->set('success', "true");
		}
		else
		{
			// Write the cookie here too, so we can clear any access on a bad password submission.
			$this->Cookie->write("AdminConference.id", null, true);
			$this->set('success', "false");
		}
		
		$this->render(null, 'ajax');
	}

	function add()
	{
		// 
		// Configure::write('debug', 3);
		// 
		// 
		// // if we have post data, use that to make a new conferences object and save it.
		if (!empty($this->data))
		{
			// echo "HAVE POST DATA";
			
			// debug($this->data);
			
			// Do sanitation/validation here?
			
			$results = $this->Conference->save($this->data);

			if(!empty($results))
			{
				// give this person an admin cookie on this conference and then redirect them
				// to their conference admin page (which is just conferences/view, with buttons)
				// for adding/deleting events. 
				
				$this->Cookie->write("AdminConference.id", $this->Conference->id, true);
				$this->redirect("/conferences/view/" . $this->Conference->id);
				// now bounce them to the view. 
			}
		}
		$this->render(null, 'form');
		// 
	}

	function edit($confId)
	{
		
		$meetingsInfo = $this->Meeting->find('all', array('conditions'=>array("Meeting.conference_id"=>$confId),'order'=>"start ASC", 'recursive'=>0));

		// If there are additional params in the URL
		// (set as the form action by conference_edit.js)
		// then parse them here
		
		$editAction = $this->params['url']['action'];
		$finished = $this->params['url']['finished'];
		
		
		// First check to see if there is an admin cookie, and redirect to the right confId if so

		if ($this->Cookie->read('AdminConference.id') != $confId)
		{	
			$this->redirect("/conferences/edit/".$this->Cookie->read('AdminConference.id'));
		
		// If no cookie or no conference ID, send them to login
			
		} else if(!isset($confId)) {

			$this->Cookie->write('Login.referrer', 'conferences/edit', false);
			$this->redirect("/login"); exit();

		// If they get this far, they must be a valid conference admin

		}


		if (!empty($this->data))
		{
			
			// echo $editAction;
			
			if ($editAction == 'add') {
			
				$this->Meeting->set('enabled','1');
				$results = $this->Meeting->save($this->data);
				if ($finished == 'true') header("location: /conferences/view/".$confId);
				else header("location: /conferences/edit/".$confId);
			
			} else if ($editAction == 'edit') {

				$conditions = array("Meeting.id" => $this->data['Meeting']['id']);
				$this->Meeting->read('first', array('conditions' => $conditions));
				$this->Meeting->set($this->data);
				$this->Meeting->save();
				if ($finished == 'true') header("location: /conferences/view/".$confId);
				else header("location: /conferences/edit/".$confId);
			
			}

		}
		

		// Populate the page with the right data
		
		$results = $this->Conference->findById($confId);
		$conference = $results["Conference"];
		
			if(!empty($conference))
			{
				$this->set('conference', $conference);
				$this->set('meetings', $meetingsInfo);
			}

		$this->render(null, 'form');

	}


	function mobile($id = null) {

		$meetingsInfo = $this->Meeting->find('all', array('conditions'=>array("Meeting.conference_id"=>$id),'order'=>"start ASC", 'recursive'=>0));
		$conferenceInfo = $this->Conference->find(array("Conference.id"=>$id), array(""), null, 0);
		
		if($conferenceInfo==null)
		{
			$conferenceName = "Conference Not Found";
		}
		else
			$conferenceName = $conferenceInfo['Conference']['name'];
		
		if($meetingsInfo==null)
		{
			$validConference = false;
		}
		else
			$validConference = true;
		
		debug($conferenceInfo);
		
		$this->set('meetings', $meetingsInfo);
		$this->set('validConference', $validConference);
		$this->set('conferenceName', $conferenceName);

		// // CookieComponent::read() returns null, if no match
		// $userId = $this->Cookie->read('User.id');
		// if ($userId != null) {
		// 	// Model::find() returns false, not empty array, if no match
		// 	$user = $this->Meeting->Post->User->find(
		// 		array('User.id' => $userId),
		// 		array('User.id', 'User.name', 'User.affiliation'),
		// 		null,
		// 		0
		// 	);
		// 	if ($user != false)
		// 		$this->set('user', $user);
		// 	else
		// 		$this->set('user', false);
		// }
		// 
		// $meeting = $this->Meeting->read(null, $id);
		// $this->set('meeting',
		// 	$meeting
		// );
		// 
		// $adminConferenceId = $this->Cookie->read("AdminConference.id");
		// 
		// if($adminConferenceId == $meeting['Conference']['id'])
		// 	$this->set('adminInterface', "true");
		// else
		// 	$this->set('adminInterface', "false");
		// 
		// $this->set('posts', $this->refresh($id, true));

		$this->render(null, 'mobile');
		
	}
	
	/* 	Simple login script added by Trevor
	*/

	function login()
	{
		
        if(!empty($this->data))
        { 
	
			// Configure::write('debug',3);
			
			if ($conference = $this->Conference->validateLogin($this->data['Conference']))
			{
				
//				if ($this->data['Conference']['username'] == "admin") $this->Session->write('Admin', $conference);
//				Beginnings of a universal admin login

				$refer_path = "/";
				if ($this->Cookie->read('Login.referrer') != null)
					$refer_path .= $this->Cookie->read('Login.referrer')."/".$conference['id'];
				else $refer_path .= "conferences/view/".$conference['id'];

				$this->Cookie->del('Login.referrer');
				$this->Cookie->write("AdminConference.id", $conference['id'], true);
				$this->flash('Successfully logged in',$refer_path);
				
			} else {
				$this->Cookie->write("AdminConference.id", null, true);
				$this->flash('Sorry, that username and password combination was incorrect','/login');
			}
			
/*            if(($user = $this->Conference->validateLogin($this->data['Conference'])) == true) 
            {
				echo "Success!";
                $this->Session->write('Conference', $user); 
                $this->Session->setFlash('You\'ve successfully logged in.'); 
            //    $this->redirect('index'); 
            //    exit(); 
            } 
            else 
            { 
				echo "Failure!";
                $this->Session->setFlash('Sorry, the information you\'ve entered is incorrect.'); 
            //    exit(); 
            } */

        }
	}
	
	function logout() 
    {
		$this->Cookie->del("AdminConference.id");
        // $this->Session->destroy('user'); 
        $this->Session->setFlash('You\'ve successfully logged out.'); 
        $this->redirect('/'); 
    }

/*	function __validateLoginStatus() 
    { 
        if($this->action != 'login' && $this->action != 'logout') 
        { 
            if($this->Session->check('User') == false) 
            { 
                $this->redirect('login'); 
                $this->Session->setFlash('The URL you\'ve followed requires you login.'); 
            } 
        } 
    } */
	
}

?>