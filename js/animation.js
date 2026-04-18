// ===== Hypnosis Animation Controller =====

var HypnoApp = window.HypnoApp || {};

// Timer/interval IDs for cleanup
var _timers = [];
var _intervals = [];
var _rings = [];

// Matrix rain shared-scheduler state (cleaned in cleanup())
var _matrixRafId = 0;
var _matrixColumns = [];      // { el, spans }
var _brightSpans = [];        // { span, expireAt }

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

  // Resolve unified per-mode durations from the continuous intensity curve.
  var durations = HypnoApp.getAnimationDurations(settings.intensity);
  container.style.setProperty('--heartbeat-speed',   durations.heartbeat + 's');
  container.style.setProperty('--expand-speed',      durations.ringExpand + 's');
  container.style.setProperty('--rotation-speed',    durations.rotation + 's');
  container.style.setProperty('--heart-ring-expand', durations.heartRingExpand + 's');

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
      if (elements.heartRings)  startHeartRings(durations);
      if (elements.matrixRain)  { matrixRain.classList.add('active'); startMatrixRain(durations); }
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
 * Start spawning heart-shaped rings at regular intervals.
 * Duration comes directly from the unified curve — no magic multiplier.
 */
function startHeartRings(durations) {
  var expandMs = durations.heartRingExpand * 1000;
  var spawnInterval = expandMs / 5;

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
 * Pick column spacing based on viewport — denser on desktop, sparser on mobile.
 */
function getMatrixColumnSpacing() {
  var w = window.innerWidth;
  if (w < 640) return 28;   // phone
  if (w < 1024) return 24;  // tablet
  return 22;                // desktop
}

/**
 * Start matrix rain effect using a single shared rAF scheduler.
 * Falls at durations.matrixFall seconds ± 30% random per column.
 */
function startMatrixRain(durations) {
  var container = HypnoApp.$('#matrix-rain');
  if (!container) return;

  var spacing = getMatrixColumnSpacing();
  var columnCount = Math.floor(window.innerWidth / spacing);
  var fallBase = durations.matrixFall;

  _matrixColumns = [];
  _brightSpans = [];

  var frag = document.createDocumentFragment();
  for (var i = 0; i < columnCount; i++) {
    var col = buildMatrixColumn(i, columnCount, fallBase);
    frag.appendChild(col.el);
    _matrixColumns.push(col);
  }
  container.appendChild(frag);

  // Shared rAF scheduler: char swaps + bright-span expiry sweep.
  var swapPerFrame = Math.max(2, Math.round(columnCount * 0.08));
  var swapAvgMs = durations.matrixSwap * 1000;
  var lastSwapAt = 0;

  function tick(now) {
    // 1. Swap a handful of characters each tick, paced by matrixSwap duration.
    if (now - lastSwapAt >= swapAvgMs * 0.5) {
      lastSwapAt = now;
      for (var s = 0; s < swapPerFrame; s++) {
        var col = _matrixColumns[(Math.random() * _matrixColumns.length) | 0];
        if (!col || !col.spans.length) continue;
        var spanIdx = (Math.random() * col.spans.length) | 0;
        col.spans[spanIdx].textContent = MATRIX_CHARS[(Math.random() * MATRIX_CHARS.length) | 0];

        // Frequently mark a span as bright (deferred expiry).
        if (Math.random() < 0.85) {
          var hi = col.spans[(Math.random() * col.spans.length) | 0];
          if (!hi.classList.contains('bright')) {
            hi.classList.add('bright');
            _brightSpans.push({ span: hi, expireAt: now + 450 + Math.random() * 600 });
          }
        }
      }
    }

    // 2. Sweep expired highlights.
    for (var b = _brightSpans.length - 1; b >= 0; b--) {
      if (_brightSpans[b].expireAt <= now) {
        _brightSpans[b].span.classList.remove('bright');
        _brightSpans.splice(b, 1);
      }
    }

    _matrixRafId = requestAnimationFrame(tick);
  }
  _matrixRafId = requestAnimationFrame(tick);

  // Occasional glitch flash — slightly slower cadence than before.
  var glitchMs = Math.max(800, durations.glitchCheck * 1000);
  var glitchInterval = setInterval(function() {
    if (Math.random() < 0.25) triggerGlitch();
  }, glitchMs);
  _intervals.push(glitchInterval);
}

/**
 * Build a single matrix rain column DOM node and return { el, spans }.
 * The column uses a pure CSS keyframe for fall; no per-column JS timers.
 */
function buildMatrixColumn(index, totalColumns, fallBase) {
  var el = document.createElement('div');
  el.className = 'matrix-column';
  el.style.left = (index / totalColumns * 100) + '%';

  // Per-column speed: baseline ± 30% for natural desynchronization.
  var speed = fallBase * (0.85 + Math.random() * 0.3);
  var delay = Math.random() * speed;
  el.style.animationDuration = speed + 's';
  el.style.animationDelay = '-' + delay + 's';

  var charCount = 20 + ((Math.random() * 20) | 0);
  var html = '';
  for (var j = 0; j < charCount; j++) {
    html += '<span>' + MATRIX_CHARS[(Math.random() * MATRIX_CHARS.length) | 0] + '</span>';
  }
  el.innerHTML = html;

  return { el: el, spans: Array.prototype.slice.call(el.children) };
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
 * Clean up all timers, intervals, rAF loops, and spawned elements
 */
function cleanup() {
  _timers.forEach(function(id) { clearTimeout(id); });
  _timers = [];
  _spiralDrawn = false;

  _intervals.forEach(function(id) { clearInterval(id); });
  _intervals = [];

  if (_matrixRafId) {
    cancelAnimationFrame(_matrixRafId);
    _matrixRafId = 0;
  }
  _matrixColumns = [];
  _brightSpans = [];

  _rings.forEach(function(el) {
    if (el.parentNode) el.parentNode.removeChild(el);
  });
  _rings = [];
}

window.HypnoApp = HypnoApp;
