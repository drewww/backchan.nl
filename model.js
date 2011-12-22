var _ = require('underscore')._
    Backbone = require('backbone'),
    base_model = require('./static/js/backchannl-backbone.js'),
    crypto = require('crypto'),
    logger = require('winston'),
    redis = require('redis'),
    client = redis.createClient();

logger.cli();
logger.default.transports.console.timestamp = true;

