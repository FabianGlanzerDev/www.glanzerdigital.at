'use strict';


function updateClock() {
  const now = new Date();
  const time = document.querySelector('[data-clock-time]');
  const date = document.querySelector('[data-clock-date]');
  if (time) time.textContent = now.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
  if (date) date.textContent = now.toLocaleDateString('de-AT');
}


function setActiveNavigation(id) {
  document.querySelectorAll('.admin-nav a').forEach((link) => {
    link.toggleAttribute('aria-current', link.getAttribute('href') === `#${id}`);
  });
}


function observeAdminSections() {
  const sections = document.querySelectorAll('[id].admin-section, #overview');
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(handleSectionEntries, { rootMargin: '-25% 0px -65%' });
  sections.forEach((section) => observer.observe(section));
}


function handleSectionEntries(entries) {
  const visible = entries.find((entry) => entry.isIntersecting);
  if (visible) setActiveNavigation(visible.target.id);
}


function handleRangeClick(event) {
  const button = event.target.closest('[data-range]');
  if (!(button instanceof HTMLButtonElement)) return;
  document.querySelectorAll('[data-range]').forEach((item) => item.removeAttribute('aria-pressed'));
  button.setAttribute('aria-pressed', 'true');
  window.GlanzerAdminAnalytics?.setRange(button.dataset.range || '30');
}


function initializeRangeButtons() {
  const group = document.querySelector('.admin-range');
  if (group) group.addEventListener('click', handleRangeClick);
}


function handleRefreshClick() {
  window.GlanzerAdminAnalytics?.refreshDashboard();
  runHealthCheck();
}


async function checkResource(path, selector) {
  const target = document.querySelector(selector);
  if (!target) return;
  try { target.textContent = (await fetch(path, { method: 'HEAD', cache: 'no-store' })).ok ? 'erreichbar' : 'Fehler'; }
  catch { target.textContent = 'nicht erreichbar'; }
}


function runHealthCheck() {
  checkResource('../sitemap.xml', '[data-health="sitemap"]');
  checkResource('../robots.txt', '[data-health="robots"]');
}


function initializeSystemActions() {
  document.querySelector('[data-refresh-dashboard]')?.addEventListener('click', handleRefreshClick);
  document.querySelector('[data-action="check-health"]')?.addEventListener('click', runHealthCheck);
}


function initializeAdminDashboard() {
  window.GlanzerAdminAuth?.renderAuthState();
  window.GlanzerAdminAnalytics?.initializeAnalyticsPanel();
  window.GlanzerAdminMaintenance?.initializeMaintenancePanel();
  initializeRangeButtons();
  initializeSystemActions();
  observeAdminSections();
  updateClock();
  runHealthCheck();
  window.setInterval(updateClock, 30000);
}


initializeAdminDashboard();
