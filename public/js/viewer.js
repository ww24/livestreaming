/* globals io */
/**
 * Video Streaming Viewer
 *
 */

$(function () {
  var cvs = $("#display").get(0);
  cvs.width = cvs.height = 0;
  var ctx = cvs.getContext("2d");

  var socket = io.connect();

  socket.on("evt", function (msg) {
    console.log(msg);
  });

  var img = document.createElement("img");
  socket.on("image", function (data) {
    var blob = new Blob([data.image], {type: data.type});
    img.src = URL.createObjectURL(blob);

    // update canvas size
    cvs.width === data.width || (cvs.width = data.width);
    cvs.height === data.height || (cvs.height = data.height);

    img.onload = function () {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
    };
  });

  // socket.on("video", function (data) {
  //   console.log(data);
  //   var url = URL.createObjectURL(data.stream);
  //   console.log(url);
  // });
});
