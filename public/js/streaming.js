/* globals io, page */
/**
 * video streaming over socket.io
 * author: Takenori Nakagawa
 * license: MIT
 */

// create socket.io connection
var socket = io.connect({
  rememberUpgrade: true
});
socket.on("evt", function (msg) {
  console.log(msg);
});

$(function () {
  "use strict";

  var $body = $("body"),
      $connections = $("#connections"),
      $status = $("#status");

  socket.on("metadata", function (data) {
    if ($connections.length > 0 && "connection_size" in data) {
      $connections.text(data.connection_size);
    }
    if ($status.length > 0 && "status" in data) {
      $status.text(data.status ? "online" : "offline");
    }
  });

  var type = location.pathname.slice(1);
  var watch = socket.emit.bind(socket, "watch", {video_id: type.slice(1)}, function (data) {
    if ($status.length > 0 && "status" in data) {
      $status.text(data.status ? "online" : "offline");
    }
  });

  if (type === "live") {
    $body.removeClass("top").addClass("live");
    page.live();
  } else if (/^r\w+$/.test(type)) {
    watch();
    socket.on("reconnect", watch);
    $body.removeClass("top").addClass("watch");
    page.watch();
  } else if (type !== "") {
    console.error(404);
    $body.html("<p>ページが存在しません</p>");
  }
});
