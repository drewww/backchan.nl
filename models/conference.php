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

class Conference extends AppModel {

	var $hasMany = array(
		'Meeting' => array(
			'dependent' => true  // Posts deleted when associated Meeting deleted
		)
	);

	// Validation done first when in controller $this->Conference->save($this->data)
	var $validate = array(
		'name' => VALID_NOT_EMPTY,
		'username' => array(  // Multiple rules per field
			'alphanumeric' => array(
				'rule' => 'alphaNumeric',
				'required' => true,  // $this->data must have this field
				'message' => 'Letters and numbers only'
			),
			'between' => array(
				'rule' => array('between', 3, 20),
				'message' => 'Between 3 and 20 characters'
			)
		),
		'password' => array(  // One rule per field
			'rule' => array('minLength', 6),
			'required' => true,
			'message' => 'Mimimum 6 characters long'
		),
		'email' => array(
			'rule' => array('email', true),
			'message' => 'Invalid email address'  // TODO: these msgs get displayed when scaffolding, should make them work for pages w/o scaffolding
		)
	);

	// var $displayField = 'name';  // for scaffolding, displayed in its related models
	
	function validateLogin($data) 
    {
	
		// Select from the conferences table the username and password and see if we find a match
		$conference = $this->find(array('username' => $data['username'], 'password' => $data['password']), array('id', 'name', 'username','password'));

		// If so, return the conference data for later use
		if (!empty($conference))
			return $conference['Conference'];

		return false;

    } 

}

?>