/* ═══════════════════════════════════════════════
   FOODSAVE — SHARED MOBILE MENU JAVASCRIPT
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  function initMobileMenu() {
    const sidebar  = document.querySelector('.sidebar');
    const overlay  = document.getElementById('sidebarOverlay');
    const hamburger = document.getElementById('hamburgerBtn');

    if (!sidebar || !overlay || !hamburger) return;

    function openSidebar() {
      sidebar.classList.add('open');
      overlay.classList.add('open');
      hamburger.classList.add('open');
      document.body.classList.add('sidebar-open');
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.classList.remove('sidebar-open');
    }

    function toggleSidebar() {
      if (sidebar.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    }

    hamburger.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleSidebar();
    });

    overlay.addEventListener('click', closeSidebar);

    // Close on nav link click (mobile)
    sidebar.querySelectorAll('.nav-item').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 900) closeSidebar();
      });
    });

    // Close on resize to desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeSidebar();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
  } else {
    initMobileMenu();
  }
})();
