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

App::import('Sanitize');  // TODO: sanitized strings may be longer than the original and
                          //       exceeds the char limit even if the original doesn't
                          //       and save the string cuts the extra off
                          //       another problem is if client submits original msg longer
                          //       than limit and then change the extra part and resubmit,
                          //       the db will have the same msg twice

class PostsController extends AppController {

	// var $components = array('Acl');

	var $scaffold;
	
	var $helpers = array('Cache');
	

	function add()
		{
		
		// Configure::write('debug', 1);
		
		if (!empty($this->data)) {
			//urldecode the body since this doesn't seem to be happening automatically.

			// Clean data
			$this->data = Sanitize::clean($this->data);

			$this->data['Post']['body'] = html_entity_decode($this->data['Post']['body']);
			
			// There are a few other things we want to do to the post, here. 
			//   '\n' characters should be converted to <br/>
			//   links should be converted to proper hyperlinks
			//     ^-- This last part is a funny joke: the hyperlink conversion
			//         happens in the post model, where it should.
			
			// debug("post body before: " . $this->data['Post']['body']);
			// debug($this->data);
			$this->data['Post']['body'] = str_replace('\n', "<br/>", $this->data['Post']['body']);
			
			
			// debug("post body after: " . $this->data['Post']['body']);
			
			
			// Check if cookie exist
			$userId = $this->Cookie->read('User.id');
			
			
			if ($userId != null) {
				$this->data['Post']['user_id'] = $userId;
				// Check if post already exists in DB
				$post = $this->Post->find(
					array(
						'Post.meeting_id' => $this->data['Post']['meeting_id'],
						'Post.user_id' => $userId,
						'Post.body' => $this->data['Post']['body']
					),
					array('Post.meeting_id', 'Post.user_id', 'Post.body'),
					null,
					0
				);
				if ($post == false) {  // Post not already in DB
					if ($this->Post->save($this->data)) {
						$this->set('d', $this->data);  // TODO: more fields in order to populate the posts table
						
						// Clear the cache for this meeting.
						Cache::delete($this->data['Post']['meeting_id']);
					}
					else {
						$this->set('d',
							array('Post' => array(
								'message' => 'Cannot add post!')
							)
						);
					}
				}
				else {  // Post already in DB
					$this->set('d',
						array('Post' => array(
							'message' => 'Cannot post the same thing to the same meeting twice!')
						)
					);
				}
			}
			else {
				$this->set('d',
					array('Post' => array(
						'message' => 'Identify yourself before posting!')
					)
				);
			}
		}
		$this->render(null, 'ajax');
	}

	function index() {
		// pr($this->Acl);
		$this->set('posts', $this->Post->find('all'));
	}
	
	
	// A container for some testing code while I figure out how cakePhp does things.
	function test($id)
	{
		if($id==null)
			$id = 5;
		
		$posts = $this->Post->find('all',array(
							'conditions'=>array('Post.meeting_id' => $id), 
							'recursive'=>1));
		
		$this->set('posts', $posts);
		
	}
	
	// function view($id = null) {
	// 	$this->Post->id = $id;
	// 	$this->set('post', $this->Post->read());
	// }
	// 
	// function delete($id) {
	// 	$this->Post->del($id);
	// 	$this->flash('The post with id: '.$id.' has been deleted.', '/posts');
	// }
	// 
	// function edit($id = null) {
	// 	if (empty($this->data)) {
	// 		$this->Post->id = $id;
	// 		$this->data = $this->Post->read();
	// 	}
	// 	else {
	// 		if ($this->Post->save($this->data['Post'])) {
	// 			$this->flash('Your post has been updated.','/posts');
	// 		}
	// 	}
	// }

}

?>