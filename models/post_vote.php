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

class PostVote extends AppModel {

	var $belongsTo = array('Post', 'User');

	var $validate = array(
		'post_id' => VALID_NOT_EMPTY,
		'user_id' => VALID_NOT_EMPTY,
		'value' => array(
			'rule' => array('inList', array('1', '-1')),
			'message' => 'Invalid vote value'
			// 'comparison' => array(
			// 	'rule' => array('comparison', '<=', 1),
			// 	'message' => 'Invalid vote value'
			// )
		)
	);
	
	// This units of this factor are points/second. It controls how quickly vote scores rise
	// over time. The formula here is that we want the score to go up by one point every
	// twenty minutes (as a starting point, anyway - we'll tweak with experimenting.
	public static $VOTE_SCORE_FACTOR = 0.000833333333;  // 1 / (60*20);
	public static $BASE_VOTE_SCORE = 1;
	
	
	// A utility method for calculating how much a vote is worth. In this scoring
	// model, this is purely a function of a vote's age.
	//
	// $vote is an array like it would come from the database.
	// $basetime is a sql datetime of when this meeting started.
	public static function calculateVoteValue($vote, $baseTime)
	{
		$age = strtotime($vote['created']) - strtotime($baseTime);
		
		return PostVote::$BASE_VOTE_SCORE + $age*PostVote::$VOTE_SCORE_FACTOR;
	}

}

?>