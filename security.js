// Nadaara Hub — Client-side security utilities
(function () {
  'use strict';

  // ── 1. Rate limiting (login brute-force protection) ──────────
  var RATE_KEY  = '_nh_rl';
  var MAX_TRIES = 5;
  var LOCK_MS   = 15 * 60 * 1000; // 15 minutes

  function lsGet(key) {
    try { return localStorage.getItem(key); } catch(e) { return null; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, val); } catch(e) {}
  }
  function lsRemove(key) {
    try { localStorage.removeItem(key); } catch(e) {}
  }

  window.NHSec = {

    checkRate: function () {
      var raw  = lsGet(RATE_KEY);
      var data = raw ? JSON.parse(raw) : { count: 0, until: 0 };
      if (data.until && Date.now() < data.until) {
        var mins = Math.ceil((data.until - Date.now()) / 60000);
        return { allowed: false, mins: mins };
      }
      return { allowed: true };
    },

    recordFail: function () {
      var raw  = lsGet(RATE_KEY);
      var data = raw ? JSON.parse(raw) : { count: 0, until: 0 };
      data.count += 1;
      if (data.count >= MAX_TRIES) {
        data.until = Date.now() + LOCK_MS;
        data.count = 0;
      }
      lsSet(RATE_KEY, JSON.stringify(data));
    },

    clearRate: function () {
      lsRemove(RATE_KEY);
    },

    // ── 2. Input sanitization ───────────────────────────────────
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

    // ── 3. Email validation ─────────────────────────────────────
    validEmail: function (email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    },

    // ── 4. Honeypot check ───────────────────────────────────────
    honeyFilled: function (fieldId) {
      var el = document.getElementById(fieldId);
      return el && el.value.length > 0;
    },

    // ── 5. Clear sensitive fields on tab hide ───────────────────
    initVisibilityGuard: function (sensitiveIds) {
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          sensitiveIds.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
          });
        }
      });
    }
  };

  // ── 6. Block iframe embedding ────────────────────────────────
  if (window.top !== window.self) {
    try { window.top.location = window.self.location; } catch(e) {}
  }

})();
