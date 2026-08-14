const FABS_BASE_PORTIONS = 4;
const FABS_INGREDIENTS = { schnitzel: 4, eggs: 2, breadcrumbs: 150, flour: 50, butter: 2, potatoes: 1 };



/**
 * Renders the Schnitzel ingredient amounts for a multiplier.
 * @param {number} multiplier - Portion multiplier.
 */
function renderFabsIngredients(multiplier) {
  setIngredientText('zutaten1', `${Math.round(FABS_INGREDIENTS.schnitzel * multiplier)} Kalbschnitzel (aus der Oberschale)`);
  setIngredientText('zutaten2', formatIngredient(FABS_INGREDIENTS.eggs * multiplier, 'Eier'));
  setIngredientText('zutaten3', `${Math.round(FABS_INGREDIENTS.breadcrumbs * multiplier)} g Semmelbrösel`);
  setIngredientText('zutaten4', `${Math.round(FABS_INGREDIENTS.flour * multiplier)} g Mehl`);
  setIngredientText('zutaten5', formatIngredient(FABS_INGREDIENTS.butter * multiplier, 'EL Butterschmalz'));
  setIngredientText('zutaten6', `${Math.round(FABS_INGREDIENTS.potatoes * multiplier * 1000) / 1000} kg Kartoffeln`);
  setIngredientText('zutaten7', 'Bund Petersilie Kartoffeln');
  setIngredientText('zutaten8', 'Salz (je nach belieben)');
  setIngredientText('zutaten9', 'Pfeffer (je nach belieben)');
}



/**
 * Validates the portion count and updates the Schnitzel ingredients.
 */
function updateFabsIngredients() {
  const portions = getPortionCount('#portionen_input', '#portionen_warning');
  if (!portions) return;
  renderFabsIngredients(portions / FABS_BASE_PORTIONS);
}



const portionButton = document.getElementById('portionen_button');
if (portionButton) portionButton.addEventListener('click', updateFabsIngredients);
