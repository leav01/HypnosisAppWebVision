// ===== Main Entry Point: Page Routing & Session Management =====

(function() {
  'use strict';

  var session = null;
  var $ = HypnoApp.$;

  /** Handle login form submission */
  function handleLogin(e) {
    e.preventDefault();

    var username = $('#input-username').value;
    var password = $('#input-password').value;
    var errorEl = $('#login-error');
    var card = $('#login-card');

    var result = HypnoApp.validateLogin(username, password);

    if (!result.valid) {
      // Show error
      errorEl.textContent = result.errorMessage;
      errorEl.classList.add('visible');

      // Shake card
      card.classList.remove('shake');
      void card.offsetWidth; // force reflow
      card.classList.add('shake');
      return;
    }

    // Success
    errorEl.classList.remove('visible');
    session = result.session;
    HypnoApp.renderDashboard(session);
    HypnoApp.showPage('dashboard');
  }

  /** Handle logout */
  function handleLogout() {
    session = null;
    $('#input-password').value = '';
    $('#login-error').classList.remove('visible');
    HypnoApp.showPage('login');
  }

  /** Handle start hypnosis */
  function handleStart() {
    var settings = HypnoApp.getSettings();
    var mode = HypnoApp.getSelectedMode();
    HypnoApp.showPage('animation');
    HypnoApp.startAnimation(settings, mode);
  }

  /** Handle exit animation */
  function handleExit() {
    HypnoApp.stopAnimation();
    HypnoApp.showPage('dashboard');
  }

  /** Global keyboard handler */
  function handleKeydown(e) {
    if (e.key === 'Escape') {
      // Close any open modal first
      var modals = document.querySelectorAll('.modal-overlay.visible');
      if (modals.length > 0) {
        modals.forEach(function(m) { m.classList.remove('visible'); });
        return;
      }
      // Exit animation
      if (document.body.dataset.activePage === 'animation') {
        handleExit();
      }
    }
  }

  /** Initialize */
  function init() {
    HypnoApp.showPage('login');

    // Login form
    $('#login-form').addEventListener('submit', handleLogin);

    // Logout
    $('#logout-button').addEventListener('click', handleLogout);

    // Start
    $('#start-button').addEventListener('click', handleStart);

    // Exit
    $('#exit-button').addEventListener('click', handleExit);

    // ESC key
    document.addEventListener('keydown', handleKeydown);

    // Footer: random terminal count
    var count = HypnoApp.randomInt(2000, 5000);
    $('#terminal-count').textContent = HypnoApp.formatNumber(count);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
