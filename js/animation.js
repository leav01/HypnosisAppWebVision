// ===== Hypnosis Animation Controller =====

var HypnoApp = window.HypnoApp || {};

// Timer/interval IDs for cleanup
var _timers = [];
var _intervals = [];
var _rings = [];

// Heart SVG path (standard heart shape, viewBox 0 0 24 24)
var HEART_SVG_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

// Track if spiral has been drawn
var _spiralDrawn = false;

// Matrix rain character pool (Japanese, Chinese, Korean, Thai, symbols, digits, letters)
var MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
  '催眠服従改変記憶意識心脳思考支配制御覚醒夢幻想現実崩壊再構築' +
  'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ가나다라마바사아자차카타파하' +
  'กขคงจฉชซญฎฏฐดตถทธนบปผฝพฟภมยรลวศษสหอ' +
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' +
  '@#$%&=+<>◆◇▲▼●○★☆∞§†‡¶∂∆∑∏√∫≈≠≡±×÷';

// Mode -> which elements to show
var MODE_ELEMENTS = {
  hypnosis:    { spiral: false, spiralConic: true,  heart: false, heartRings: false, matrixRain: false, brainIcon: false },
  arousal:     { spiral: false, spiralConic: false, heart: true,  heartRings: true,  matrixRain: false, brainIcon: false },
  restraint:   { spiral: true,  spiralConic: false, heart: false, heartRings: false, matrixRain: false, brainIcon: false },
  mindRewrite: { spiral: false, spiralConic: false, heart: false, heartRings: false, matrixRain: true,  brainIcon: true  },
};

/**
 * Draw an Archimedean spiral on a canvas element
 */
function drawSpiralOnCanvas(canvas) {
  if (!canvas) return;

  var size = Math.max(window.innerWidth, window.innerHeight) * 2.5;
  canvas.width = size;
  canvas.height = size;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';

  var ctx = canvas.getContext('2d');
  var cx = size / 2;
  var cy = size / 2;

  // Black background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);

  // Archimedean spiral: r = a * theta
  var spacing = 30;
  var a = spacing / (2 * Math.PI);
  var maxRadius = size / 2;
  var maxTheta = maxRadius / a;
  var lineWidth = 12;

  ctx.strokeStyle = '#c040ff';
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();

  var step = 0.08;
  for (var t = 0; t <= maxTheta; t += step) {
    var r = a * t;
    var x = cx + r * Math.cos(t);
    var y = cy + r * Math.sin(t);
    if (t === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

/**
 * Draw spiral on canvas
 */
function drawSpiral() {
  if (_spiralDrawn) return;
  drawSpiralOnCanvas(HypnoApp.$('#spiral-conic'));
  _spiralDrawn = true;
}

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
HypnoApp.startAnimation = function(settings, mode) {
  var $ = HypnoApp.$;
  cleanup();

  var container = $('#animation-container');
  var blackout = $('#blackout-overlay');
  var blackoutText = $('#blackout-text');
  var spiral = $('#spiral');
  var spiralConic = $('#spiral-conic');
  var heart = $('#heart');
  var matrixRain = $('#matrix-rain');
  var brainIcon = $('#brain-icon');

  // Determine which elements to show for this mode
  var elements = MODE_ELEMENTS[mode] || MODE_ELEMENTS.hypnosis;

  // Apply intensity settings
  var intensityConfig = getIntensityConfig(settings.intensity);
  container.style.setProperty('--heartbeat-speed', intensityConfig.heartbeatSpeed);
  container.style.setProperty('--expand-speed', intensityConfig.expandSpeed + 's');
  container.style.setProperty('--rotation-speed', intensityConfig.rotationSpeed);

  // Reset all states
  blackout.classList.remove('hidden');
  blackoutText.classList.remove('visible');
  blackoutText.textContent = '';
  spiral.classList.remove('active');
  spiralConic.classList.remove('active');
  heart.classList.remove('active');
  matrixRain.classList.remove('active');
  matrixRain.innerHTML = '';
  brainIcon.classList.remove('active');

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

      // Activate elements based on mode
      if (elements.spiral)      spiral.classList.add('active');
      if (elements.spiralConic) { drawSpiral(); spiralConic.classList.add('active'); }
      if (elements.heart)       heart.classList.add('active');
      if (elements.heartRings)  startHeartRings(intensityConfig);
      if (elements.matrixRain)  { matrixRain.classList.add('active'); startMatrixRain(intensityConfig); }
      if (elements.brainIcon)   brainIcon.classList.add('active');

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
 * Start spawning heart-shaped rings at regular intervals
 */
function startHeartRings(intensityConfig) {
  // Heart rings need longer duration than circle rings (3x slower)
  var expandMs = parseFloat(intensityConfig.expandSpeed) * 1000 * 3;
  var spawnInterval = expandMs / 5;

  // Spawn first immediately
  spawnHeartRing(expandMs);

  var intervalId = setInterval(function() {
    spawnHeartRing(expandMs);
  }, spawnInterval);
  _intervals.push(intervalId);
}

/**
 * Create a single expanding heart-shaped ring (SVG outline)
 */
function spawnHeartRing(expandMs) {
  var container = HypnoApp.$('#heart-rings');
  if (!container) return;

  var ring = document.createElement('div');
  ring.className = 'heart-ring';
  ring.style.animationDuration = expandMs + 'ms';
  ring.innerHTML =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="' + HEART_SVG_PATH + '" fill="none" stroke="#c040ff" stroke-width="1"/>' +
    '</svg>';

  container.appendChild(ring);
  _rings.push(ring);

  // Remove after animation completes
  var removeTimer = setTimeout(function() {
    if (ring.parentNode) ring.parentNode.removeChild(ring);
    var idx = _rings.indexOf(ring);
    if (idx > -1) _rings.splice(idx, 1);
  }, expandMs + 100);
  _timers.push(removeTimer);
}

/**
 * Stop animation and clean up
 */
HypnoApp.stopAnimation = function() {
  var $ = HypnoApp.$;
  cleanup();

  var spiral = $('#spiral');
  var spiralConic = $('#spiral-conic');
  var heart = $('#heart');
  var matrixRain = $('#matrix-rain');
  var brainIcon = $('#brain-icon');
  var blackout = $('#blackout-overlay');

  if (spiral) spiral.classList.remove('active');
  if (spiralConic) spiralConic.classList.remove('active');
  if (heart) heart.classList.remove('active');
  if (matrixRain) { matrixRain.classList.remove('active'); matrixRain.innerHTML = ''; }
  if (brainIcon) brainIcon.classList.remove('active');
  if (blackout) blackout.classList.remove('hidden');
};

/**
 * Start matrix rain effect
 */
function startMatrixRain(intensityConfig) {
  var container = HypnoApp.$('#matrix-rain');
  if (!container) return;

  var columnCount = Math.floor(window.innerWidth / 14);
  var baseSpeed = 4 + (1 - parseFloat(intensityConfig.expandSpeed) / 3) * 3;

  for (var i = 0; i < columnCount; i++) {
    createMatrixColumn(container, i, columnCount, baseSpeed);
  }

  // Random glitch flashes
  var glitchInterval = setInterval(function() {
    if (Math.random() < 0.3) {
      triggerGlitch();
    }
  }, 2000);
  _intervals.push(glitchInterval);
}

/**
 * Create a single matrix rain column
 */
function createMatrixColumn(container, index, totalColumns, baseSpeed) {
  var col = document.createElement('div');
  col.className = 'matrix-column';
  col.style.left = (index / totalColumns * 100) + '%';

  var speed = baseSpeed + Math.random() * 4;
  var delay = Math.random() * speed;
  col.style.animationDuration = speed + 's';
  col.style.animationDelay = '-' + delay + 's';

  // Generate random characters
  var charCount = 20 + Math.floor(Math.random() * 20);
  var html = '';
  for (var j = 0; j < charCount; j++) {
    var ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
    html += '<span>' + ch + '</span>';
  }
  col.innerHTML = html;

  container.appendChild(col);

  // Periodically swap characters and randomly highlight
  var swapInterval = setInterval(function() {
    var spans = col.querySelectorAll('span');
    if (spans.length === 0) return;

    // Swap a random character
    var idx = Math.floor(Math.random() * spans.length);
    spans[idx].textContent = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];

    // Random highlight: pick a random span to glow bright
    var hlIdx = Math.floor(Math.random() * spans.length);
    spans[hlIdx].classList.add('bright');

    // Remove highlight after a short time
    var hlTimer = setTimeout(function() {
      spans[hlIdx].classList.remove('bright');
    }, 150 + Math.random() * 300);
    _timers.push(hlTimer);
  }, 100 + Math.random() * 200);
  _intervals.push(swapInterval);
}

/**
 * Trigger a brief glitch flash
 */
function triggerGlitch() {
  var flash = HypnoApp.$('#glitch-flash');
  if (!flash) return;
  flash.classList.remove('flash');
  void flash.offsetWidth;
  flash.classList.add('flash');
}

/**
 * Clean up all timers, intervals, and spawned elements
 */
function cleanup() {
  _timers.forEach(function(id) { clearTimeout(id); });
  _timers = [];
  _spiralDrawn = false;

  _intervals.forEach(function(id) { clearInterval(id); });
  _intervals = [];

  _rings.forEach(function(el) {
    if (el.parentNode) el.parentNode.removeChild(el);
  });
  _rings = [];
}

window.HypnoApp = HypnoApp;
