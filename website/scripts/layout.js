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


/** Loads and renders the shared header and footer templates. */
async function renderLayout() {
  const rootPath = document.body.dataset.root || '.';
  const activePage = document.body.dataset.page || '';
  const loader = window.GlanzerTemplates;
  if (!loader) throw new Error('Template Loader fehlt.');
  const [headerTemplate, footerTemplate] = await Promise.all([
    loader.loadTemplate(rootPath, 'header'), loader.loadTemplate(rootPath, 'footer'),
  ]);
  renderLayoutTargets(headerTemplate, footerTemplate, rootPath, activePage);
}


/** Inserts the loaded layout templates into their target elements. */
function renderLayoutTargets(headerTemplate, footerTemplate, rootPath, activePage) {
  const header = document.querySelector('[data-site-header]');
  const footer = document.querySelector('[data-site-footer]');
  const loader = window.GlanzerTemplates;
  if (header) header.innerHTML = loader.fillTemplate(headerTemplate, getHeaderValues(rootPath, activePage));
  if (footer) footer.innerHTML = loader.fillTemplate(footerTemplate, { ROOT: rootPath });
}


window.GlanzerLayout = { render: renderLayout };
