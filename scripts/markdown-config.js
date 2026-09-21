const markdownIt = require("markdown-it");
const anchor = require("markdown-it-anchor");

module.exports = markdownIt({ html: true, breaks: false, linkify: true }).use(anchor, {
  permalink: anchor.permalink.headerLink(),
});
