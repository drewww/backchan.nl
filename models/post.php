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

class Post extends AppModel {

	var $belongsTo = array('Meeting', 'User');

	var $hasMany = array(  // TODO: for these 3 models, add corresponding $validate
		'PostVote' => array(
			'dependent' => true  // PostVotes deleted when associated Post deleted
		),
		'PostReply' => array(
			'dependent' => true
		),
		'PostEvent' => array(
			'dependent' => true
		)
	);

	var $validate = array(
		'meeting_id' => array(
			'rule' => array('numeric'),
			'required' => true
		),
		'user_id' => array(
			'rule' => array('numeric'),
			'required' => true
		),
		'body' => array(
			'rule' => array('maxLength', 255),
			'required' => true,
			'allowEmpty' => false,
			'message' => 'Maximum 255 characters'
		)
	);

	var $displayField = 'body';

	// I'm not sure where to put these, but I guess I'll put it here for now. Eventually,
	// this constant should be meeting-specific.
	
	public static $NET_VOTE_FACTOR = 0.65;
	public static $TOTAL_VOTE_FACTOR = 0.35;
	

	function afterFind($results)
	{
		debug("STARTING AFTERFIND MAIN FOREACH");
		foreach ($results as $key => $val)
		{
			
			
			// Check if the result set has a meeting object. If it does,
			// we can calculate the score properly. The first step is to 
			// grab the starting time of the meeting so we can calculate 
			// vote ages against that.
			
			// Adds Post.pos_votes & Post.neg_votes, and computes aggregate post scores.
			if (isset($val['PostVote'])) {
				$pos = 0;
				$neg = 0;
				
				$netScore = 0;
				$totalScore = 0;

				if (isset($val['Meeting']))
				{
					$meetingStartTime = $val['Meeting']['created'];
				}
				
				// Search through the list of post events, and see if we have anything that is meaningful
				// for our processing of this post.
				$isDeleted = 0;
				$isDemoted = 0;
				$isPromoted = 0;
				foreach ($val['PostEvent'] as $event)
				{
					if($event['event_type']=="demote")
						$isDemoted = 1;
					else if($event['event_type']=="delete")
					{
						debug("setting IsDeleted=1 for " . $val['Post']['id']);
						$isDeleted = 1;
					}
					else if($event['event_type']=="promote")
						$isPromoted = 1;
				}

				// If it's deleted, mark it so. We'll have to wipe it out later,
				// to avoid weird concurrent modification issues with modifying
				// the array that we're looping through now. (I'm just assuming
				// this is a problem in PHP - it may not be. Try later.)
				$results[$key]['Post']['isDeleted'] = $isDeleted;
				$results[$key]['Post']['isPromoted'] = $isPromoted;
				$results[$key]['Post']['isDemoted'] = $isDemoted;
				
				foreach ($val['PostVote'] as $vote)
				{
					if(isset($meetingStartTime))
					{
						$voteValue = PostVote::calculateVoteValue($vote, $meetingStartTime);
						$totalScore += $voteValue;
					}
						
					if ($vote['value'] == 1)  // Or: > 0, validation done at saving
					{
						$pos++;
						
						if(isset($voteValue))
							$netScore += $voteValue;
					}
					else if ($vote['value'] == -1)
					{
						$neg++;
						
						if(isset($voteValue))
							$netScore -= $voteValue;
						
					}
				}
				
				$results[$key]['Post']['pos_votes'] = $pos;
				$results[$key]['Post']['neg_votes'] = $neg;	
				
				if (isset($val['Post']['created'])) {
					$created = strtotime($val['Post']['created']);
					$now = time();
					$results[$key]['Post']['age_unix'] = $now - $created;
				}
				
				// Add the scores components together, with the appropriate factors.
				if($isDemoted==1)
					$results[$key]['Post']['score'] = -100000000000; // TODO Make this -INT_MAX
				else if($isPromoted==1)
					$results[$key]['Post']['score'] = 100000000000; // TODO I really want this to be INT_MAX or something, but I can't figure out what that's called.
				else
					$results[$key]['Post']['score'] = Post::$NET_VOTE_FACTOR*$netScore + Post::$TOTAL_VOTE_FACTOR*$totalScore;
				
				// Added this in for double-checking that score calculation is working.
				// (answer: it doesn't work if you limit the fields in the find command
				//          because it can't find the info it needs. not sure how to deal
				//          with this.) - drew
				//debug($results[$key]['Post']);
			}
			
			// Auto-link URLs that we find in the body of the post.
			// I tried using the regexs from here: http://elearning.lse.ac.uk/blogs/clt/?p=285
			// They didn't work, and I ended up setting on the first comment on this page: http://kore-nordmann.de/blog/detect_url_in_texts.html
			// I wish I knew more about this stuff, but I can't really produce one myself. This one seems to work okay.
			// @author drew
			if (isset($val['Post']['body']))
			{
				// $pattern = '/(?P<protocol>(?:(?:f|ht)tp|https):\/\/)?(?P<domain>(?:(?!-)(?P<sld>[a-zA-Z\d\-]+)(?<!-)[\.]){1,2}(?P<tld>(?:[a-zA-Z]{2,}\.?){1,}){1,}|(?P<ip>(?:(?(?<!\/)\.)(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){4}))(?::(?P<port>\d{2,5}))?(?:\/(?P<script>[~a-zA-Z\/.0-9-_]*)?(?:\?(?P<parameters>[=a-zA-Z+%&0-9,.\/_ -]*))?)?(?:\#(?P<anchor>[=a-zA-Z+%&0-9._]*))?/x';
				// $pattern='|([A-Za-z]{3,9})://([-;:&=+$,w]+@{1})?([-A-Za-z0-9.]+)+:?(d+)?((/[-+~%/.w]+)???([-+=&;%@.w]+)?#?([w]+)?)?|';
				
				// $pattern = '(([A-Za-z]{3,9})://)?([-;:&=\+\$,\w]+@{1})?(([-A-Za-z0-9]+\.)+[A-Za-z]{2,3})(:\d+)?((/[-\+~%/\.\w]+)?/?([&?][-\+=&;%@\.\w]+)?(#[\w]+)?)?';
				
				// for backwards compat, decode html entities here too
				$val['Post']['body'] = html_entity_decode($val['Post']['body']);
					
				$pattern = '([A-Za-z]{3,9})://([A-Za-z0-9\.-])+(/[A-Za-z0-9%\./@+_\\-]*)?(\?[A-Za-z0-9%\./@+_=&#-]+)?';

				$results[$key]['Post']['body'] = ereg_replace($pattern, '<a href="\\0" target="_blank">\\0</a>', $val['Post']['body']);
			
			}
			
			// Adds Post.age (deprecated, now done on client side)
			// TODO: for production, comment out following (really? I think this is definitely relied on now, and shouldn't be commented out)
			if (isset($val['Post']['created'])) {
				// Constants [minute]
				$OneHour = 60;
				$OneDay = 60 * 24;
				// Post's age so far [minute]
				$totalMinutes =
					round((time() - strtotime($val['Post']['created'])) / 60);
				// In the end, gives '{$nDays}d {$nHours}h {$nMinutes}m'
				$xMinutes = $totalMinutes;
				$nDays = ($xMinutes - ($xMinutes % $OneDay)) / $OneDay;  // return int
				$xMinutes = $xMinutes % $OneDay;
				$nHours = ($xMinutes - ($xMinutes % $OneHour)) / $OneHour;  // return int
				$nMinutes = $xMinutes % $OneHour;  // return int
				$age = "";
				if ($nDays > 0)
					$age .= "{$nDays}d {$nHours}h {$nMinutes}m";
				else if ($nHours > 0)
					$age .= "{$nHours}h {$nMinutes}m";
				else
					$age .= "{$nMinutes}m";
				$results[$key]['Post']['age'] = $age;
			}
		}
		
		debug("FINISHING AFTERMIND MAIN FOREACH");
		// Loop through one more time to pull out deleted posts.
		$output = array();
				foreach ($results as $key=>$val)
				{
					// debug($val);
					// debug("id: " . $val['Post']['id'] . " deleted: " . $val['Post']['isDeleted']);
					if($val['Post']['isDeleted']==0)
						$output[] = $results[$key];
					
					// Otherwise, do nothing - ie don't include it in the output array, which 
					// is the same as deleting it.
				}
		
		debug($output);
		// $output = $results;
		
		return $output;
	}

}

?>