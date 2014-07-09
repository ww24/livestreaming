/* globals self */
/**
 * Base64ToBlob
 *
 */

self.addEventListener("message", function (e) {
  var base64 = e.data;

  var type = base64.match(/:(.+\/.+);/)[1] || null;
  var bin = atob(base64.split(",")[1]);

  var buffer = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) {
      buffer[i] = bin.charCodeAt(i);
  }

  var blob = new Blob([buffer.buffer], {
      type: type
  });

  self.postMessage(blob);
});
