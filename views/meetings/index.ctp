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
<div class="meetings index">
<h2><?php __('Meetings');?></h2>
<p>
<?php
echo $paginator->counter(array(
'format' => __('Page %page% of %pages%, showing %current% records out of %count% total, starting on record %start%, ending on %end%', true)
));
?></p>
<table cellpadding="0" cellspacing="0">
<tr>
	<th><?php echo $paginator->sort('id');?></th>
	<th><?php echo $paginator->sort('conference_id');?></th>
	<th><?php echo $paginator->sort('name');?></th>
	<th><?php echo $paginator->sort('start');?></th>
	<th><?php echo $paginator->sort('end');?></th>
	<th><?php echo $paginator->sort('created');?></th>
	<th><?php echo $paginator->sort('modified');?></th>
	<th class="actions"><?php __('Actions');?></th>
</tr>
<?php
$i = 0;
foreach ($meetings as $meeting):
	$class = null;
	if ($i++ % 2 == 0) {
		$class = ' class="altrow"';
	}
?>
	<tr<?php echo $class;?>>
		<td>
			<?php echo $meeting['Meeting']['id']; ?>
		</td>
		<td>
			<?php echo $html->link($meeting['Conference']['name'], array('controller'=> 'conferences', 'action'=>'view', $meeting['Conference']['id'])); ?>
		</td>
		<td>
			<?php echo $meeting['Meeting']['name']; ?>
		</td>
		<td>
			<?php echo $meeting['Meeting']['start']; ?>
		</td>
		<td>
			<?php echo $meeting['Meeting']['end']; ?>
		</td>
		<td>
			<?php echo $meeting['Meeting']['created']; ?>
		</td>
		<td>
			<?php echo $meeting['Meeting']['modified']; ?>
		</td>
		<td class="actions">
			<?php echo $html->link(__('View', true), array('action'=>'view', $meeting['Meeting']['id'])); ?>
			<?php echo $html->link(__('Edit', true), array('action'=>'edit', $meeting['Meeting']['id'])); ?>
			<?php echo $html->link(__('Delete', true), array('action'=>'delete', $meeting['Meeting']['id']), null, sprintf(__('Are you sure you want to delete # %s?', true), $meeting['Meeting']['id'])); ?>
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
		<li><?php echo $html->link(__('New Meeting', true), array('action'=>'add')); ?></li>
		<li><?php echo $html->link(__('List Conferences', true), array('controller'=> 'conferences', 'action'=>'index')); ?> </li>
		<li><?php echo $html->link(__('New Conference', true), array('controller'=> 'conferences', 'action'=>'add')); ?> </li>
		<li><?php echo $html->link(__('List Posts', true), array('controller'=> 'posts', 'action'=>'index')); ?> </li>
		<li><?php echo $html->link(__('New Post', true), array('controller'=> 'posts', 'action'=>'add')); ?> </li>
	</ul>
</div>
