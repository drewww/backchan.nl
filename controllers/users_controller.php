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

App::import('Sanitize');  // TODO: Sanitize::clean($this->data) in all controllers
// TODO: in all controllers, don't do $this->set('d', $this->data), since sanitized,
//       $this->data may have been altered, so get data from database and then set
// TODO: Since '<' after Sanitize::clean() becomes '&lt;', string becomes longer.
//       May not be able to save all characters in string to DB, even
//       if when user entered data, it is within char limit.
//       If user name contains hyphen (-), it's turned into "&#45;" which is 5 chars.

class UsersController extends AppController {

	// var $scaffold;

	function add() {
		// $this->data stores the current request information,
		// it is empty if not submitted through a form, e.g.
		// type URL 'http://localhost/users/add' directly in browser
		if (!empty($this->data)) {
			// Clean data
			$this->data = Sanitize::clean($this->data);  // TODO: no start/trailing spaces?
			// Check if user already exists in DB
			$user = $this->User->find(
				array(
					'User.name' => $this->data['User']['name'],
					'User.affiliation' => $this->data['User']['affiliation']
				),
				array('User.id', 'User.name', 'User.affiliation'),
				null,
				0
			);
			if ($user == false) {  // User not already in DB
				if ($this->User->save($this->data)) {
					// Writes cookie in client browser
					$this->Cookie->write('User.id',
						$this->User->id,
						false,  // encrypt  // TODO: for production, true
						60 * 60 * 24 * 30  // expire [second], null means
						                   // end of session (browser closed)
					);
					$this->set('d', $this->data);
					// $this->set('p', $this->params);
				}
				else {
					$this->set('d',
						array('User' => array(
							'message' => 'Cannot add user!')
						)
					);
				}
			}
			else {  // User already in DB
				$this->Cookie->write('User.id',
					$user['User']['id'],
					false,  // encrypt  // TODO: for production, change to true
					60 * 60 * 24 * 30  // expire [second]
				);
				$this->set('d', $user);
			}
		}
		$this->render(null, 'ajax');
	}

}

?>