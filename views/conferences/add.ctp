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
                 <legend><?php __('Add Conference');?></legend>
  
         <table>
                 <tr><td><?php echo $form->input('name'); ?></td><td class="FieldDescription"> This is the name of that will be shown at the top of pages, eg Best Conference 2009.</td>
                         <td rowspan=4 width="350px">
                                 <h1>Read Me First!</h1>
                                         <p>Having your own backchannel is like having a plant — it takes lots of care and attention to grow up and provide a nice experience for the audience, presenters, and conference administrators. If you haven't already, you should take a look at our <a href="/pages/best-practices">advice about how to setup and use backchan.nl</a>. Integrating audience conversations in your event is a delicate balance that's much more about the expectations of your presenters and audience than it is about technology. Setting up an online space for conversation is just like trying to design an inviting coffee shop; comfy chairs and nice tables and internet access does not necessarily create the kind of space you imagine.</p>
                                         <p>So while you set up this system, consider these questions:</p>
                                         <ul>
                                                 <li>Is your audience going to have access to the system?</li>
                                                 <li>Are you going to have time to address the conversation on the backchannel?</li>
                                                 <li>Do your presenters/panelists want to hear from the audience?</li>
                                         </ul>
                                         <p>With that out of the way — enjoy your new backchan.nl! Hopefully it helps you create the kind of conversations you're looking for.</p>
                         </td></tr>
                         
                 <tr><td><?php echo $form->input('username');?></td><td class="FieldDescription"> This will be both your login name to administrate this conference as well as your subdomain, eg bc2009.</td></tr>
                 <tr><td><?php echo $form->input('password');?></td><td class="FieldDescription">The password to administrate the conference. This is the same password used for moderating individual sessions, so it should be something you're comfortable sharing with other people.</td></tr>
                 <tr><td><?php echo $form->input('email');?></td><td class="FieldDescription">The email address for the backchannel manager of this conference.</td></tr>
         
         </table>
 <?php echo $form->end('Create Conference');?>
 </fieldset>
  
 </div>