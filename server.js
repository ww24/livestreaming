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

// clear all sessions
models.Session.clear();

// video_id manager
var stream = new models.Stream("stream");
stream.clear();

// configure server and start
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
server.listen(config.server.port);

// redis server settings
var redisopts = [config.redis.port, config.redis.host, {
  auth_pass: config.redis.pass
}];
// associate redis with socket.io
io.adapter(redisAdapter({
  pubClient: redis.createClient.apply(redis, redisopts),
  subClient: redis.createClient.apply(redis, redisopts)
}));

// connection event
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

      callback && callback();
    });
  });

  socket.on("watch", function (data, callback) {
    var video_id = data.video_id;
    // join the room
    socket.join(video_id);
    session.set("watch_id", video_id, function (err) {
      if (err) {
        return callback && callback(err);
      }

      // number of user connections
      var connection_size = Object.keys(socket.adapter.rooms[video_id]).length - 1;
      io.sockets.to(video_id).emit("metadata", {
        connection_size: connection_size
      });

      // get video_id existence info
      stream.exist(video_id, function (err, res) {
        if (err) {
          return callback && callback({
            error: err
          });
        }

        callback && callback({
          status: !! res
        });
      });
    });
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

            // join the room
            socket.join(video_id);

            // number of user connections
            var connection_size = Object.keys(socket.adapter.rooms[video_id]).length - 1;
            io.sockets.to(video_id).emit("metadata", {
              connection_size: connection_size,
              status: true
            });

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

        var room = socket.adapter.rooms[video_id];
        if (room) {
          var connection_size = Object.keys(room).length - 1;
          io.sockets.to(video_id).emit("metadata", {
            status: false
          });
        }
      }
    });
    session.get("watch_id", function (err, watch_id) {
      if (! err) {
        // number of user connections
        var room = socket.adapter.rooms[watch_id];
        if (room) {
          var connection_size = Object.keys(room).length - 1;
          io.sockets.to(watch_id).emit("metadata", {
            connection_size: connection_size
          });
        }
      }
    });
    session.clear();
  });
});

// set static file path
app.use(express.static(path.resolve(__dirname, "public")));

// all route -> index.html
app.get("/*", function (req, res) {
  res.sendfile(path.resolve(__dirname, "public/index.html"));
});
