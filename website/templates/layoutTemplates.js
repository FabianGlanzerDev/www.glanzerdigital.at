const HEADER_TEMPLATE = `
  <div class="container header-inner">
    <a class="brand" href="/" aria-label="Glanzer Digital Startseite">
      <img src="{{ROOT}}/assets/images/logos/glanzerdigital-neon-logo.webp" alt="Glanzer Digital">
    </a>

    <button class="nav-toggle" type="button" aria-label="Navigation öffnen" aria-expanded="false" aria-controls="main-navigation" data-nav-toggle>
      <span></span>
      <span></span>
      <span></span>
    </button>

    <nav class="site-nav" id="main-navigation" aria-label="Hauptnavigation" data-nav data-open="false">
      <ul>
        <li><a href="/" {{HOME_CURRENT}}>Home</a></li>
        <li><a href="/leistungen" {{SERVICES_CURRENT}}>Leistungen</a></li>
        <li><a href="/portfolio" {{PORTFOLIO_CURRENT}}>Portfolio</a></li>
        <li><a href="/ueber-mich" {{ABOUT_CURRENT}}>Über mich</a></li>
      </ul>
      <button class="language-toggle" type="button" data-language-toggle aria-label="Sprache auf Englisch wechseln" title="English">EN</button>
      <a class="button button--primary button--small" href="/kontakt">Projekt anfragen</a>
    </nav>
  </div>
`;

const FOOTER_TEMPLATE = `
  <div class="container">
    <div class="footer-grid">
      <div>
        <a class="footer-brand" href="/">
          <img src="{{ROOT}}/assets/images/logos/glanzerdigital-neon-logo.webp" alt="Glanzer Digital">
        </a>
        <p class="footer-copy">Webentwicklung, Softwarelösungen und digitale Werkzeuge mit persönlicher Betreuung.</p>
      </div>

      <div>
        <div class="footer-title">Navigation</div>
        <div class="footer-links">
          <a href="/leistungen">Leistungen</a>
          <a href="/portfolio">Portfolio</a>
          <a href="/ueber-mich">Über mich</a>
          <a href="/kontakt">Kontakt</a>
        </div>
      </div>

      <div>
        <div class="footer-title">Kontakt</div>
        <div class="footer-links">
          <a href="tel:+436767875304">+43 676 7875304</a>
          <a href="mailto:fabsdev@gmx.at">fabsdev@gmx.at</a>
          <a href="https://github.com/FabianGlanzerDev" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="/impressum">Impressum</a>
          <a href="/datenschutz">Datenschutz</a>
          <button class="footer-privacy-settings" type="button" data-consent-settings>Datenschutz-Einstellungen</button>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <span>© <span data-current-year></span> Glanzer Digital</span>
      <span>Webentwicklung aus Österreich</span>
    </div>
  </div>
`;



/** Returns the aria-current attribute for the active navigation item. */
function getCurrentAttribute(pageName, activePage) {
  return pageName === activePage ? 'aria-current="page"' : '';
}



/** Builds the global header markup for the current page. */
function getHeaderTemplate(rootPath, activePage) {
  return HEADER_TEMPLATE
    .replaceAll('{{ROOT}}', rootPath)
    .replace('{{HOME_CURRENT}}', getCurrentAttribute('home', activePage))
    .replace('{{SERVICES_CURRENT}}', getCurrentAttribute('services', activePage))
    .replace('{{PORTFOLIO_CURRENT}}', getCurrentAttribute('portfolio', activePage))
    .replace('{{ABOUT_CURRENT}}', getCurrentAttribute('about', activePage));
}



function getFooterTemplate(rootPath) {
  return FOOTER_TEMPLATE.replaceAll('{{ROOT}}', rootPath);
}



window.LayoutTemplates = {
  getFooterTemplate,
  getHeaderTemplate,
};
