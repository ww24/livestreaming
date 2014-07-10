// video_id generator

var crypto = require("crypto");

module.exports = id;

function id(size, callback) {
  crypto.pseudoRandomBytes(size, function (err, buf) {
    var video_id = buf.toString("hex");
    callback(err, video_id);
  });
}
