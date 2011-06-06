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
<?php
/**
 * Cherrie's version which overrides cake/libs/view/layouts/default.ctp
 */
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<?php echo $html->charset(); ?>
	<title>
		<?php
			__('backchan.nl -- ');
			echo $title_for_layout; // $$$$$$$$$
		?>
	</title>
	<?php
		/**********************************************************************
		 * YUI                                                                *
		 **********************************************************************/
		//  css -----------------------------------------------------------
		//  $html comes from CakePHP's built-in Html Helper
		//  looks for files to import in app/webroot/css/ by default
		echo $html->css(
			array(
				'yui/build/fonts/fonts-min.css',
				'yui/build/container/assets/skins/sam/container.css',
				'yui/build/button/assets/skins/sam/button.css'
			)
		);
		//  js ------------------------------------------------------------
		//  $javascript comes from CakePHP's built-in Javascript Helper
		//  looks for files to import in app/webroot/js/ by default
		//  Our problem:
		//      Since I place the entire YUI (incl. CSS and JavaScript)
		//      inside app/vendors/js/, I need a way to tell CakePHP to
		//      look for files there as well. Luckily, I found a file
		//      vendors.php at app/webroot/js/vendors.php. In it, however,
		//      it says, "readfile('../../vendors/javascript/'.$file);"
		//      so I created a javascript folder app/vendors/javascript/,
		//      but it didn't work until I changed it to app/vendors/js/.
		echo $javascript->link(
			array(
				'yui/build/utilities/utilities.js',
				'yui/build/container/container-min.js',
				'yui/build/button/button-min.js',
				'yui/build/yahoo-dom-event/yahoo-dom-event.js',
				'yui/build/container/container_core-min.js',
				'yui/build/yahoo/yahoo-min.js',
				'yui/build/dom/dom-min.js',
				'yui/build/event/event-min.js',
				'yui/build/element/element-beta-min.js',
				'yui/build/connection/connection-min.js'
			)
		);
	?>
	<?php
		echo $html->css(array('cake.generic', 'backchannl.generic'));
		echo $scripts_for_layout; // $$$$$$$$$
	?>
</head>
<body class="yui-skin-sam">
	<div id="container">
		<div id="header">
			<h2>
				<?php
					echo $html->link(
						__('backchan.nl - participate at http://backchan.nl/', true),
						'http://backchan.nl/'
					);
				?>
			</h2>
		</div>
		<div id="content">
			<?php
				echo $content_for_layout; // $$$$$$$$$
			?>
		</div>
		<div id="footer">
			<?php
				// echo $html->link(
				// 	$html->image('cake.power.gif',
				// 		array(
				// 			'alt' => __("CAKEPHP POWER", true),
				// 			'border' => "0"
				// 		)
				// 	),
				// 	'http://www.cakephp.org/',
				// 	array('target' => '_new'),
				// 	null,
				// 	false
				// );
			?>
			<a href="http://backchan.nl">backchan.nl</a> is an <a href="http://github.com/drewww/backchan.nl" title="The backchan.nl project is hosted at Github">open source project</a> from the <a href="http://media.mit.edu">MIT Media Lab</a>, designed by <a href="http://web.media.mit.edu/~dharry">Drew Harry</a> with <a href="http://trevorfilter.com/">Trevor Filter</a>, Cherrie Yang, and Joshua Green.
		</div>
	</div>
</body>
</html>