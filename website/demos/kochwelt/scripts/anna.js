const ANNA_BASE_PORTIONS = 4;
const ANNA_INGREDIENTS = { flour: 500, eggs: 6, milk: 150, butter: 12, onion: 1, cheese: 150 };



/**
 * Renders the Käsespätzle ingredient amounts for a multiplier.
 * @param {number} multiplier - Portion multiplier.
 */
function renderAnnaIngredients(multiplier) {
  setIngredientText('portions1', formatIngredient(ANNA_INGREDIENTS.flour * multiplier, 'g Mehl'));
  setIngredientText('portions2', formatIngredient(ANNA_INGREDIENTS.eggs * multiplier, 'stk Eier'));
  setIngredientText('portions3', formatIngredient(ANNA_INGREDIENTS.milk * multiplier, 'ml Milch'));
  setIngredientText('portions4', 'Salz');
  setIngredientText('portions5', 'Pfeffer');
  setIngredientText('portions6', 'Muskatnuss');
  setIngredientText('portions7', formatIngredient(ANNA_INGREDIENTS.butter * multiplier, 'EL Butter'));
  setIngredientText('portions8', formatIngredient(ANNA_INGREDIENTS.onion * multiplier, 'Zwiebel'));
  setIngredientText('portions9', formatIngredient(ANNA_INGREDIENTS.cheese * multiplier, 'g Bergkäse'));
  setIngredientText('portions10', formatIngredient(ANNA_INGREDIENTS.cheese * multiplier, 'g Rässkäse'));
}



/**
 * Validates the portion count and updates the recipe ingredients.
 */
function adjustIngredients() {
  const portions = getPortionCount('#portions-ingredients', '#portions-warning');
  if (!portions) return;
  renderAnnaIngredients(portions / ANNA_BASE_PORTIONS);
}
