/* eslint-env browser */
import 'jquery';
import 'javascripts/vendor/bootstrap/bootstrap/collapse';
import 'javascripts/vendor/bootstrap/bootstrap/dropdown';

(() => {
  const docHead = document.getElementsByTagName('head')[0];
  const newLink = document.createElement('link');
  newLink.rel = 'icon';
  newLink.type = 'image/x-icon';
  // eslint-disable-next-line global-require
  newLink.href = require('../images/favicon.ico');
  docHead.appendChild(newLink);
})();
