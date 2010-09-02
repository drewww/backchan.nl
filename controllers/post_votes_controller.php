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

class PostVotesController extends AppController {

	// var $scaffold;

	function add() {
		if (!empty($this->data)) {
			$userId = $this->Cookie->read('User.id');
			if ($userId != null) {
				$this->data['PostVote']['user_id'] = $userId;
				// Check if user votes on his own post
				$post = $this->PostVote->Post->read(
					array('Post.id', 'Post.user_id'),
					$this->data['PostVote']['post_id']
				);
				if ($post['Post']['user_id'] != $userId) {  // Not his own post
					// Check if post vote already exists in DB
					$postVote = $this->PostVote->find(
						array(
							'PostVote.post_id' => $this->data['PostVote']['post_id'],
							'PostVote.user_id' => $userId,
							'PostVote.value' => $this->data['PostVote']['value']
						),
						array('PostVote.post_id', 'PostVote.user_id', 'PostVote.value'),
						null,
						0
					);
					if ($postVote == false) {  // Post vote not already in DB
						if ($this->PostVote->save($this->data)) {
							$this->set('d', $this->data);
							// $this->set('p', $this->params);
						}
						else
							$this->set('d',
								array('PostVote' => array(
									'message' => 'Cannot add post vote!')
								)
							);
					}
					else {  // Post vote already in DB
						$this->set('d',
							array('PostVote' => array(
								'message' => 'Cannot vote on the same post twice!')
							)
						);
					}
				}
				else {  // His own post
					$this->set('d',
						array('PostVote' => array(
							'message' => 'Cannot vote on your own post!')
						)
					);
				}
			}
			else
				$this->set('d',
					array('PostVote' => array(
						'message' => 'Identify yourself before voting!')
					)
				);
		}
		$this->render(null, 'ajax');
	}

}

?>