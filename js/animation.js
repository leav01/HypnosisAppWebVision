// ===== Hypnosis Animation Controller =====

var HypnoApp = window.HypnoApp || {};

// Timer IDs for cleanup
var _timers = [];
var _particles = [];

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
  var hueOverlay = $('#hue-overlay');

  // Apply intensity settings
  var intensityConfig = getIntensityConfig(settings.intensity);
  container.style.setProperty('--rotation-speed', intensityConfig.rotationSpeed);
  container.style.setProperty('--heartbeat-speed', intensityConfig.heartbeatSpeed);

  // Saturation filter on spiral
  spiral.style.filter = intensityConfig.saturation !== 1.0
    ? 'saturate(' + intensityConfig.saturation + ')'
    : '';

  // Reset states
  blackout.classList.remove('hidden');
  blackoutText.classList.remove('visible');
  blackoutText.textContent = '';
  spiral.classList.remove('active');
  heart.classList.remove('active');
  hueOverlay.classList.remove('active');

  // Phase 1: Blackout with text sequence
  var delayMs = settings.delay * 1000;
  var messages = HypnoApp.BLACKOUT_MESSAGES;
  var messageInterval = delayMs / messages.length;

  messages.forEach(function(msg, i) {
    // Fade in message
    var showTimer = setTimeout(function() {
      blackoutText.classList.remove('visible');
      var swapTimer = setTimeout(function() {
        blackoutText.textContent = msg;
        blackoutText.classList.add('visible');
      }, 100);
      _timers.push(swapTimer);
    }, i * messageInterval);
    _timers.push(showTimer);

    // Fade out before next
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
      hueOverlay.classList.add('active');
      createParticles(settings.intensity);
    }, 400);
    _timers.push(transitionTimer);
  }, delayMs);
  _timers.push(phase2Timer);
};

/**
 * Create floating particles
 */
function createParticles(intensity) {
  var container = HypnoApp.$('#particles');
  var isMobile = window.innerWidth < 768;
  var count = isMobile ? 10 : 15;
  var colors = [
    'var(--accent-pink)',
    'var(--accent-purple)',
    'var(--accent-soft)',
    'var(--accent-rose)',
  ];

  for (var i = 0; i < count; i++) {
    var particle = document.createElement('div');
    particle.className = 'particle';

    var size = 4 + Math.random() * 6;
    var left = Math.random() * 100;
    var duration = 8 + Math.random() * 10;
    var delay = Math.random() * duration;
    var driftX = -40 + Math.random() * 80;
    var color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.cssText =
      'width:' + size + 'px;' +
      'height:' + size + 'px;' +
      'left:' + left + '%;' +
      'bottom:-' + size + 'px;' +
      'background:' + color + ';' +
      'animation-duration:' + duration + 's;' +
      'animation-delay:' + delay + 's;' +
      '--drift-x:' + driftX + 'px;' +
      'box-shadow:0 0 ' + (size * 2) + 'px ' + color + ';';

    container.appendChild(particle);
    _particles.push(particle);
  }
}

/**
 * Stop animation and clean up
 */
HypnoApp.stopAnimation = function() {
  var $ = HypnoApp.$;
  cleanup();

  var spiral = $('#spiral');
  var heart = $('#heart');
  var hueOverlay = $('#hue-overlay');
  var blackout = $('#blackout-overlay');

  if (spiral) spiral.classList.remove('active');
  if (heart) heart.classList.remove('active');
  if (hueOverlay) hueOverlay.classList.remove('active');
  if (blackout) blackout.classList.remove('hidden');
};

/**
 * Clean up all timers and particles
 */
function cleanup() {
  _timers.forEach(function(id) { clearTimeout(id); });
  _timers = [];

  _particles.forEach(function(p) {
    if (p.parentNode) p.parentNode.removeChild(p);
  });
  _particles = [];
}

window.HypnoApp = HypnoApp;
