/**
 * Socket.IO Server
 *
 */

var express = require("express"),
    socketio = require("socket.io"),
    redisAdapter = require("socket.io-redis"),
    redis = require("redis"),
    https = require("https"),
    http = require("http"),
    path = require("path"),
    fs = require("fs"),
    libs = require("./libs"),
    models = require("./models"),
    config = require("./config.json");

// clear all session
models.Session.clear();

// video_id manager
var stream = new models.Stream("stream");
stream.clear();

var opt, server,
    app = express();
if (config.ssl) {
  opt = {
    pfx: fs.readFileSync(config.ssl.pfx),
    passphrase: config.ssl.passphrase
  };

  server = https.Server(opt, app);
} else {
  server = http.Server(app);
}

var io = socketio(server);

var redisopts = [config.redis.port, config.redis.host, {
  auth_pass: config.redis.pass
}];

io.adapter(redisAdapter({
  pubClient: redis.createClient.apply(redis, redisopts),
  subClient: redis.createClient.apply(redis, redisopts)
}));

io.on("connection", function (socket) {
  var session = new models.Session(socket.id);

  socket.emit("evt", {data: "hello"});

  socket.on("image", function (data) {
    socket.broadcast.volatile.emit("image", data);
  });

  // broadcast video data
  socket.on("video", function (data, callback) {
    session.get("video_id", function (err, video_id) {
      if (err) {
        return callback && callback({
          error: err
        });
      }

      // check video_id existence
      if (! video_id) return;
      socket.broadcast.to(video_id).emit("video", data);
    });
  });

  socket.on("watch", function (data) {
    socket.join(data.video_id);
  });

  // associate video_id
  socket.on("live", function (callback) {
    (function generateVideoId() {
      libs.id(2, function (err, video_id) {
        if (err) {
          return callback && callback({
            error: err
          });
        }

        // get video_id existence info
        stream.exist(video_id, function (err, res) {
          if (err) {
            return callback && callback({
              error: err
            });
          }

          // check video_id existence
          if (res) {
            // retry
            return generateVideoId();
          }

          stream.set(video_id);
          session.set("video_id", video_id, function (err) {
            if (err) {
              return callback && callback({
                error: err
              });
            }

            callback && callback({
              video_id: video_id
            });
          });
        });
      });
    })();
  });

  // disconnect event
  socket.on("disconnect", function () {
    session.get("video_id", function (err, video_id) {
      if (! err) {
        stream.del(video_id);
      }
    });
    session.clear();
  });
});

app.use(express.static(path.resolve(__dirname, "public")));

app.get("/*", function (req, res) {
  res.sendfile(path.resolve(__dirname, "public/index.html"));
});

server.listen(config.server.port);
