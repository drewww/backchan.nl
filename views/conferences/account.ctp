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
?>
<div class="conferences form">
<?php echo $form->create('Conference');?>
	<fieldset>
 		<legend><?php __('Edit Conference');?></legend>

	<table>
		<tr><td><?php echo $form->input('name'); ?></td><td class="FieldDescription"> This is the name of that will be shown at the top of pages, eg Best Conference 2009.</td>
		<tr><td><?php echo $form->input('username');?></td><td class="FieldDescription"> This will be both your login name to administrate this conference as well as your subdomain, eg bc2009.</td></tr>
		<tr><td><?php echo $form->input('password');?></td><td class="FieldDescription">The password to administrate the conference. This is the same password used for moderating individual sessions, so it should be something you're comfortable sharing with other people.</td></tr>
		<tr><td><?php echo $form->input('email');?></td><td class="FieldDescription">The email address for the backchannel manager of this conference.</td></tr>
	
	</table>
<?php echo $form->end('Create Conference');?>
</fieldset>

</div>