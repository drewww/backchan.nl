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
<?php
/**
 * Cherrie's version which overrides cake/libs/view/scaffoldss/edit.ctp
 */
?>
<div class="<?php echo $pluralVar;?> form">
<?php
	echo $form->create();
	echo $form->inputs(null, array('created', 'modified', 'updated'));
	echo $form->end(__('Submit', true));
?>
</div>
<div class="actions">
	<ul>
<?php if ($this->action != 'add'):?>
		<li><?php echo $html->link(__('Delete', true), array('action'=>'delete', $form->value($modelClass.'.'.$primaryKey)), null, __('Are you sure you want to delete', true).' #' . $form->value($modelClass.'.'.$primaryKey)); ?></li>
<?php endif;?>
		<li><?php echo $html->link(__('List', true).' '.$pluralHumanName, array('action'=>'index'));?></li>
<?php
		$done = array();
		foreach ($associations as $_type => $_data) {
			foreach($_data as $_alias => $_details) {
				if ($_details['controller'] != $this->name && !in_array($_details['controller'], $done)) {
					echo "\t\t<li>".$html->link(sprintf(__('List %s', true), Inflector::humanize($_details['controller'])), array('controller'=> $_details['controller'], 'action'=>'index'))."</li>\n";
					echo "\t\t<li>".$html->link(sprintf(__('New %s', true), Inflector::humanize(Inflector::underscore($_alias))), array('controller'=> $_details['controller'], 'action'=>'add'))."</li>\n";
					$done[] = $_details['controller'];
				}
			}
		}
?>
	</ul>
</div>