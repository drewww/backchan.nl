<?php
/**
  * backchan.nl
  * 
  * Copyright (c) 2006-2009, backchan.nl contributors. All Rights Reserved
  * 
  * The contents of this file are subject to the BSD License; you may not
  * use this file except in compliance with the License. A copy of the License
  * is available in the root directory of the project.
  */

class MeetingsController extends AppController {

	// var $scaffold;

	
	var $helpers = array('Cache');
	
	// This is hugely optimistic - the cache should get dirtied way
	// before that. 
	// var $cacheAction = array('refresh/' => '600');
		
	var $uses = array("Meeting","Conference");

	/**
	 * This is the most important action and the center of backchannl app.
	 */
	function view($id = null) {
		// TODO: request meeting not in DB "/meetings/view/8", check whether
		//       $this->read(null, $id) is false first?

		// Originally, I had the following, so that whenever a client loads a
		// meeting's view, a cookie Post.meeting_id is set to his browser, which
		// is used for submitting posts (/posts/add, Post.meeting_id) and for
		// refreshing/updating the page (/meetings/refresh). However, Drew found
		// a bug. Scenario is that when a client opens two browser windows/tabs
		// to watch two meetings, as the second meeting's cookie overwrites the
		// first meeting's with the same cookie name/key, then when the first
		// window refresh, the data it gets back from the server and displays in
		// the posts table is actually the second meeting's posts. This is a
		// major bug. Our solution is not to write the Post.meeting_id cookie
		// anymore, but to use a hidden <input> in the "PostAddForm".
		// Assumption: Users can watch/post/vote different meetings at the same
		//             time, but do not identify themselves differently at those
		//             different meetings. So, even if multiple users share same
		//             computer, they can only post/vote as one user.
		// $this->Cookie->write('Post.meeting_id', $id, true, null);

		// CookieComponent::read() returns null, if no match
		$userId = $this->Cookie->read('User.id');
		if ($userId != null) {
			// Model::find() returns false, not empty array, if no match
			$user = $this->Meeting->Post->User->find(
				array('User.id' => $userId),
				array('User.id', 'User.name', 'User.affiliation'),
				null,
				0
			);
			if ($user != false)
				$this->set('user', $user);
			else
				$this->set('user', false);
		}
		
		$meeting = $this->Meeting->read(null, $id);
		$this->set('meeting',
			$meeting
		);
		
		// Now check and see if this user has admin authentication.
		// (one of the implications of this way of doing things is that a user
		//  can only have admin access to one conference at a time. I think this
		//  is fine, since cookies expire with the browser session, are easily
		//  overwritten, and it's hard to imagine someone admining two conferences
		//  at once.)
		$adminConferenceId = $this->Cookie->read("AdminConference.id");
		
		// Compare the stored conferenceId in the cookie with the id of the conference
		// that this meeting is in. This implicitely checks that the cookie key is set at all; 
		// if it's not, presumably it will always fail the first check. 
		if($adminConferenceId == $meeting['Conference']['id'])
			$this->set('adminInterface', "true");
		else
			$this->set('adminInterface', "false");
		
		$this->set('posts', $this->refresh($id, true));
		
		
		
	}

	function admissions($id = null) {
		
		// This is the version we created for the MIT Admissions department, 
		// who likes to implement a video and chat module directly in the page
		
		// *** Based on view()
		
		$userId = $this->Cookie->read('User.id');
		if ($userId != null) {
			// Model::find() returns false, not empty array, if no match
			$user = $this->Meeting->Post->User->find(
				array('User.id' => $userId),
				array('User.id', 'User.name', 'User.affiliation'),
				null,
				0
			);
			if ($user != false)
				$this->set('user', $user);
			else
				$this->set('user', false);
		}
		
		$meeting = $this->Meeting->read(null, $id);
		$this->set('meeting',
			$meeting
		);
		
		$adminConferenceId = $this->Cookie->read("AdminConference.id");

		if($adminConferenceId == $meeting['Conference']['id'])
			$this->set('adminInterface', "true");
		else
			$this->set('adminInterface', "false");
		
		$this->set('posts', $this->refresh($id, true));
		
		$this->render(null, 'admissions');
		
	}
	
	function screen($id=null)
	{
		$meeting = $this->Meeting->read(null, $id);
		$this->set('meeting',
			$meeting
		);
		
		$this->set('posts', $this->refresh($id, true));
		
		$this->render(null, 'screen');
	}

	function screen_small($id=null)
	{
		$meeting = $this->Meeting->read(null, $id);
		$this->set('meeting',
			$meeting
		);
		
		$this->set('posts', $this->refresh($id, true));
		
		$this->render(null, 'screen');
	}


	/**
	 * Sends the AJAX response (turned into JSON in /views/meetings/view.ctp)
	 * for updating the meeting's table of posts.
	 * 
	 * Deprecated by Drew on 9.30.08 in favor of the new action that
	 * properly calculates scores. 
	 */
	// function refresh($id = null) {
	// 		if ($id != null) {  // TODO: what scenario w/o $id?
	// 			$this->set('d',
	// 				array(
	// 					'Post' => $this->Meeting->Post->find('all',
	// 						array(
	// 							'conditions' => array('Post.meeting_id' => $id),
	// 							'recursive' => 1,
	// 							'fields' => array(
	// 								'Post.id', 'Post.body', 'Post.created',
	// 								'User.name', 'User.affiliation'
	// 							),
	// 							'order' => 'Post.created DESC'
	// 						)
	// 					)
	// 				)
	// 			);
	// 		}
	// 		$this->render(null, 'ajax');
	// 	}
	
	
	
	// Compares posts and sorts them by their afterFind computed score.
	// (for now, deprecated because sorting is going to happen on the client side)
	function postScoreComparator($a, $b)
	{
		$aScore = $a['Post']['score'];
		$bScore = $b['Post']['score'];

		if($aScore==$bScore)
			return 0;
		else
			return ($aScore < $bScore) ? -1 : 1;
	}
	
	
	/**
	 * Prepares a list of the top posts in this meeting, as sorted by their score.
	 * only slightly different from the refresh action, but sorts differently
	 * and has a result limit.
	 * 
	 * @author Drew Harry
	 */
	function refresh($id = null, $return = false)
	{
		if($id!=null)
		{
			$results = Cache::read($id);
			
			if(!$results) {
				debug("Missed the cache!");
			$results = $this->Meeting->Post->find('all',
							array(
								'conditions' => array('Post.meeting_id' => $id),
								// 'fields' => array(
								// 	'Post.id', 'Post.body', 'Post.created',
								// 	'User.name', 'User.affiliation'),
								'recursive'=> 1,
								'order'=>'Post.created DESC',
								'limit'=>50
								)
							);
			} else {
				debug("Hit the results cache!");
			}
			debug("writing cache to " . $id);
			Cache::write($id, $results);
			// sorting by score is deprecated because the main DataTable is assuming
			// results come back sorted by age. We'll let that be and then
			// do the score sorting on the client side.
			
			// Now we need to sort these by their score. We can't do this in the original
			// find because that field is only applied in afterFind.
			// uasort($results, array(&$this,"postScoreComparator"));
			// 			
			// 			// Reverse it because uasort sorts from low to high.
			// 			$results = array_reverse($results);
			
			// Now we need to filter out all that extra information that we had to include
			// to properly calculate the score.
			$outputResults = array();
						
			// loop through each row and pull out just the posts and user fields.
			foreach($results as $row)
			{
				$outputResults[] = array("Post"=>$row["Post"], "User"=>$row["User"]);
			}
			
			// This is here because other controllers 
			if($return)
			{
				return $results;
			}
			
			// Otherwise, do the render normally.
			$this->set('d',
				array(
					'Post' => $outputResults
				)
			);
			
			// I think this forces it to ouse a different layout than it would normally,
			// so it doesn't try to wrap the json stuff with HTML junk.
			$this->render(null, 'ajax');
		}
	}

	function add($confId)
	{
		
		if(!isset($confId))
		{
			$conferenceSelected = false;
			$this->Cookie->write('Login.referrer', 'meetings/add', false);
			$this->redirect("/login"); exit();
	
		}
		else if ($this->Cookie->read('AdminConference.id') != $confId)
		{	
			$this->redirect("/meetings/add/".$this->Cookie->read('AdminConference.id'));
			
		}
		else {
			$conferenceSelected = true;
		}
			
		$this->set('conferenceSelected', $conferenceSelected);
		
		if (!empty($this->data))
		{
			// echo "HAVE POST DATA";
			
			// debug($this->data);
			
			// Do sanitation/validation here?
			
			$results = $this->Meeting->save($this->data);
			
//			debug($this->Meeting);
			
			// $this->redirect("/conferences/view/" . $this->Meeting->Conference->id);
			
			if(!empty($results))
			{
//				echo "redirecting to somewhere";
				
				$results = $this->Conference->findById($confId);
				$conference = $results["Conference"];
				
				if(!empty($conference))
				{
					$this->set('conference', $conference);
				}
				$this->render(null, 'form');
			}
		}
		else
		{
		// the add form needs to already know which conference it's being added to.
		$results = $this->Conference->findById($confId);
		$conference = $results["Conference"];
		
			if(!empty($conference))
			{
				$this->set('conference', $conference);
			}
		
		$this->render(null, 'form');
		}
	}
	
	function delete($id) {
		$this->Meeting->query("UPDATE meetings SET enabled='0' WHERE id=".$id.";");
		$this->render(null, 'ajax');
	}

	// 
	 function edit($id = null) {
		
		if (!$this->Cookie->read('AdminConference.id'))
		{	
	$this->redirect("/conferences/edit/".$this->Cookie->read('AdminConference.id'));
		}
		
	 	if (empty($this->data)) {
	 		$this->Post->id = $id;
	 		$this->data = $this->Post->read();
	 	}
	 	else {
	 		if ($this->Post->save($this->data['Post'])) {
	 			$this->flash('Your post has been updated.','/posts');
	 		}
	 	}
	}

}

?>