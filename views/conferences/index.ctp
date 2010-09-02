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
<div class="conferences index">
<h2><?php __('Conferences');?></h2>
<p>
<?php
echo $paginator->counter(array(
'format' => __('Page %page% of %pages%, showing %current% records out of %count% total, starting on record %start%, ending on %end%', true)
));
?></p>
<table cellpadding="0" cellspacing="0">
<tr>
	<th><?php echo $paginator->sort('id');?></th>
	<th><?php echo $paginator->sort('name');?></th>
	<th><?php echo $paginator->sort('username');?></th>
	<th><?php echo $paginator->sort('password');?></th>
	<th><?php echo $paginator->sort('email');?></th>
	<th><?php echo $paginator->sort('created');?></th>
	<th><?php echo $paginator->sort('modified');?></th>
	<th class="actions"><?php __('Actions');?></th>
</tr>
<?php
$i = 0;
foreach ($conferences as $conference):
	$class = null;
	if ($i++ % 2 == 0) {
		$class = ' class="altrow"';
	}
?>
	<tr<?php echo $class;?>>
		<td>
			<?php echo $conference['Conference']['id']; ?>
		</td>
		<td>
			<?php echo $conference['Conference']['name']; ?>
		</td>
		<td>
			<?php echo $conference['Conference']['username']; ?>
		</td>
		<td>
			<?php echo $conference['Conference']['password']; ?>
		</td>
		<td>
			<?php echo $conference['Conference']['email']; ?>
		</td>
		<td>
			<?php echo $conference['Conference']['created']; ?>
		</td>
		<td>
			<?php echo $conference['Conference']['modified']; ?>
		</td>
		<td class="actions">
			<?php echo $html->link(__('View', true), array('action'=>'view', $conference['Conference']['id'])); ?>
			<?php echo $html->link(__('Edit', true), array('action'=>'edit', $conference['Conference']['id'])); ?>
			<?php echo $html->link(__('Delete', true), array('action'=>'delete', $conference['Conference']['id']), null, sprintf(__('Are you sure you want to delete # %s?', true), $conference['Conference']['id'])); ?>
		</td>
	</tr>
<?php endforeach; ?>
</table>
</div>
<div class="paging">
	<?php echo $paginator->prev('<< '.__('previous', true), array(), null, array('class'=>'disabled'));?>
 | 	<?php echo $paginator->numbers();?>
	<?php echo $paginator->next(__('next', true).' >>', array(), null, array('class'=>'disabled'));?>
</div>
<div class="actions">
	<ul>
		<li><?php echo $html->link(__('New Conference', true), array('action'=>'add')); ?></li>
		<li><?php echo $html->link(__('List Meetings', true), array('controller'=> 'meetings', 'action'=>'index')); ?> </li>
		<li><?php echo $html->link(__('New Meeting', true), array('controller'=> 'meetings', 'action'=>'add')); ?> </li>
	</ul>
</div>
