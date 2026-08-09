// Nadaara Hub — Client-side security utilities
(function () {
  'use strict';

  var RATE_KEY  = '_nh_rl';
  var MAX_TRIES = 5;
  var LOCK_MS   = 15 * 60 * 1000;

  window.NHSec = {

    checkRate: function () {
      var raw  = localStorage.getItem(RATE_KEY);
      var data = raw ? JSON.parse(raw) : { count: 0, until: 0 };
      if (data.until && Date.now() < data.until) {
        var mins = Math.ceil((data.until - Date.now()) / 60000);
        return { allowed: false, mins: mins };
      }
      return { allowed: true };
    },

    recordFail: function () {
      var raw  = localStorage.getItem(RATE_KEY);
      var data = raw ? JSON.parse(raw) : { count: 0, until: 0 };
      data.count += 1;
      if (data.count >= MAX_TRIES) {
        data.until = Date.now() + LOCK_MS;
        data.count = 0;
      }
      localStorage.setItem(RATE_KEY, JSON.stringify(data));
    },

    clearRate: function () {
      localStorage.removeItem(RATE_KEY);
    },

    sanitize: function (str) {
      return String(str || '')
        .trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .slice(0, 2000);
    },

    validEmail: function (email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    },

    honeyFilled: function (fieldId) {
      var el = document.getElementById(fieldId);
      return el && el.value.length > 0;
    },

    initVisibilityGuard: function (ids) {
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          ids.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
          });
        }
      });
    }
  };

  // Block iframe embedding
  if (window.top !== window.self) {
    window.top.location = window.self.location;
  }

  // Disable right-click on production
  document.addEventListener('contextmenu', function (e) {
    if (window.location.hostname !== 'localhost') e.preventDefault();
  });

})();
