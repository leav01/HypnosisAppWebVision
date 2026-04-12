// ===== Dashboard: User Info, Sliders, Start Button =====

var HypnoApp = window.HypnoApp || {};

// Current settings state (immutable, replaced on each slider change)
var _settings = null;
var _selectedMode = 'hypnosis';

/**
 * Get current settings (frozen object)
 */
HypnoApp.getSettings = function() {
  return _settings;
};

/**
 * Render the dashboard with session data
 */
HypnoApp.renderDashboard = function(session) {
  var $ = HypnoApp.$;

  // User info
  $('#user-name').textContent = session.username;
  $('#level-text').textContent = 'Lv.' + session.level;

  // Tier badge
  var badge = $('#tier-badge');
  badge.innerHTML = '<i class="' + session.tierIcon + '"></i> ' + session.tierName;

  // Status dot
  var dot = $('#status-dot');
  dot.className = 'status-dot';
  dot.classList.add(session.usageCount >= session.maxUsage ? 'limited' : 'active');

  // Usage
  var usagePercent = Math.min((session.usageCount / session.maxUsage) * 100, 100);
  $('#usage-count').textContent = session.usageCount + ' / ' + session.maxUsage;

  // Progress bar
  var fill = $('#progress-bar-fill');
  fill.style.width = usagePercent + '%';
  fill.className = 'progress-bar-fill';
  if (usagePercent >= 100) {
    fill.classList.add('danger');
  } else if (usagePercent > 80) {
    fill.classList.add('warning');
  }

  // Start button / usage limit
  var startBtn = $('#start-button');
  var warning = $('#usage-warning');
  if (session.usageCount >= session.maxUsage) {
    startBtn.disabled = true;
    warning.textContent = '本月使用次数已达上限，请联系管理员';
  } else {
    startBtn.disabled = false;
    warning.textContent = '';
  }

  // Reset sliders to defaults
  _settings = HypnoApp.createState(HypnoApp.DEFAULT_SETTINGS);
  initSliders();

  // Init mode selector
  _selectedMode = 'hypnosis';
  initModeSelector();
  initModal();
  initSettingDetailButtons();
};

/**
 * Initialize slider values and attach listeners
 */
function initSliders() {
  var $ = HypnoApp.$;

  HypnoApp.SLIDER_CONFIG.forEach(function(cfg) {
    var slider = $('#slider-' + cfg.key);
    var valueEl = $('#value-' + cfg.key);

    if (!slider || !valueEl) return;

    // Set default value
    slider.value = _settings[cfg.key];
    valueEl.textContent = cfg.format(_settings[cfg.key]);

    // Clone to remove old listeners
    var newSlider = slider.cloneNode(true);
    slider.parentNode.replaceChild(newSlider, slider);

    // Attach new listener
    newSlider.addEventListener('input', function() {
      var value = parseInt(newSlider.value, 10);
      _settings = HypnoApp.updateState(_settings, { [cfg.key]: value });
      valueEl.textContent = cfg.format(value);
    });
  });
}

/**
 * Get currently selected mode key
 */
HypnoApp.getSelectedMode = function() {
  return _selectedMode;
};

/**
 * Initialize mode selector buttons
 */
function initModeSelector() {
  var $ = HypnoApp.$;
  var grid = $('#mode-grid');
  if (!grid) return;

  var buttons = grid.querySelectorAll('.mode-card');
  buttons.forEach(function(btn) {
    // Clone to remove old listeners
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', function() {
      _selectedMode = newBtn.dataset.mode;
      // Update active state
      grid.querySelectorAll('.mode-card').forEach(function(b) {
        b.classList.remove('active');
      });
      newBtn.classList.add('active');
    });
  });

  // Ensure default is active
  var defaultBtn = grid.querySelector('[data-mode="hypnosis"]');
  if (defaultBtn) defaultBtn.classList.add('active');
}

/**
 * Initialize modal open/close
 */
function initModal() {
  var $ = HypnoApp.$;
  var modal = $('#mode-modal');
  var openBtn = $('#mode-detail-btn');
  var closeBtn = $('#modal-close');
  var body = $('#modal-body');

  if (!modal || !openBtn) return;

  // Build modal content from MODES config
  body.innerHTML = '';
  HypnoApp.MODES.forEach(function(mode) {
    var block = document.createElement('div');
    block.className = 'modal-mode-block';

    var detailsHtml = mode.details.map(function(d) {
      return '<li>' + escapeHtml(d) + '</li>';
    }).join('');

    block.innerHTML =
      '<div class="modal-mode-name">' +
        '<i class="' + mode.fallbackIcon + '"></i>' +
        '<span>' + escapeHtml(mode.name) + '</span>' +
      '</div>' +
      '<p class="modal-mode-desc">' + escapeHtml(mode.description) + '</p>' +
      '<ul class="modal-mode-details">' + detailsHtml + '</ul>';

    body.appendChild(block);
  });

  // Open
  openBtn.addEventListener('click', function() {
    modal.classList.add('visible');
  });

  // Close button
  closeBtn.addEventListener('click', function() {
    modal.classList.remove('visible');
  });

  // Click outside to close
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.remove('visible');
    }
  });
}

/**
 * Initialize setting detail buttons (the small info icons on each slider card)
 */
function initSettingDetailButtons() {
  var $ = HypnoApp.$;
  var modal = $('#setting-modal');
  var closeBtn = $('#setting-modal-close');
  var titleEl = $('#setting-modal-title');
  var bodyEl = $('#setting-modal-body');

  if (!modal) return;

  // Attach click to each detail button
  var buttons = document.querySelectorAll('.setting-detail-btn');
  buttons.forEach(function(btn) {
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', function() {
      var key = newBtn.dataset.setting;
      var cfg = HypnoApp.SLIDER_CONFIG.find(function(c) { return c.key === key; });
      if (!cfg || !cfg.details) return;

      // Set title
      titleEl.innerHTML =
        '<i class="fa-solid fa-' + cfg.icon + '"></i>' +
        '<span>' + escapeHtml(cfg.label) + '</span>';

      // Build body
      bodyEl.innerHTML = '';
      var block = document.createElement('div');
      block.className = 'modal-mode-block';

      var desc = '<p class="modal-mode-desc">' + escapeHtml(cfg.description) + '</p>';
      var detailsHtml = cfg.details.map(function(d) {
        return '<li>' + escapeHtml(d) + '</li>';
      }).join('');

      block.innerHTML = desc + '<ul class="modal-mode-details">' + detailsHtml + '</ul>';
      bodyEl.appendChild(block);

      modal.classList.add('visible');
    });
  });

  // Close
  closeBtn.addEventListener('click', function() {
    modal.classList.remove('visible');
  });

  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.remove('visible');
    }
  });
}

/**
 * Simple HTML escape
 */
function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.HypnoApp = HypnoApp;
