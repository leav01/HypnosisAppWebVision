// ===== DOM Utilities & Immutable State =====

var HypnoApp = window.HypnoApp || {};

/** querySelector shorthand */
HypnoApp.$ = function(selector) {
  return document.querySelector(selector);
};

/** querySelectorAll shorthand */
HypnoApp.$$ = function(selector) {
  return document.querySelectorAll(selector);
};

/** Switch active page */
HypnoApp.showPage = function(pageName) {
  document.body.dataset.activePage = pageName;
};

/** Create a new frozen state object */
HypnoApp.createState = function(defaults, overrides) {
  return Object.freeze(Object.assign({}, defaults, overrides || {}));
};

/** Immutable state update */
HypnoApp.updateState = function(currentState, changes) {
  return Object.freeze(Object.assign({}, currentState, changes));
};

/** Clamp a numeric value */
HypnoApp.clamp = function(value, min, max) {
  return Math.min(Math.max(value, min), max);
};

/** Format number with locale separators */
HypnoApp.formatNumber = function(n) {
  return n.toLocaleString('en-US');
};

/** Random integer between min and max (inclusive) */
HypnoApp.randomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

window.HypnoApp = HypnoApp;
