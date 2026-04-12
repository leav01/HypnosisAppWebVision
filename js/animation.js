// ===== Hypnosis Animation Controller =====

var HypnoApp = window.HypnoApp || {};

// Timer IDs for cleanup
var _timers = [];

/**
 * Get intensity level config for a given intensity value
 */
function getIntensityConfig(intensity) {
  var config = HypnoApp.INTENSITY_LEVELS.find(function(l) {
    return intensity >= l.minIntensity && intensity <= l.maxIntensity;
  });
  return config || HypnoApp.INTENSITY_LEVELS[1];
}

/**
 * Start the hypnosis animation sequence
 */
HypnoApp.startAnimation = function(settings) {
  var $ = HypnoApp.$;
  cleanup();

  var container = $('#animation-container');
  var blackout = $('#blackout-overlay');
  var blackoutText = $('#blackout-text');
  var spiral = $('#spiral');
  var heart = $('#heart');

  // Apply intensity settings
  var intensityConfig = getIntensityConfig(settings.intensity);
  container.style.setProperty('--heartbeat-speed', intensityConfig.heartbeatSpeed);
  container.style.setProperty('--expand-speed', intensityConfig.expandSpeed + 's');

  // Reset states
  blackout.classList.remove('hidden');
  blackoutText.classList.remove('visible');
  blackoutText.textContent = '';
  spiral.classList.remove('active');
  heart.classList.remove('active');

  // Phase 1: Blackout with text sequence
  var delayMs = settings.delay * 1000;
  var messages = HypnoApp.BLACKOUT_MESSAGES;
  var messageInterval = delayMs / messages.length;

  messages.forEach(function(msg, i) {
    var showTimer = setTimeout(function() {
      blackoutText.classList.remove('visible');
      var swapTimer = setTimeout(function() {
        blackoutText.textContent = msg;
        blackoutText.classList.add('visible');
      }, 100);
      _timers.push(swapTimer);
    }, i * messageInterval);
    _timers.push(showTimer);

    if (i < messages.length - 1) {
      var hideTimer = setTimeout(function() {
        blackoutText.classList.remove('visible');
      }, (i + 1) * messageInterval - 300);
      _timers.push(hideTimer);
    }
  });

  // Phase 2: Start animation after delay
  var phase2Timer = setTimeout(function() {
    blackoutText.classList.remove('visible');

    var transitionTimer = setTimeout(function() {
      blackout.classList.add('hidden');
      spiral.classList.add('active');
      heart.classList.add('active');

      // Auto-exit after duration
      var durationMs = (settings.duration || 60) * 1000;
      var autoExitTimer = setTimeout(function() {
        HypnoApp.stopAnimation();
        HypnoApp.showPage('dashboard');
      }, durationMs);
      _timers.push(autoExitTimer);
    }, 400);
    _timers.push(transitionTimer);
  }, delayMs);
  _timers.push(phase2Timer);
};

/**
 * Stop animation and clean up
 */
HypnoApp.stopAnimation = function() {
  var $ = HypnoApp.$;
  cleanup();

  var spiral = $('#spiral');
  var heart = $('#heart');
  var blackout = $('#blackout-overlay');

  if (spiral) spiral.classList.remove('active');
  if (heart) heart.classList.remove('active');
  if (blackout) blackout.classList.remove('hidden');
};

/**
 * Clean up all timers
 */
function cleanup() {
  _timers.forEach(function(id) { clearTimeout(id); });
  _timers = [];
}

window.HypnoApp = HypnoApp;
