const util = require("util");

if (typeof util.styleText !== "function") {
  // Fallback for Node versions that do not implement util.styleText.
  util.styleText = (_styles, text) => text;
}
