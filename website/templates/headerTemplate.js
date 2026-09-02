'use strict';

window.GlanzerTemplateLibrary = window.GlanzerTemplateLibrary || {};
window.GlanzerTemplateLibrary.header = `
<div class="container header-inner">
  <a class="brand" href="/" aria-label="GlanzerDigital Startseite">
    <img src="{{ROOT}}/assets/images/logos/glanzerdigital-neon-logo.webp" alt="GlanzerDigital" width="720" height="240">
  </a>

  <button class="nav-toggle" type="button" aria-label="Navigation öffnen" aria-expanded="false"
    aria-controls="main-navigation" data-nav-toggle>
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
    <div class="language-switch" role="group" aria-label="Sprache auswählen">
      <button class="language-switch__option is-active" type="button" data-language-option="de" aria-pressed="true">DE</button>
      <span class="language-switch__separator" aria-hidden="true">/</span>
      <button class="language-switch__option" type="button" data-language-option="en" aria-pressed="false">EN</button>
    </div>
    <a class="nav-project-link" href="/kontakt#projektanfrage">
      <span>Projekt anfragen</span>
      <span class="nav-project-link__icon" aria-hidden="true">↗</span>
    </a>
  </nav>
</div>
`;
