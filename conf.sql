/**
  * backchan.nl
  * 
  * Copyright (c) 2006-2009, backchan.nl contributors. All Rights Reserved
  * 
  * The contents of this file are subject to the BSD License; you may not
  * use this file except in compliance with the License. A copy of the License
  * is available in the root directory of the project.
  */

/**
 * Configuration file for the backchannl database
 * Use it to recreate a database from scratch if needed.
 */

DROP DATABASE IF EXISTS backchannl_dev;

CREATE DATABASE backchannl_dev;

USE backchannl_dev;

CREATE TABLE conferences (
	id INT                NOT NULL AUTO_INCREMENT,
	name VARCHAR(255)     NOT NULL,
	username VARCHAR(20)  NOT NULL UNIQUE,  -- for URL: username.backchannl.nl
	password VARCHAR(255) NOT NULL,
	email VARCHAR(255)    NOT NULL,
	created DATETIME,   -- TODO: if 'created' and 'modified' are TIMESTAMP
	modified DATETIME,  -- when edit in scaffolding, created time change too
	PRIMARY KEY (id)    -- DATETIME has problem with time zone and UNIX stamp?
);

CREATE TABLE meetings (
	id INT              NOT NULL AUTO_INCREMENT,
	conference_id INT   NOT NULL,
	name VARCHAR(255)   NOT NULL,
	start DATETIME,
	end DATETIME,
	created DATETIME,
	modified DATETIME,
	enabled BOOLEAN,
	PRIMARY KEY (id)
);

CREATE TABLE users (
	id INT                   NOT NULL AUTO_INCREMENT,
	name VARCHAR(32)         NOT NULL,  -- TODO: combo of name & affiliation unique
	affiliation VARCHAR(64)  NOT NULL,
	created DATETIME,
	PRIMARY KEY (id)
);

CREATE TABLE posts (
	id INT             NOT NULL AUTO_INCREMENT,
	meeting_id INT     NOT NULL,
	user_id INT        NOT NULL,
	body VARCHAR(255)  NOT NULL,
	created DATETIME,
	PRIMARY KEY (id)
);

CREATE TABLE post_votes (
	id INT             NOT NULL AUTO_INCREMENT,
	post_id INT        NOT NULL,
	user_id INT        NOT NULL,
	value INT          NOT NULL,
	created DATETIME,
	PRIMARY KEY (id)
);

CREATE TABLE post_replies (
	id INT              NOT NULL AUTO_INCREMENT,
	post_id INT         NOT NULL,
	user_id INT         NOT NULL,
	body VARCHAR(255)   NOT NULL,
	created DATETIME,
	modified DATETIME,
	PRIMARY KEY (id)
);

CREATE TABLE post_events (
	id INT                                          NOT NULL AUTO_INCREMENT,
	post_id INT                                     NOT NULL,
	event_type ENUM('promote', 'demote', 'delete')  NOT NULL,
	created DATETIME,
	PRIMARY KEY (id)
);


/* TODO: for production, delete following test entries */
INSERT INTO conferences (name, username, password, email, created, modified)
	VALUES ('MIT Conference', 'mit', 'xi302kc', 'dharry@mit.edu',
	        '2000-01-01 00:00:00', '2000-01-01 00:00:00'),
	       ('Harvard Conference', 'harvard', 's9dj3o2', 'cs@harvard.edu',
	        '2000-01-01 00:00:00', '2000-01-01 00:00:00');
INSERT INTO meetings (conference_id, name, created, modified)
	VALUES (1, 'MIT Cultivation', '2000-01-01 00:00:00', '2000-01-01 00:00:00'),
	       (2, 'Harvard Chinese', '2005-02-11 19:30:00', '2005-02-11 19:30:00'),
	       (1, 'MIT Anti-CCP', '2000-03-23 23:22:12', '2000-03-23 23:22:12'),
	       (2, 'Harvard TC', '2005-02-11 19:30:00', '2005-02-11 19:30:00'),
	       (1, 'MIT Score Testing Meeting', DATE_SUB(NOW(), INTERVAL 10 MINUTE), DATE_SUB(NOW(), INTERVAL 10 MINUTE));
INSERT INTO users (name, affiliation, created)
	VALUES ('Aaron', 'Philly', '1998-05-07 23:33:22'),
	       ('Betty', 'Boston Latin School', '2006-01-01 00:23:29'),
	       ('Cherrie Yang', 'MIT', '2005-02-11 19:30:00'),
	       ('Drew', 'MIT Media Lab', '2008-06-01 10:00:00'),
	       ('Eric', 'Harvard University', NOW()),
	       ('Fadu', 'Australia', NOW()),
	       ('Grace', 'Wisconsin', NOW()),
	       ('Helena', 'Goldman Sachs', NOW()),
	       ('Irene', 'MIT', NOW()),
	       ('Jason', 'LifeCell Corporation', NOW()),
	       ('Keiti', 'Albania', NOW());
INSERT INTO posts (meeting_id, user_id, body, created)
	VALUES (1, 3, 'How can I be more compassionate?', '2005-02-11 19:30:00'),
	       (3, 4, 'Communist Party is evil.', '2005-02-11 19:30:00'),
	       (1, 2, 'When I meditate, many thoughts come into my mind.', '2007-01-01 01:01:01'),
	       (2, 1, 'Taking Chinese class.', '2005-02-11 19:30:00'),
	       (4, 3, 'We should tc at Harvard Square more!', '2005-02-11'),
	       (2, 5, 'My Chinese is really not good.', '2007-10-10 11:08:23'),
	       (1, 1, 'What is cultivation?', '2008-08-08 20:00:00'),
	       (1, 5, 'I want to learn it. Where to start?', '2007-10-10 09:30:00'),
	       (1, 4, 'It''s pretty cool. Do we have it here?', NOW()),
	       (1, 3, 'I am quite diligent recently :-)', NOW()),
	       (1, 6, 'When can I go dance?', '2008-01-01 02:02:00'),
	       (1, 7, 'I know time is very precious.', '2008-08-27 00:00:00'),
	       (1, 8, 'I still have tons of attachments :(', '2004-08-08 08:00:00'),
	       (1, 9, 'Is it fun?', '2002-09-09 07:00:00'),
	       (1, 10, 'How could we coordinate better?', '2008-08-20 22:00:00'),
	       (1, 11, 'I just started.', '2008-07-19 14:00:00'),
	       (5, 3, 'This is the first post in the meeting.', DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
	       (5, 2, 'A new post! Yay.', DATE_SUB(NOW(), INTERVAL 3 MINUTE)),
	       (5, 4, 'Newest post!', NOW());

    
INSERT INTO post_votes (post_id, user_id, value, created)
	VALUES (3, 1, 1, NOW()),
	       (3, 3, 1, '2007-02-11 19:30:00'),
	       (3, 4, 1, NOW()),
	       (3, 5, 1, '2007-06-14 19:30:00'),
	       (3, 6, 1, '2007-08-12 19:30:00'),
	       (3, 7, 1, '2007-12-14 19:30:00'),
	       (3, 8, 1, '2008-12-04 19:30:00'),
	       (3, 9, 1, '2007-08-09 19:30:00'),
	       (3, 10, 1, '2007-07-13 19:30:00'),
	       (3, 11, 1, '2007-02-20 19:30:00'),
	       (1, 10, 1, '2005-02-22 19:30:00'),
	       (1, 6, 1, '2005-02-22 19:30:00'),
	       (1, 8, 1, '2005-02-22 19:30:00'),
	       (1, 11, 1, '2005-02-22 19:30:00'),
	       (1, 9, 1, '2005-02-22 19:30:00'),
	       (1, 7, 1, '2005-02-22 19:30:00'),
	       (1, 4, 1, '2005-02-22 19:30:00'),
	       (10, 10, -1, '2008-05-13 19:30:00'),
	       (13, 1, 1, '2005-06-04 06:30:00'),
	       (13, 5, 1, '2007-09-03 06:30:00'),
	       (13, 3, -1, '2008-02-01 06:30:00'),
	       (16, 3, 1, '2008-08-01 06:30:00'),
	       (16, 2, 1, '2008-08-12 20:36:00'),
	       (16, 10, 1, '2008-08-22 19:30:00'),
	       (17, 6, 1, DATE_SUB(NOW(), INTERVAL 8 MINUTE)),
	       (17, 7, 1, DATE_SUB(NOW(), INTERVAL 8 MINUTE)),
	       (17, 8, -1, DATE_SUB(NOW(), INTERVAL 8 MINUTE)),
           (18, 6, 1, DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
           (18, 7, 1, DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
           (18, 8, -1, DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
           (19, 6, 1, NOW()),
           (19, 7, -1, NOW()),
           (19, 8, -1, NOW());

	
	