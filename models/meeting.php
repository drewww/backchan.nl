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

class Meeting extends AppModel {

	var $belongsTo = 'Conference';

	var $hasMany = array(
		'Post' => array(
			'dependent' => true  // Posts deleted when associated Meeting deleted
		)
	);

	var $validate = array(
		'conference_id' => array(
			'rule' => array('numeric'),
			'required' => true
		),
		'name' => VALID_NOT_EMPTY
		
		// TODO add validation on start and end fields. not sure how to handle DATETIME validation, so for now just leave it out. It's only used for output
		// at the moment, so it's okay if it's inaccurate or broken. 
		
	);
	
	function afterFind($results)
	{
		$output = array();

		foreach ($results as $key=>$val)
		{
			if ($val['Meeting']['enabled']=='1')
			{
				$output[] = $results[$key];
			}
		}
		
		return $output;
	}

	// var $displayField = 'name';

}

?>