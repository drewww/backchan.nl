/**
  * backchan.nl
  * 
  * Copyright (c) 2006-2009, backchan.nl contributors. All Rights Reserved
  * 
  * The contents of this file are subject to the BSD License; you may not
  * use this file except in compliance with the License. A copy of the License
  * is available in the root directory of the project.
  */

// This is a really simple function used for my home-grown image switcher
// widget that I use on the front page of the site. 

function changeBackground(path, imageId, targetId)
{
	var target = document.getElementById(targetId);
	target.src = path;

	// Also, grab the alt text from the image and make that the caption.
	var image = document.getElementById(imageId);
	var caption = document.getElementById(targetId + "-caption");

	caption.innerHTML = image.alt;
}