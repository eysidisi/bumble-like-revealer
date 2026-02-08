function getSecretString() {
  try {
    var a = (window.$s && window.$s.rt) || undefined;
    var s = (window.$vars && window.$vars.rt) || undefined;
    var u = (window.$vars && window.$vars.Apification && window.$vars.Apification.rt) || undefined;
    console.log('a ', a)
    console.log('s ', s)
    console.log('u ', u)
  } catch (e) {}
  return a || s || u || "whitetelevisionbulbelectionroofhorseflying";
}
// x-pingback.js

const DEFAULT_SECRET = "whitetelevisionbulbelectionroofhorseflying";

// Rotate a 32-bit word left.
function rotl(x, n) {
  return (x << n) | (x >>> (32 - n));
}

// Convert a 32-bit word (or word-array) between endian representations.
function endian(x) {
  if (typeof x === "number") {
    return (16711935 & rotl(x, 8)) | (4278255360 & rotl(x, 24));
  }
  for (let i = 0; i < x.length; i += 1) x[i] = endian(x[i]);
  return x;
}

// UTF-8 conversion used by the original bundle path.
function utf8StringToBytes(str) {
  const bin = unescape(encodeURIComponent(str));
  const out = [];
  for (let i = 0; i < bin.length; i += 1) out.push(bin.charCodeAt(i) & 255);
  return out;
}

function bytesToWords(bytes) {
  const words = [];
  for (let i = 0, b = 0; i < bytes.length; i += 1, b += 8) {
    words[b >>> 5] |= bytes[i] << (24 - (b % 32));
  }
  return words;
}

function wordsToBytes(words) {
  const bytes = [];
  for (let b = 0; b < 32 * words.length; b += 8) {
    bytes.push((words[b >>> 5] >>> (24 - (b % 32))) & 255);
  }
  return bytes;
}

function bytesToHex(bytes) {
  const hex = [];
  for (let i = 0; i < bytes.length; i += 1) {
    hex.push((bytes[i] >>> 4).toString(16));
    hex.push((bytes[i] & 15).toString(16));
  }
  return hex.join("");
}

function ff(a, b, c, d, x, s, t) {
  const n = a + ((b & c) | (~b & d)) + (x >>> 0) + t;
  return (rotl(n, s) + b) | 0;
}

function gg(a, b, c, d, x, s, t) {
  const n = a + ((b & d) | (c & ~d)) + (x >>> 0) + t;
  return (rotl(n, s) + b) | 0;
}

function hh(a, b, c, d, x, s, t) {
  const n = a + (b ^ c ^ d) + (x >>> 0) + t;
  return (rotl(n, s) + b) | 0;
}

function ii(a, b, c, d, x, s, t) {
  const n = a + (c ^ (b | ~d)) + (x >>> 0) + t;
  return (rotl(n, s) + b) | 0;
}

// MD5 hex digest (same algorithm path used in the source bundle).
function md5Hex(message) {
  if (message == null) {
    throw new Error(`Illegal argument ${message}`);
  }

  const bytes = utf8StringToBytes(message);
  const words = bytesToWords(bytes);
  const bitLen = 8 * bytes.length;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  // Initial endian conversion (as in original code).
  for (let i = 0; i < words.length; i += 1) {
    words[i] =
      (16711935 & ((words[i] << 8) | (words[i] >>> 24))) |
      (4278255360 & ((words[i] << 24) | (words[i] >>> 8)));
  }

  // MD5 padding.
  words[bitLen >>> 5] |= 128 << (bitLen % 32);
  words[14 + (((bitLen + 64) >>> 9) << 4)] = bitLen;

  // Main MD5 rounds.
  for (let p = 0; p < words.length; p += 16) {
    const aa = a;
    const bb = b;
    const cc = c;
    const dd = d;

    a = ff(a, b, c, d, words[p + 0], 7, -680876936);
    d = ff(d, a, b, c, words[p + 1], 12, -389564586);
    c = ff(c, d, a, b, words[p + 2], 17, 606105819);
    b = ff(b, c, d, a, words[p + 3], 22, -1044525330);
    a = ff(a, b, c, d, words[p + 4], 7, -176418897);
    d = ff(d, a, b, c, words[p + 5], 12, 1200080426);
    c = ff(c, d, a, b, words[p + 6], 17, -1473231341);
    b = ff(b, c, d, a, words[p + 7], 22, -45705983);
    a = ff(a, b, c, d, words[p + 8], 7, 1770035416);
    d = ff(d, a, b, c, words[p + 9], 12, -1958414417);
    c = ff(c, d, a, b, words[p + 10], 17, -42063);
    b = ff(b, c, d, a, words[p + 11], 22, -1990404162);
    a = ff(a, b, c, d, words[p + 12], 7, 1804603682);
    d = ff(d, a, b, c, words[p + 13], 12, -40341101);
    c = ff(c, d, a, b, words[p + 14], 17, -1502002290);
    b = ff(b, c, d, a, words[p + 15], 22, 1236535329);

    a = gg(a, b, c, d, words[p + 1], 5, -165796510);
    d = gg(d, a, b, c, words[p + 6], 9, -1069501632);
    c = gg(c, d, a, b, words[p + 11], 14, 643717713);
    b = gg(b, c, d, a, words[p + 0], 20, -373897302);
    a = gg(a, b, c, d, words[p + 5], 5, -701558691);
    d = gg(d, a, b, c, words[p + 10], 9, 38016083);
    c = gg(c, d, a, b, words[p + 15], 14, -660478335);
    b = gg(b, c, d, a, words[p + 4], 20, -405537848);
    a = gg(a, b, c, d, words[p + 9], 5, 568446438);
    d = gg(d, a, b, c, words[p + 14], 9, -1019803690);
    c = gg(c, d, a, b, words[p + 3], 14, -187363961);
    b = gg(b, c, d, a, words[p + 8], 20, 1163531501);
    a = gg(a, b, c, d, words[p + 13], 5, -1444681467);
    d = gg(d, a, b, c, words[p + 2], 9, -51403784);
    c = gg(c, d, a, b, words[p + 7], 14, 1735328473);
    b = gg(b, c, d, a, words[p + 12], 20, -1926607734);

    a = hh(a, b, c, d, words[p + 5], 4, -378558);
    d = hh(d, a, b, c, words[p + 8], 11, -2022574463);
    c = hh(c, d, a, b, words[p + 11], 16, 1839030562);
    b = hh(b, c, d, a, words[p + 14], 23, -35309556);
    a = hh(a, b, c, d, words[p + 1], 4, -1530992060);
    d = hh(d, a, b, c, words[p + 4], 11, 1272893353);
    c = hh(c, d, a, b, words[p + 7], 16, -155497632);
    b = hh(b, c, d, a, words[p + 10], 23, -1094730640);
    a = hh(a, b, c, d, words[p + 13], 4, 681279174);
    d = hh(d, a, b, c, words[p + 0], 11, -358537222);
    c = hh(c, d, a, b, words[p + 3], 16, -722521979);
    b = hh(b, c, d, a, words[p + 6], 23, 76029189);
    a = hh(a, b, c, d, words[p + 9], 4, -640364487);
    d = hh(d, a, b, c, words[p + 12], 11, -421815835);
    c = hh(c, d, a, b, words[p + 15], 16, 530742520);
    b = hh(b, c, d, a, words[p + 2], 23, -995338651);

    a = ii(a, b, c, d, words[p + 0], 6, -198630844);
    d = ii(d, a, b, c, words[p + 7], 10, 1126891415);
    c = ii(c, d, a, b, words[p + 14], 15, -1416354905);
    b = ii(b, c, d, a, words[p + 5], 21, -57434055);
    a = ii(a, b, c, d, words[p + 12], 6, 1700485571);
    d = ii(d, a, b, c, words[p + 3], 10, -1894986606);
    c = ii(c, d, a, b, words[p + 10], 15, -1051523);
    b = ii(b, c, d, a, words[p + 1], 21, -2054922799);
    a = ii(a, b, c, d, words[p + 8], 6, 1873313359);
    d = ii(d, a, b, c, words[p + 15], 10, -30611744);
    c = ii(c, d, a, b, words[p + 6], 15, -1560198380);
    b = ii(b, c, d, a, words[p + 13], 21, 1309151649);
    a = ii(a, b, c, d, words[p + 4], 6, -145523070);
    d = ii(d, a, b, c, words[p + 11], 10, -1120210379);
    c = ii(c, d, a, b, words[p + 2], 15, 718787259);
    b = ii(b, c, d, a, words[p + 9], 21, -343485551);

    a = (a + aa) >>> 0;
    b = (b + bb) >>> 0;
    c = (c + cc) >>> 0;
    d = (d + dd) >>> 0;
  }

  return bytesToHex(wordsToBytes(endian([a, b, c, d])));
}

function safeSerialize(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// Exported API: compute the X-Pingback header value only.
function calculateXPingback(payload) {
  // 1) Match original fallback when payload is falsy.
  const normalizedPayload = payload || {};

  // 2) Match original safe serialization behavior.
  const serialized = safeSerialize(normalizedPayload);

  // 3) Match original secret selection.
  const secret = DEFAULT_SECRET;

  // 4) X-Pingback = MD5(serializedPayload + secret).
  return md5Hex(`${serialized}${secret}`);
}

window.calculateXPingback = calculateXPingback;
