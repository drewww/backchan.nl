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

class PostReply extends AppModel {

	var $belongsTo = array('Post', 'User');

	var $validate = array(
		'body' => VALID_NOT_EMPTY
	);

}

?>