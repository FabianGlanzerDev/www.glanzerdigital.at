/**
 * Returns a validated portion count or null when invalid.
 * @param {string} inputSelector - Selector for the portion input.
 * @param {string} warningSelector - Selector for the warning element.
 * @returns {number|null} The valid portion count.
 */
function getPortionCount(inputSelector, warningSelector) {
  const input = document.querySelector(inputSelector);
  const warning = document.querySelector(warningSelector);
  const portions = Number(input?.value);
  const isValid = portions >= 1 && portions <= 20 && !Number.isNaN(portions);
  if (warning) warning.style.display = isValid ? 'none' : 'inline';
  return isValid ? portions : null;
}



/**
 * Formats a numeric ingredient value and appends its unit.
 * @param {number} value - Calculated ingredient value.
 * @param {string} unit - Ingredient unit and label.
 * @returns {string} Formatted ingredient text.
 */
function formatIngredient(value, unit) {
  const formattedValue = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${formattedValue} ${unit}`;
}



/**
 * Updates one ingredient text element.
 * @param {string} id - Target element id.
 * @param {string} text - New ingredient text.
 */
function setIngredientText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}
