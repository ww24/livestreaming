/* globals io, MediaStreamRecorder */
/**
 * video streaming over socket.io
 * author: Takenori Nakagawa
 * license: MIT
 */

// create socket.io connection
var socket = io.connect();
socket.on("evt", function (msg) {
  console.log(msg);
});

(function () {
  var type = location.pathname.slice(1);
  if (type === "rec") {
    socket.emit("rec", {data: "request"}, function (msg) {
      console.log(msg);
    });
  } else if (/^r[0-9]+/.test(type)) {
    socket.emit("watch", {video_id: type}, function (msg) {
      console.log(msg);
    });
  } else if (type !== "") {
    console.error(404);
    $("body").html("<p>ページが存在しません</p>");
  }
})();

$(function () {
  "use strict";

  var streaming = null;

  var $live = $("#live"),
      $stop = $("#stop");

  $live.click(function () {
    $live.prop("disabled", true);

    if (streaming === null) {
      streaming = live(function (success) {
        if (! success) {
          $live.prop("disabled", false);
          console.error("fail");
        } else {
          $stop.prop("disabled", false);
          streaming.start();
        }
      });
    } else {
      $stop.prop("disabled", false);
      streaming.start();
    }
  });

  $stop.click(function () {
    $stop.prop("disabled", true);
    streaming.stop();
    $live.prop("disabled", false);
  });

  function live(callback) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (typeof navigator.getUserMedia !== "function") {
      alert("お使いのブラウザには対応していません。");
      callback(false);
      return;
    }

    var $display = $("#display"),
        video = $display.get(0);

    var mediaRecorder = null;

    navigator.getUserMedia({
      video: {
        mandatory: {
          chromeMediaSource: "screen",
          //minWidth: 480,
          //minHeight: 270,
          maxWidth: 1280,//1920,
          maxHeight: 720,//1080
        }
      }
    }, function (stream) {
      // depends: MediaStreamRecorder.js
      mediaRecorder = new MediaStreamRecorder(stream);
      mediaRecorder.mimeType = "video/webm";
      mediaRecorder.ondataavailable = function (blob) {
        socket.emit("video", {
          type: mediaRecorder.mimeType,
          video: blob
        });
      };

      video.src = window.URL.createObjectURL(stream);
      video.addEventListener("loadeddata", function () {
        mediaRecorder.width = video.videoWidth;
        mediaRecorder.height = video.videoHeight;

        console.log("w:", video.videoWidth, "h:", video.videoHeight);
        callback(true);
      });
      video.play();
    }, function (e) {
      console.error(e);
      alert("リソースへのアクセスを拒否されました。");

      callback(false);
    });

    return {
      start: function () {
        // live streaming
        mediaRecorder && mediaRecorder.start(5000);
      },
      stop: function () {
        mediaRecorder && mediaRecorder.stop();
      }
    };
  }
});
