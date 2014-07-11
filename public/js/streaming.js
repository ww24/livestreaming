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
      $meta = $("#meta");


  socket.on("metadata", function (data) {
    if ($meta.length > 0) {
      $meta.text(data.connection_size);
    }
  });

  var type = location.pathname.slice(1);
  if (type === "live") {
    $body.removeClass("top").addClass("live");
    page.live();
  } else if (/^r\w+$/.test(type)) {
    socket.emit("watch", {video_id: type.slice(1)});

    socket.on("reconnect", function () {
      socket.emit("watch", {video_id: type.slice(1)});
    });

    $body.removeClass("top").addClass("watch");
    page.watch();
  } else if (type !== "") {
    console.error(404);
    $body.html("<p>ページが存在しません</p>");
  }
});
