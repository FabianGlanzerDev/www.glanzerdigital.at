const HEADER_TEMPLATE = `
  <div class="container header-inner">
    <a class="brand" href="{{ROOT}}/index.html" aria-label="Glanzer Digital Startseite">
      <img src="{{ROOT}}/assets/images/logos/glanzerdigital-neon-logo.webp" alt="Glanzer Digital">
    </a>

    <button class="nav-toggle" type="button" aria-label="Navigation öffnen" aria-expanded="false" aria-controls="main-navigation" data-nav-toggle>
      <span></span>
      <span></span>
      <span></span>
    </button>

    <nav class="site-nav" id="main-navigation" aria-label="Hauptnavigation" data-nav data-open="false">
      <ul>
        <li><a href="{{ROOT}}/index.html" {{HOME_CURRENT}}>Home</a></li>
        <li><a href="{{ROOT}}/subpages/leistungen.html" {{SERVICES_CURRENT}}>Leistungen</a></li>
        <li><a href="{{ROOT}}/subpages/portfolio.html" {{PORTFOLIO_CURRENT}}>Portfolio</a></li>
        <li><a href="{{ROOT}}/subpages/ueber-mich.html" {{ABOUT_CURRENT}}>Über mich</a></li>
      </ul>
      <button class="language-toggle" type="button" data-language-toggle aria-label="Sprache auf Englisch wechseln" title="English">EN</button>
      <a class="button button--primary button--small" href="{{ROOT}}/subpages/kontakt.html">Projekt anfragen</a>
    </nav>
  </div>
`;

const FOOTER_TEMPLATE = `
  <div class="container">
    <div class="footer-grid">
      <div>
        <a class="footer-brand" href="{{ROOT}}/index.html">
          <img src="{{ROOT}}/assets/images/logos/glanzerdigital-neon-logo.webp" alt="Glanzer Digital">
        </a>
        <p class="footer-copy">Webentwicklung, Softwarelösungen und digitale Werkzeuge mit persönlicher Betreuung.</p>
      </div>

      <div>
        <div class="footer-title">Navigation</div>
        <div class="footer-links">
          <a href="{{ROOT}}/subpages/leistungen.html">Leistungen</a>
          <a href="{{ROOT}}/subpages/portfolio.html">Portfolio</a>
          <a href="{{ROOT}}/subpages/ueber-mich.html">Über mich</a>
          <a href="{{ROOT}}/subpages/kontakt.html">Kontakt</a>
        </div>
      </div>

      <div>
        <div class="footer-title">Kontakt</div>
        <div class="footer-links">
          <a href="tel:+436767875304">+43 676 7875304</a>
          <a href="mailto:fabsdev@gmx.at">fabsdev@gmx.at</a>
          <a href="https://github.com/FabianGlanzerDev" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="{{ROOT}}/subpages/impressum.html">Impressum</a>
          <a href="{{ROOT}}/subpages/datenschutz.html">Datenschutz</a>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <span>© <span data-current-year></span> Glanzer Digital</span>
      <span>Entwickelt und betreut von Fabian Glanzer</span>
    </div>
  </div>
`;



/**
 * Returns the aria-current attribute for the active navigation item.
 * @param {string} pageName - The page represented by the navigation item.
 * @param {string} activePage - The currently active page.
 * @returns {string} The aria-current attribute or an empty string.
 */
function getCurrentAttribute(pageName, activePage) {
  return pageName === activePage ? 'aria-current="page"' : '';
}



/**
 * Builds the global header markup for the current page.
 * @param {string} rootPath - Relative path to the project root.
 * @param {string} activePage - The currently active page.
 * @returns {string} The complete header markup.
 */
function getHeaderTemplate(rootPath, activePage) {
  return HEADER_TEMPLATE
    .replaceAll('{{ROOT}}', rootPath)
    .replace('{{HOME_CURRENT}}', getCurrentAttribute('home', activePage))
    .replace('{{SERVICES_CURRENT}}', getCurrentAttribute('services', activePage))
    .replace('{{PORTFOLIO_CURRENT}}', getCurrentAttribute('portfolio', activePage))
    .replace('{{ABOUT_CURRENT}}', getCurrentAttribute('about', activePage));
}



/**
 * Builds the global footer markup for the current page.
 * @param {string} rootPath - Relative path to the project root.
 * @returns {string} The complete footer markup.
 */
function getFooterTemplate(rootPath) {
  return FOOTER_TEMPLATE.replaceAll('{{ROOT}}', rootPath);
}



window.LayoutTemplates = {
  getFooterTemplate,
  getHeaderTemplate,
};
