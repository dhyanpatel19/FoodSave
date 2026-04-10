/* ═══════════════════════════════════════════════════════
   FOODSAVE — SHARED SETTINGS SYNC  v2
   Persists and applies settings (name, theme, accent) 
   across every page via localStorage.
══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var KEY = 'fs_settings';

  var DEFAULTS = {
    firstName: 'Rahul',
    lastName: 'Chauhan',
    role: 'Canteen Manager',
    avatarInitials: 'RC',
    theme: 'light',
    accentColor: '#1D9E75',
    accentDark:  '#0F6E56',
    accentLight: '#E1F5EE',
    compactTables: false,
    animationsEnabled: true,
  };

  /* ── Internal helpers ── */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        return Object.assign({}, DEFAULTS, parsed);
      }
    } catch (e) {}
    return Object.assign({}, DEFAULTS);
  }

  function save(obj) {
    try {
      localStorage.setItem(KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('FoodSettings: localStorage not available', e);
    }
  }

  /* ── apply theme ── */
  function applyTheme(s) {
    var mode = s.theme || 'light';
    var isDark = mode === 'dark' ||
      (mode === 'system' && window.matchMedia &&
       window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.body.classList.toggle('dark-mode', isDark);
    document.documentElement.classList.toggle('dark-mode', isDark);
  }

  /* ── apply accent colour ── */
  function applyAccent(s) {
    var color = s.accentColor || DEFAULTS.accentColor;
    var dark   = s.accentDark  || DEFAULTS.accentDark;
    var light  = s.accentLight || DEFAULTS.accentLight;
    var root   = document.documentElement;
    root.style.setProperty('--accent',       color);
    root.style.setProperty('--accent-dark',  dark);
    root.style.setProperty('--accent-light', light);
    /* Dynamic nav highlight rule */
    var styleId = 'fs-accent-style';
    var el = document.getElementById(styleId) || document.createElement('style');
    el.id  = styleId;
    el.textContent =
      '.nav-item.active{background:' + hex2rgba(color, 0.15) + '!important;' +
        'color:' + color + '!important;border-left-color:' + color + '!important}';
    if (!el.parentNode) document.head.appendChild(el);
  }

  /* ── apply name everywhere ── */
  function applyName(s) {
    var full     = (s.firstName || 'Rahul') + ' ' + (s.lastName || 'Chauhan');
    var initials = s.avatarInitials ||
      ((s.firstName || 'R')[0] + (s.lastName || 'C')[0]).toUpperCase();
    var role = s.role || 'Canteen Manager';

    document.querySelectorAll('.user-name').forEach(function (el) {
      el.textContent = full;
    });
    document.querySelectorAll('.user-role').forEach(function (el) {
      el.textContent = role;
    });
    document.querySelectorAll('.avatar').forEach(function (el) {
      if (!el.querySelector('img[src]:not([src=""])')) {
        el.textContent = initials;
      }
    });

    /* Settings page specific */
    var dn = document.getElementById('displayName');
    if (dn) dn.textContent = full;
    var ai = document.getElementById('avatarInitials');
    if (ai) ai.textContent = initials;
  }

  /* ── apply compact tables ── */
  function applyCompact(s) {
    document.body.classList.toggle('compact-tables', !!s.compactTables);
  }

  /* ── apply animations ── */
  function applyAnimations(s) {
    document.body.classList.toggle('no-animations', s.animationsEnabled === false);
  }

  /* ── apply ALL ── */
  function applyAll(s) {
    s = s || load();
    applyTheme(s);
    applyAccent(s);
    applyName(s);
    applyCompact(s);
    applyAnimations(s);
  }

  /* ── PUBLIC API ── */
  window.FoodSettings = {

    /** Get all settings (merged with defaults) */
    get: function (key) {
      var s = load();
      return key !== undefined ? s[key] : s;
    },

    /** Save ONE key and reapply everywhere */
    set: function (key, value) {
      var s = load();
      s[key] = value;
      save(s);
      applyAll(s);
    },

    /** Save an ENTIRE settings object and reapply */
    save: function (obj) {
      save(obj);
    },

    /** Re-apply current saved settings to the page */
    apply: function (obj) {
      applyAll(obj || load());
    },

    /** Debug: log to console */
    debug: function () {
      console.log('FoodSettings:', load());
    }
  };

  /* ══════════════════
     THEME FLASH FIX
     Apply theme + accent IMMEDIATELY (before DOM loads)
     so there's no white-flash when dark mode is on.
  ═════════════════════ */
  (function earlyApply() {
    var early = load();
    var isDark = early.theme === 'dark' ||
      (early.theme === 'system' && window.matchMedia &&
       window.matchMedia('(prefers-color-scheme: dark)').matches);
    /* Set class on <html> immediately */
    if (isDark) document.documentElement.classList.add('dark-mode');
    /* Accent vars on :root immediately */
    var root = document.documentElement;
    root.style.setProperty('--accent',       early.accentColor || DEFAULTS.accentColor);
    root.style.setProperty('--accent-dark',  early.accentDark  || DEFAULTS.accentDark);
    root.style.setProperty('--accent-light', early.accentLight || DEFAULTS.accentLight);
  })();

  /* ══════════════════
     APPLY ON DOM READY
     Updates name, sidebar, etc. once elements exist.
  ═════════════════════ */
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn(); /* already loaded */
    }
  }

  onReady(function () {
    applyAll();

    /* Pre-fill settings form fields from saved values */
    var s = load();
    var fnEl = document.getElementById('firstName');
    var lnEl = document.getElementById('lastName');
    var roleEl = document.getElementById('role');
    if (fnEl) fnEl.value = s.firstName || 'Rahul';
    if (lnEl) lnEl.value = s.lastName  || 'Chauhan';
    if (roleEl) {
      /* Select matching option */
      for (var i = 0; i < roleEl.options.length; i++) {
        if (roleEl.options[i].text === s.role) {
          roleEl.selectedIndex = i;
          break;
        }
      }
    }

    /* Theme buttons */
    document.querySelectorAll('.theme-opt[data-mode]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.mode === (s.theme || 'light'));
    });

    /* Accent swatches */
    var SWATCH_MAP = {
      green: '#1D9E75', blue: '#185FA5', purple: '#534AB7',
      red: '#E24B4A', amber: '#EF9F27', teal: '#0097A7'
    };
    document.querySelectorAll('.swatch[data-color]').forEach(function (sw) {
      sw.classList.toggle('selected',
        SWATCH_MAP[sw.dataset.color] === (s.accentColor || DEFAULTS.accentColor));
    });

    /* Compact / anim toggles */
    var compactEl = document.getElementById('compactToggle');
    var animEl    = document.getElementById('animToggle');
    if (compactEl) compactEl.checked = !!s.compactTables;
    if (animEl)    animEl.checked    = s.animationsEnabled !== false;
  });

  /* Listen for system theme changes */
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (load().theme === 'system') applyAll();
    });
  }

  /* ── Util: hex → rgba string ── */
  function hex2rgba(hex, alpha) {
    hex = (hex || '#000').replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    var r = parseInt(hex.substr(0,2), 16);
    var g = parseInt(hex.substr(2,2), 16);
    var b = parseInt(hex.substr(4,2), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha || 1) + ')';
  }

})();
