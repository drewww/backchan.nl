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
 * Cherrie's version which overrides cake/libs/view/scaffoldss/index.ctp
 */
?>
<div class="<?php echo $pluralVar;?> index">
<h2><?php echo $pluralHumanName;?></h2>
<p><?php
echo $paginator->counter(array(
'format' => 'Page %page% of %pages%, showing %current% records out of %count% total, starting on record %start%, ending on %end%'
));
?></p>
<table cellpadding="0" cellspacing="0">
<tr>
<?php foreach ($scaffoldFields as $_field):?>
	<th><?php echo $paginator->sort($_field);?></th>
<?php endforeach;?>
	<th><?php __('Actions');?></th>
</tr>
<?php
$i = 0;
foreach (${$pluralVar} as ${$singularVar}):
	$class = null;
	if ($i++ % 2 == 0) {
		$class = ' class="altrow"';
	}
echo "\n";
	echo "\t<tr{$class}>\n";
		foreach ($scaffoldFields as $_field) {
			$isKey = false;
			if(!empty($associations['belongsTo'])) {
				foreach ($associations['belongsTo'] as $_alias => $_details) {
					if($_field === $_details['foreignKey']) {
						$isKey = true;
						echo "\t\t<td>\n\t\t\t" . $html->link(${$singularVar}[$_alias][$_details['displayField']], array('controller'=> $_details['controller'], 'action'=>'view', ${$singularVar}[$_alias][$_details['primaryKey']])) . "\n\t\t</td>\n";
						break;
					}
				}
			}
			if($isKey !== true) {
				echo "\t\t<td>\n\t\t\t" . ${$singularVar}[$modelClass][$_field] . " \n\t\t</td>\n";
			}
		}

		echo "\t\t<td class=\"actions\">\n";
		echo "\t\t\t" . $html->link(__('View', true), array('action'=>'view', ${$singularVar}[$modelClass][$primaryKey])) . "\n";
	 	echo "\t\t\t" . $html->link(__('Edit', true), array('action'=>'edit', ${$singularVar}[$modelClass][$primaryKey])) . "\n";
	 	echo "\t\t\t" . $html->link(__('Delete', true), array('action'=>'delete', ${$singularVar}[$modelClass][$primaryKey]), null, __('Are you sure you want to delete', true).' #' . ${$singularVar}[$modelClass][$primaryKey]) . "\n";
		echo "\t\t</td>\n";
	echo "\t</tr>\n";

endforeach;
echo "\n";
?>
</table>
</div>
<div class="paging">
<?php echo "\t" . $paginator->prev('<< ' . __('previous', true), array(), null, array('class'=>'disabled')) . "\n";?>
 | <?php echo $paginator->numbers() . "\n"?>
<?php echo "\t ". $paginator->next(__('next', true) .' >>', array(), null, array('class'=>'disabled')) . "\n";?>
</div>
<div class="actions">
	<ul>
		<li><?php echo $html->link('New '.$singularHumanName, array('action'=>'add')); ?></li>
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