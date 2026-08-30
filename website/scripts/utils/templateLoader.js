'use strict';

const templateCache = new Map();


/** Builds the relative URL for a shared HTML template. */
function getTemplateUrl(rootPath, templateName) {
  return `${rootPath}/templates/${templateName}.html`;
}


/** Loads and caches one shared HTML template. */
async function loadTemplate(rootPath, templateName) {
  const url = getTemplateUrl(rootPath, templateName);
  if (templateCache.has(url)) return templateCache.get(url);
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Template konnte nicht geladen werden: ${url}`);
  const template = await response.text();
  templateCache.set(url, template);
  return template;
}


/** Replaces named placeholders inside a loaded template. */
function fillTemplate(template, values = {}) {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{{${key}}}`, String(value ?? ''));
  }, template);
}


window.GlanzerTemplates = { fillTemplate, loadTemplate };
