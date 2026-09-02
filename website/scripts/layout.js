'use strict';


/** Returns aria-current for the active navigation item. */
function getCurrentAttribute(pageName, activePage) {
  return pageName === activePage ? 'aria-current="page"' : '';
}


/** Returns the placeholder values used by the header template. */
function getHeaderValues(rootPath, activePage) {
  return {
    ROOT: rootPath,
    HOME_CURRENT: getCurrentAttribute('home', activePage),
    SERVICES_CURRENT: getCurrentAttribute('services', activePage),
    PORTFOLIO_CURRENT: getCurrentAttribute('portfolio', activePage),
    ABOUT_CURRENT: getCurrentAttribute('about', activePage),
  };
}


/** Renders the shared header and footer templates. */
function renderLayout() {
  const rootPath = document.body.dataset.root || '.';
  const activePage = document.body.dataset.page || '';
  const templates = window.GlanzerTemplateLibrary;
  const renderer = window.GlanzerTemplateRenderer;
  if (!templates || !renderer) throw new Error('Templates fehlen.');
  renderLayoutTargets(templates, renderer, rootPath, activePage);
}


/** Inserts the shared templates into their target elements. */
function renderLayoutTargets(templates, renderer, rootPath, activePage) {
  const header = document.querySelector('[data-site-header]');
  const footer = document.querySelector('[data-site-footer]');
  if (header) header.innerHTML = renderer.fill(templates.header, getHeaderValues(rootPath, activePage));
  if (footer) footer.innerHTML = renderer.fill(templates.footer, { ROOT: rootPath });
}


window.GlanzerLayout = { render: renderLayout };
