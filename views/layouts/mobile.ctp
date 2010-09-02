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
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
 "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>

<?php echo $html->charset(); ?>
<meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;" />

<title>backchan.nl</title>

<?php
	// echo $html->css(array('cake.generic', 'backchannl.generic'));
	// echo $scripts_for_layout; // $$$$$$$$$
?>

<script type="text/javascript" src="/js/xui.min.js"></script>

<script type="text/javascript">

var frames = [];
var currentFrame = null;
var currentHash = null;
var meetingId;

window.onload = function(){
	
	function frame(name,title,loadCallback,unloadCallback){
		
		this.name = name;
		this.title = title;

		if (name == "identity") this.content = '<form id="identify" action=""><label for="name">What&#8217;s your name?</label><input id="name" type="text" /><label for="affil">Where are you from? <span>Company or place</span></label><input id="affil" type="text" /><div class="buttons"><button id="submitIdentity" type="submit" class="gloss">Continue</button></div><div id="intro"><strong>backchan.nl</strong> is an <a href="https://launchpad.net/backchan.nl" title="The backchan.nl Bazaar project is hosted at Launchpad">open source project</a> from the <a href="http://media.mit.edu">MIT Media Lab</a>, designed by <a href="http://web.media.mit.edu/~dharry">Drew Harry</a> with <a href="http://trevorfilter.com/">Trevor Filter</a>, Cherrie Yang, and Joshua Green.</div></form>';
		
		else if (name == "conference") this.content = document.getElementById('meetingsData').innerHTML;
		
		else if (name == "meeting") {
			this.content = '<div id="postContainer"><form id="postForm" action="#" method="post"><textarea id="postContent" disabled="disabled"></textarea><button id="submitPost" type="submit">Post</button><p>Have something to say?</p></form></div><div id="meetingsContainer"></div>';
		}
		
		var c = document.getElementById('content');

		this.load = function(){
			
			if (frames.length == 0) { c.innerHTML = ''; }
			
			var li = document.createElement('li');
			li.setAttribute('id',name);
			li.style.width = window.innerWidth + "px";
			li.innerHTML = this.content;
			c.appendChild(li);
			
			currentFrame = this; frames.push(this);
			
			if (this.name == "meeting")
				this.title = document.getElementById("mtg" + meetingId).getElementsByTagName('strong')[0].innerHTML;
			
			setViewport(); setBackButton(); setTitle(); setHash();
			
			window.scrollTo(0,0); loadCallback();
		}

		this.insert = function(){
			
			if (frames.length == 0) { c.innerHTML = ''; }
			
			var li = document.createElement('li');
			li.setAttribute('id',name);
			li.style.width = window.innerWidth + "px";
			li.innerHTML = this.content;
			c.appendChild(li);
			
			currentFrame = this; frames.push(this);
			
			loadCallback();
		}
		
		this.unload = function(){

			c.removeChild(document.getElementById(this.name));

			currentFrame = frames[frames.indexOf(this)-1];
			frames.splice(frames.indexOf(this), 1);
				
			setTitle();
			
			setViewport(); setBackButton(); setHash();
			
			// window.scrollTo(0,0); // Still deciding if I want this to work like this
			unloadCallback();
			
		}

	}
	
	function button(val,id,clickFunction){
		
		this.id = id;
		this.active = false;
		var b = document.createElement('button');
		b.setAttribute('id',id);
		b.innerHTML = val;
		document.body.appendChild(b);
		b.style.display = 'none';
		
		this.enable = function(){
			
			document.getElementById(this.id).style.display = 'block';
			document.getElementById(this.id).addEventListener("click",clickFunction,false);
			
		}
		
		this.disable = function(){
	
			document.getElementById(this.id).removeEventListener("click",clickFunction,false);
			document.getElementById(this.id).style.display = 'none';
		}
		
	}
	
	var submitButton = new button('Post','submit_button',function(){
		p = document.getElementById('postContainer');
		if (p.style.display=='none') showPost();
		else { hidePost(); }
	});
	
	var backButton = new button(null,'back_button',function(){
		if (currentFrame.name != "identity") currentFrame.unload();
	});
	
	function setHash(){
		if (currentFrame.name=="identity") window.location.hash = "#iden";
		else if (currentFrame.name=="conference") window.location.hash = "#conf";
		else if (currentFrame.name=="meeting") window.location.hash = "#m" + meetingId;
		currentHash = window.location.hash;
	}
	
	function setBackButton(){
		if (currentFrame.name == 'identity') backButton.disable();
		else if (currentFrame.name == 'conference') { backButton.enable();
			document.getElementById('back_button').setAttribute('class','conference');
		} else if (currentFrame.name == 'meeting') { backButton.enable();
			document.getElementById('back_button').setAttribute('class','meeting');
		}
	}
	
	var identity = new frame("identity","Welcome to backchan.nl",function(){
		
		x$('#identify').on( 'submit', function(e){
			e.preventDefault();
			var n = document.getElementById('name')
			var a = document.getElementById('affil')
			n.blur(); a.blur(); n = n.value; a = a.value;
			if (n == "") alert("Please enter a name to continue.");
			else {				
				var data = "data%5BUser%5D%5Bname%5D="+n+"&data%5BUser%5D%5Baffiliation%5D="+a;
				x$('document').xhr('/users/add',{
					data:data, method:"post", async:true, callback:function(){
						var r = eval("(" + this.responseText + ")");
						if (r.User.name) {
							conference.load();
						} else if (r.User.message)
							alert(r.User.message);
					}});
			}
		});

	},function(){ null });
	
	var conference = new frame("conference",conferenceName,function(){
		
		x$('#conference a').on( 'click', function(e){
			e.preventDefault();
			meetingId = this.getAttribute('href').replace(/#/g,"");
			meeting.load();
		});
		
	},function(){ null });
	
	var meeting = new frame("meeting",null,function(){
			view.reload();
			document.getElementById('postContainer').style.display = 'none';
		},function(){ submitButton.disable(); document.getElementById('submit_button').innerHTML = 'Post'; });

	function view(){
		
		this.reload = function(){
			
			var isPosts = true;
			
			submitButton.enable();

			document.getElementById('meetingsContainer').innerHTML = 
				'<div id="top-posts"></div><div id="upcoming"></div>';
	
			x$('document').xhr('/meetings/refresh/'+meetingId,{
				async:false, callback:function(){
					var data = eval('(' + this.responseText + ')');
					data.Post.sort(sortByRank); data.Post.reverse();
					
					if (data.Post.length == 0) isPosts = false;
					
					var ol = document.createElement('ol');
					
					if (isPosts) {
					
						var h = document.createElement('h2');
						h.innerHTML = '<div></div><span>Top Posts</span>';
						document.getElementById('top-posts').appendChild(h);
						
						if (data.Post.length < 8) var max = data.Post.length;
						else var max = 8;
						for (var i=0;i<max;i++) { // Limit to 8 top posts
							var li = createPost('top',data.Post[i],i);
							ol.appendChild(li);
						}
					
					} else {
						
						var li = document.createElement('li');
						li.setAttribute('class','noposts');
						li.innerHTML = 'There are no posts yet.<br />Why don&#8217;t you create one?';
						ol.appendChild(li);
						
					}
								       		
					document.getElementById('top-posts').appendChild(ol);
				       		
				}});
			
			if (isPosts) {
			
				x$('document').xhr('/meetings/refresh/'+meetingId,{
					async:false, callback:function(){
						var data = eval('(' + this.responseText + ')');
						
						var h = document.createElement('h2');
						h.innerHTML = '<div></div><span>Upcoming</span>';
						document.getElementById('upcoming').appendChild(h);
						
						var ol = document.createElement('ol');
						
						// TO DO: Pagination of upcoming posts and/or say "More posts on main site"
						if (data.Post.length < 100) var max = data.Post.length;
						else var max = 100;
						for (var i=0;i<max;i++) {
							var li = createPost('upcoming',data.Post[i],i);
							ol.appendChild(li);
						}
						
						document.getElementById('upcoming').appendChild(ol);
					}});
			
			}
			
			x$('#meetingsContainer a').on( 'click', function(e){
				e.preventDefault();
				vote(this.parentNode.getAttribute("rel"),this.getAttribute("class"));
			});
		}
	}

	var view = new view();
	
	loadThatFrame(); // <-- This is where hashes get dispatched
	
	setInterval(loadThatFrame,100);
	
	function loadThatFrame(){

		if (currentHash == null) {
			
			if (document.cookie.indexOf("backchannl[User][id]")==-1) {
				identity.load();
			} else if (window.location.hash.indexOf('m')!=-1) {
				identity.insert(); conference.insert();
				meetingId = parseInt(window.location.hash.substring(2, window.location.hash.length));
				meeting.load();
			} else {
				identity.insert(); conference.load();
			}

		} else if (currentHash != window.location.hash) {
			
			if (currentFrame.name == "identity") {
				if (window.location.hash == "#conf") conference.load();
			} else if (currentFrame.name == "conference") {
				if (window.location.hash == "#iden") conference.unload();
				else if (window.location.hash.indexOf('m')!=-1) {
					meetingId = parseInt(window.location.hash.substring(2, window.location.hash.length));
					meeting.load(); }
			} else if (currentFrame.name == "meeting") {
				if (window.location.hash == "#conf") meeting.unload();
			}
			
		}

	}
	
	function submitPost(e){
		e.preventDefault();
		var p = document.getElementById('postContent');
		var data = "data%5BPost%5D%5Bbody%5D="+p.value+"&data%5BPost%5D%5Bmeeting_id%5D="+meetingId;
		x$('document').xhr('/posts/add',{
			data:data, method:"post", async:true, callback:function(){
				var r = eval("(" + this.responseText + ")");
				if (r.Post.body) { hidePost(); view.reload(); }
				else if (r.Post.message) alert(r.Post.message);
			}});		
	}
	
	function scrollPost(){
		if(document.body.className == 'landscape') window.scrollTo(0,44);
	}
	
	function showPost(){
		var p = document.getElementById('postContent');
		document.getElementById('submit_button').innerHTML = 'Close';
		document.getElementById('postContainer').style.display = "block";
		p.addEventListener('focus',scrollPost,false);
		p.disabled = false; p.focus();		
		document.getElementById('postForm').addEventListener('submit',submitPost,false);
	}
	
	function hidePost(){
		var p = document.getElementById('postContent');
		p.blur(); p.value = ""; p.disabled = true;
		p.removeEventListener('focus',scrollPost,false);
		document.getElementById('postForm').removeEventListener('submit',submitPost,false);
		document.getElementById('postContainer').style.display = "none";
		document.getElementById('submit_button').innerHTML = 'Post';
	}
	
	setTimeout(function(){ window.scrollTo(0,1); }, 100);

	setInterval(function(){ if (currentFrame.name == "meeting") view.reload(); }, 30000);

		// Reload the meetings view every 30 secs
	
	setOrientation();
	
	var orientationSupported = "onorientationchange" in window,
	    oEvent = orientationSupported ? "orientationchange" : "resize";
	
	window.addEventListener(oEvent, setOrientation, false);
	// window.onorientationchange = setOrientation;

	function setOrientation(){
		var orientation = window.orientation;
		switch(orientation){
			case 0: document.body.setAttribute('class','portrait'); break;
			case 90: document.body.setAttribute('class','landscape'); break;
			case -90: document.body.setAttribute('class','landscape'); break;
		} setViewport(); setTitle();
	}
	
	function setViewport(){
		var c = document.getElementById('content');
		c.style.marginLeft = - ((frames.indexOf(currentFrame)) * window.innerWidth) + "px";
		var lis = [];
		for (var i=0;i<c.childNodes.length;i++)
			if (c.childNodes.item(i).nodeName == "LI") lis.push(c.childNodes.item(i));
		for (var i=0;i<lis.length;i++) lis[i].style.width = window.innerWidth + "px";		
	}
	
	function sortByRank(a,b){
		return a.Post.score - b.Post.score;
	}
	
	function setTitle(){
		var title = currentFrame.title; var maxChars = 14;
		if (document.body.className == "landscape") var maxChars = 28;
		if (currentFrame.name == "conference") maxChars += 2;
		if (currentFrame.name != "identity" && title.length > maxChars+2) title = title.substring(0,maxChars) + "...";
		document.getElementsByTagName('h1')[0].innerHTML = title;
	}
	
	function createPost(type,data,i){

		var li = document.createElement('li');
	    
		var v = document.createElement('div');
		v.setAttribute('rel',data.Post.id);
		v.className = 'voting';
	    
		var vu = document.createElement('a');
		vu.setAttribute('href','#');
		vu.setAttribute('class','voteUp');
		vu.appendChild(document.createTextNode(data.Post.pos_votes));
		v.appendChild(vu);
	    
		var vd = document.createElement('a');
		vd.setAttribute('href','#');
		vd.setAttribute('class','voteDn');
		vd.appendChild(document.createTextNode(data.Post.neg_votes));
		v.appendChild(vd);
		
		var vs = document.createElement('p');
		v.appendChild(vs);
		
		var r = document.createElement('strong');
	
		if (type == 'top') {
			r.className = 'rank';
			r.appendChild(document.createTextNode('#'+(i+1)));
		} else if (type == 'upcoming') {
			r.className = 'time';
			var time = data.Post.created.substring(11,16);
			// Some simple meridian conversion
			var hours = time.substring(0,2); var ampm = "a";
			if (hours == 0) hours = 12;
			else if (hours < 10) hours = hours.substring(1,2);
			else if (hours > 12) { hours -= 12; ampm = "p"; }
			// Pull it all together and insert
			var time = "" + hours + time.substring(2,5) + ampm;
			r.appendChild(document.createTextNode(time));
		}
		
		var p = document.createElement('p');
		p.innerHTML = data.Post.body;
		// Use innerHTML for HTML entities, even though it's slightly slower (on the iPhone)
		var a = document.createElement('div');
		a.className = 'author';
		var affil = ""; if (data.User.affiliation != '') affil = ', ' + data.User.affiliation;
		a.innerHTML = '&mdash; ' + data.User.name + affil;
		p.appendChild(a);
	    
		li.appendChild(v);
		li.appendChild(r);
		li.appendChild(p);
		
		return li;
		
	}
	
	function vote(postId,action){
	
		if (action == "voteUp") var val = 1;
		else if (action == "voteDn") var val = -1;
		var data = "data%5BPostVote%5D%5Bpost_id%5D="+postId+"&data%5BPostVote%5D%5Bvalue%5D="+val;
		
		x$('document').xhr('/post_votes/add',{
			data:data, method:"post", async:true, callback:function(){
				var r = eval("(" + this.responseText + ")");
				if (r.PostVote.value) view.reload();
				else if (r.PostVote.message) alert(r.PostVote.message);
			}});

	}

}


</script>

<?php echo $scripts_for_layout; ?>

<style>

* {
	margin: 0; padding: 0; border: 0; outline: 0;
	font-weight: inherit; font-style: inherit;
	font-size: 100%; font-family: inherit;
	vertical-align: baseline;
}

body {
	background: #fff;
	font: 100%/1.3 Helvetica, Arial, sans-serif;
	min-height: 416px;
	-webkit-text-size-adjust: none;
	color: #333;
	overflow: auto;
}

body.landscape {
	min-height: 268px;
}

strong {
	font-weight: bold;
}

h1 {
	background: -webkit-gradient(linear, left top, left bottom, from(#b2bcc8), to(#72849c));
	height: 42px;
	border-top: 1px solid #ccd6e0;
	border-bottom: 1px solid #2a3748;
	text-shadow: #505c6c 0 -1px .05em;
	text-align: center;
	font-weight: bold;
	font-size: 125%;
	line-height: 2.2;
	color: #fff;
	z-index: 98;
}

h2 {
	position: relative;
	z-index: 90;
}

h2, dt {
	font-weight: bold;
}

h2 div, dt div {
	background: -webkit-gradient(linear, left top, left bottom, from(#929eab), to(#b9c0c6));
	height: 1.4em;
	border-top: 1px solid #a3b1be;
	border-bottom: 1px solid #999fa2;
}

h2 span, dt span {
	display: block;
	margin-top: -1.4em;
	padding: .1em 10px 0;
	text-shadow: #666 1px 1px 0;
	font-weight: bold;
	color: #fff;
}

#meetings dd {
	position: relative;
	border-bottom: 1px solid #bbb;
}

#meetings dd a {
	display: block;
	padding: .5em 10px;
	text-decoration: none;
	font-weight: bold;
	font-size: 120%;
	color: #000;
}

#meetings dd span.date {
	display: block;
	font-weight: normal;
	font-size: 70%;
	color: #999;
}

#content li {
	display: block;
	float: left;
}

#meeting ol {
	margin-bottom: -1px;
}

#meeting ol li {
	float: none;
	padding: .75em 10px .5em;
	border-bottom: 1px solid #bbb;
	list-style: none;
	font-size: 86%;
	-webkit-text-size-adjust: none;
	color: #333;
}

#meeting ol li.noposts {
	font-size: 120%;
	font-weight: bold;
	border-bottom: none;
	text-align: center;
	padding: 4.4em 24px 2.4em;
	color: #999;
}

li .rank, li .time {
	float: left;
	margin: 0 5px 0 -10px;
	padding: 0 0 0 10px;
	font-weight: bold;
	text-shadow: #eee 1px 1px 0;
	color: #13396b;
}

li .rank {
/*	font-size: 120%;
	line-height: 1;*/
}

li .voting {
	background: #f5f5f5;
	float: right;
	margin: -.75em -10px -.5em 10px;
	padding: .75em 10px .25em 10px;
}

li .voting a {
	background: url(/img/mobile_sprites.gif) no-repeat 7px center, 
		-webkit-gradient(linear, left top, left bottom, from(#fff), to(#ccc));
	display: block;
	padding: .25em 9px .25em 28px;
	border: 1px solid #999;
	font-size: 140%;
	-webkit-border-radius: 6px;
	text-decoration: none;
	color: #666;
}

li .voting a.voteDn {
	background: url(/img/mobile_sprites.gif) no-repeat -93px center, 
		-webkit-gradient(linear, left top, left bottom, from(#fff), to(#ccc));
}

#meeting li:after {
	content: ".";
	display: block;
	clear: both;
	visibility: hidden;
	line-height: 0;
	height: 0;
}

body.portrait li .voting a {
	margin: 0 0 8px;
}

body.landscape li .voting a {
	margin: 0 0 8px -1px;
	-webkit-border-radius: 0;
	-webkit-border-top-right-radius: 6px;
	-webkit-border-bottom-right-radius: 6px;
	display: inline-block;
}

body.landscape li .voting a:first-child {
	-webkit-border-radius: 0;
	-webkit-border-top-left-radius: 6px;
	-webkit-border-bottom-left-radius: 6px;
}

li .author {
	margin: .25em 0;
	font-size: 86%;
	color: #999;
}

/* Post form */

#postContainer {
	background: -webkit-gradient(linear,left top,left bottom,color-stop(0.65, #ddd), color-stop(1, #fff));;
	width: 100%;
	display: none;
	border-bottom: 1px solid #ccc;
	text-align: right;
}

#postForm {
	overflow: auto;
	padding: 0 0 .25em;
}

#postForm p {
	float: left;
	font-size: 80%;
	padding: 1.4em 10px 0;
	color: #666;
}

#postContent {
	display: block;
	width: 100%;
	height: 6em;
	margin-bottom: -.3em !important;
	padding: .5em 6px;
	border-bottom: 1px solid #aaa;
	text-align: left;
	font-size: 100%;
}

body.landscape #postContent {
	height: 2em;
}

#postForm button {
	margin-right: 8px;
	font-size: 80%;
}

/* Identity */

#identity form {
	background: -webkit-gradient(linear, left top, left bottom, color-stop(.8,#ddd), color-stop(1,#fff));
	min-height: 362px;
	margin: 0;
	padding: .65em 18px 0;
}

#identity #intro {
	background: -webkit-gradient(linear, left top, left bottom, color-stop(0,#d3d3d3), color-stop(1,#fff));
	border-top: 1px solid #aaa;
	margin: 8em -18px 0;
	padding: 1em 22px 1.5em;
	font-size: 75%;
	line-height: 1.5;
	color: #666;
}

#identity #intro a:link, #identity #intro a:visited,
#identity #intro a:hover, #identity #intro a:active {
	color: #666;
}

body.landscape #identity form {
	min-height: 200px;
}

body.landscape #identity #intro {
	margin-top: 1.2em;
}

label {
	display: block;
	width: 100%;
	margin: .5em 0 .1em;
	font-weight: bold;
	font-size: 90%;
	color: #444;
	text-shadow: #ddd 1px 1px 0;
}

label span {
	float: right;
	font-weight: normal;
}

input {
	background: #f5f5f5;
	width: 97%;
	margin: .25em 0 .25em;
	padding: .25em 4px;
	font-size: 120%;
	border: 1px solid #aaa;
}

.buttons {
	width: 100%;
	text-align: right;
}

button {
	background: -webkit-gradient(linear,left top,left bottom,from(#aab4c0),to(#76869c));
	margin: 1em 0 .5em;
	padding: .5em 2px;
	-webkit-border-radius: 4px;
	border: 1px solid #666;
	font-weight: bold;
	font-size: 86%;
	text-shadow: #666 1px 1px 0;
	color: #fff;
}

#submit_button {
	background: -webkit-gradient(linear, left top, left bottom, 
		color-stop(0, #90a4bd), color-stop(0.5, #5777a5), color-stop(0.5, #486897), color-stop(1, #476b98));
	position: absolute;
	font-size: 80%;
	width: 60px;
	padding: .5em 2px;
	margin: 0;
	text-align: center !important;
	border: 1px solid #384f6f;
	text-shadow: #4d5c7b 0 -1px 0;
/*	-webkit-box-shadow: #98abc9 0 1px 0;*/
	top: 7px; right: 5px;
}

#back_button {
	position: absolute;
	top: 7px; left: 0;
	font-size: 80%;
	width: 56px; height: 29px;
	padding: .5em 2px;
	margin: 0;
	border: none;
}

#back_button.conference {
	background: url(/img/mobile_sprites.gif) -200px center;
}

#back_button.meeting {
	background: url(/img/mobile_sprites.gif) -300px center;
}

#submitPost, button.gloss {
	background: -webkit-gradient(linear, left top, left bottom, 
		color-stop(0, #809ee6), color-stop(0.5, #386ce6), color-stop(0.5, #285eda), color-stop(1, #2a63d6));
	border-color: #1b4aa4;
	text-shadow: #345695 0 -1px 0;
	padding: .5em 12px;
/*	-webkit-box-shadow: #91abdc 0 1px 0;*/
}

#meetingsData { display: none; }


</style>

</head>

<body>

<h1 id="header">Welcome to backchan.nl</h1>

<div id="frame">
<ol id="content"></ol>
</div>

<?php echo $content_for_layout; ?>

<script type="text/javascript">
var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
document.write(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E"));
</script>
<script type="text/javascript">
var pageTracker = _gat._getTracker("UA-841537-4");
pageTracker._initData();
pageTracker._trackPageview();
</script>

</body>
</html>