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
Session.prefix = "iosess:";
Session.clear = function (callback) {
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

// get session
Session.prototype.get = function (key, callback) {
  var c = this.constructor;
  client.hget(c.prefix + this.id, key, callback);
};

// set session
Session.prototype.set = function (key, value, callback) {
  var c = this.constructor;
  client.hset(c.prefix + this.id, key, value, callback);
};

// set session
Session.prototype.del = function (key, callback) {
  var c = this.constructor;
  client.hdel(c.prefix + this.id, key, callback);
};

// clear session
Session.prototype.clear = function (callback) {
  var c = this.constructor;
  client.del(c.prefix + this.id, callback);
};
