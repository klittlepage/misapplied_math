require('./vendor/bootstrap/bootstrap/collapse.js');
require('./vendor/bootstrap/bootstrap/dropdown.js');

var docHead = document.getElementsByTagName('head')[0];       
var newLink = document.createElement('link');
newLink.rel = 'icon';
newLink.type = "image/x-icon";
newLink.href = require("../images/favicon.ico");
docHead.appendChild(newLink);
