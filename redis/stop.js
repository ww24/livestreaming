/**
 * stop.js
 * shutdown redis-server
 */

var config = require("../config.json"),
    cp = require("child_process");

console.log("redis-cli shutdown");

cp.exec([
  "redis-cli",
  "-p", config.redis.port,
  "-h", config.redis.host,
  "-a", config.redis.pass,
  "shutdown"
].join(" "), function (err, stdout, stderr) {
  if (err)
    return console.error(err);

  console.log(stdout);
  console.error(stderr);
});
