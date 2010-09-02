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

class PostEvent extends AppModel {

	var $belongsTo = 'Post';

	var $validate = array(
		'event_type' => VALID_NOT_EMPTY,
		// Do I need to do this, or does the belongsTo field automatically check this?
		'post_id' => VALID_NUMBER
	);

}

?>