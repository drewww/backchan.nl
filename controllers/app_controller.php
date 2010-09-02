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

/**
 * Cherrie's version which overrides cake/libs/controller/app_controller.php
 * (this file can also be placed one level up in the app folder)
 */
class AppController extends Controller {

	var $components = array('Cookie');

	// 'Javascript' is necessary, so can use $javascript->link(...) in views
	var $helpers = array('Html', 'Form', 'Javascript', 'Ajax', 'Time');

	// Overwrite Cake's default cookie name "CakeCookie" in CookieComponent
	function beforeFilter() {
		$this->Cookie->name = 'backchannl';
	}

}

?>