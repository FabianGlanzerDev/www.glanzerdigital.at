/** Checks whether local preview. @returns {boolean} The operation result. */
function isLocalPreview() {
  return ['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.protocol === 'file:';
}



/** Applies local demo links. @returns {void} The operation result. */
function applyLocalDemoLinks() {
  if (!isLocalPreview()) return;
  document.querySelectorAll('[data-local-href]').forEach((link) => {
    link.setAttribute('href', link.dataset.localHref || link.getAttribute('href'));
  });
}



applyLocalDemoLinks();
