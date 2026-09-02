'use strict';


/** Replaces named placeholders inside an HTML template. */
function fillTemplate(template, values = {}) {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{{${key}}}`, String(value ?? ''));
  }, template);
}


window.GlanzerTemplateRenderer = { fill: fillTemplate };
