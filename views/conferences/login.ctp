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
?>
<?php $this->pageTitle = 'Login'; ?>
<div class="conferences form">
<?php echo $form->create('Conference', array('action' => 'login'));?>
	<fieldset>
 		<legend><?php __('Login');?></legend>

	<table>
		<tr><td><?php echo $form->input('username');?></td></tr>
		<tr><td><?php echo $form->input('password');?></td></tr>	
	</table>
<?php echo $form->end('Login');?>
</fieldset>

</div>