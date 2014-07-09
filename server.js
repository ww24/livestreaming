/**
 * Socket.IO Server
 *
 */

var express = require("express"),
    socketio = require("socket.io"),
    http = require("https"),
    path = require("path"),
    fs = require("fs"),
    config = require("./config.json");

var opt = {
  pfx: fs.readFileSync("web.pfx"),
  passphrase: config.passphrase
};

var app = express();
var server = http.Server(opt, app);
var io = socketio(server);

io.on("connection", function (socket) {
  socket.emit("evt", {data: "hello"});

  socket.on("image", function (data) {
    socket.broadcast.volatile.emit("image", data);
  });

  socket.on("video", function (data) {
    socket.broadcast.emit("video", data);
  });
});

app.use(express.static(path.resolve(__dirname, "public")));

app.get("/*", function (req, res) {
  res.sendfile(path.resolve(__dirname, "public/index.html"));
});

server.listen(3000);
