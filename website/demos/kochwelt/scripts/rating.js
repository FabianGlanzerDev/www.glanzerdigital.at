const ratingStars = document.querySelectorAll('#stars span');
const ratingOutput = document.getElementById('rating_value');
let selectedRating = 0;



/**
 * Applies the visual state for the selected number of stars.
 * @param {number} count - Number of stars to highlight.
 */
function highlightRatingStars(count) {
  ratingStars.forEach((star) => {
    const value = Number(star.dataset.value);
    star.classList.toggle('filled', value <= count);
  });
}



/**
 * Stores the selected rating and updates the accessible text.
 * @param {HTMLElement} star - Clicked rating star.
 */
function selectRating(star) {
  selectedRating = Number(star.dataset.value);
  if (!ratingOutput) return;
  ratingOutput.textContent = `Bewertung: ${selectedRating} von 5 Sternen`;
}



/**
 * Registers hover and click interactions for one rating star.
 * @param {HTMLElement} star - Rating star element.
 */
function registerRatingStar(star) {
  star.addEventListener('mouseover', () => highlightRatingStars(Number(star.dataset.value)));
  star.addEventListener('mouseout', () => highlightRatingStars(selectedRating));
  star.addEventListener('click', () => selectRating(star));
}



ratingStars.forEach(registerRatingStar);
