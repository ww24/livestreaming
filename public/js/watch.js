/* globals io */

window.page || (window.page = {});

page.watch = function () {
  "use strict";

  var socket = io.connect();

  var video = $("#display-watch").get(0);

  socket.on("video", function (data) {
    console.log(data);

    var blob = new Blob([data.video], {type: data.type});
    video.src = URL.createObjectURL(blob);
    video.addEventListener("loadeddata", function () {
      URL.revokeObjectURL(video.src);
    });
  });
};
