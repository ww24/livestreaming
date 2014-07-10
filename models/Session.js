/**
 * Session model
 */

var redis = require("redis"),
    config = require("../config.json");

var client = redis.createClient(config.redis.port, config.redis.host, {
  auth_pass: config.redis.pass
});

module.exports = Session;

function Session(id) {
  this.id = id;
}

// get session
Session.prototype.get = function (key, callback) {
  client.hget(this.id, key, callback);
};

// set session
Session.prototype.set = function (key, value, callback) {
  client.hset(this.id, key, value, callback);
};

// clear session
Session.prototype.clear = function (callback) {
  client.del(this.id);
};
