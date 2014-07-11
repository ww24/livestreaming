/**
 * Stream model
 */

var redis = require("redis"),
    config = require("../config.json");

var client = redis.createClient(config.redis.port, config.redis.host, {
  auth_pass: config.redis.pass
});

module.exports = Stream;

function Stream(id) {
  this.id = id;
}
Stream.prefix = "";
Stream.clear = function (callback) {
  if (this.prefix === "") {
    return;
  }

  client.keys(this.prefix + "*", function (err, keys) {
    if (err) {
      return callback && callback(err);
    }

    if (keys.length === 0) {
      return callback && callback(null, 0);
    }

    var args = keys.concat(callback);
    client.del.apply(client, args);
  });
};

// check existence
Stream.prototype.exist = function (video_id, callback) {
  var c = this.constructor;
  client.sismember(c.prefix + this.id, video_id, callback);
};

// set video_id
Stream.prototype.set = function (video_id, callback) {
  var c = this.constructor;
  client.sadd(c.prefix + this.id, video_id, callback);
};

// delete video_id
Stream.prototype.del = function (video_id, callback) {
  var c = this.constructor;
  client.srem(c.prefix + this.id, video_id, callback);
};

// clear all video_id
Stream.prototype.clear = function (callback) {
  var c = this.constructor;
  client.del(c.prefix + this.id, callback);
};
