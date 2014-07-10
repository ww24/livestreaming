/* globals io */
/**
 * Video Streaming Viewer
 *
 */

$(function () {
  var video = $("#display").get(0);

  var socket = io.connect();

  socket.on("evt", function (msg) {
    console.log(msg);
  });

  socket.on("video", function (data) {
    console.log(data);

    var blob = new Blob([data.video], {type: data.type});
    video.src = URL.createObjectURL(blob);
    video.addEventListener("loadeddata", function () {
      URL.revokeObjectURL(video.src);
    });
  });
});
