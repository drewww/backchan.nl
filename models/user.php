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

class User extends AppModel {

	var $hasMany = array(
		'Post' => array(
			'dependent' => true  // Posts deleted when associated Meeting deleted
		),
		'PostVote' => array(
			'dependent' => true  // Posts deleted when associated Meeting deleted
		),
		'PostReply' => array(
			'dependent' => true  // Posts deleted when associated Meeting deleted
		)
	);

	// TODO: $validate in models are used to validate data before saving to DB,
	//       can it be used if not saving to DB?
	var $validate = array(
		'name' => array(
			'rule' => array('maxLength', 32),
			'required' => true,
			'allowEmpty' => false,
			'message' => 'Maximum 32 characters'
		),
		'affiliation' => array(
			'rule' => array('maxLength', 64),
			'required' => true,
			'allowEmpty' => true,
			'message' => 'Maximum 64 characters'
		)
	);

	// var $displayField = 'name';

}

?>