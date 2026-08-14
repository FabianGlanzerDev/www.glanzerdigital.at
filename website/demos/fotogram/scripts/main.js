const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const closeBtn = document.getElementById("close-btn");
const nextBtn = document.querySelector(".next");
const prevBtn = document.querySelector(".prev");
const titleEl = document.getElementById("lightbox-title");
const counterEl = document.getElementById("lightbox-counter");
const gallery = document.getElementById("gallery");

const imagesData = [
  { src: "./assets/images/coal-power-plant-6972028_1920.jpg", alt: "Kohlekraftwerk mit Schornsteinen und Rauch" },
  { src: "./assets/images/factory-2813380_1920.jpg", alt: "Industriefabrik mit mehreren Gebäuden" },
  { src: "./assets/images/factory-4338627_1920.jpg", alt: "Große Industrieanlage" },
  { src: "./assets/images/fan-3645379_1920.jpg", alt: "Industrieller Ventilator in einer Fabrikhalle" },
  { src: "./assets/images/ferrybridge-5428427_1920.jpg", alt: "Kohlekraftwerk mit Kühltürmen (Ferrybridge)" },
  { src: "./assets/images/hydroelectric-power-station-1264100_1920.jpg", alt: "Wasserkraftwerk mit Staumauer" },
  { src: "./assets/images/hydropower-plant-6587753_1920.jpg", alt: "Wasserkraftanlage mit fließendem Wasser" },
  { src: "./assets/images/power-plant-1320184_1920.jpg", alt: "Großes Kraftwerk" },
  { src: "./assets/images/power-plant-2918331_1920.jpg", alt: "Kraftwerk mit Dampfwolken" },
  { src: "./assets/images/power-plant-344231_1920.jpg", alt: "Kraftwerksanlage bei Tageslicht" },
  { src: "./assets/images/power-station-2802622_1920.jpg", alt: "Elektrizitätswerk mit Hochspannungsanlagen" },
  { src: "./assets/images/power-station-6579092_1920.jpg", alt: "Moderne Kraftwerksanlage mit Rohrleitungen" }
];

let currentIndex = 0;
let lastFocusedThumb = null;

// start //
function render() {
  renderGallery();
  initLightboxEvents();
}

// galery //
function renderGallery() {
  gallery.innerHTML = "";
  imagesData.forEach(addThumbToGallery);
}

function addThumbToGallery(img, index) {
  const thumb = createThumb(img, index);
  gallery.appendChild(thumb);
}

function createThumb(img, index) {
  const imageEl = document.createElement("img");
  setThumbAttributes(imageEl, img);
  bindThumbEvents(imageEl, index);
  return imageEl;
}

function setThumbAttributes(imageEl, img) {
  imageEl.src = img.src;
  imageEl.alt = img.alt;
  imageEl.tabIndex = 0;
  imageEl.setAttribute("role", "button");
  imageEl.setAttribute("aria-label", `Bild öffnen: ${img.alt}`);
}
// add mouse and keyboard interaction //
function bindThumbEvents(imageEl, index) {
  imageEl.onclick = () => openLightbox(index);
  imageEl.onkeydown = (e) => handleThumbKeydown(e, index);
}
// open the lightbox when enter or Space press //
function handleThumbKeydown(e, index) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    openLightbox(index);
  }
}

// lightbox //
function initLightboxEvents() {
  closeBtn.onclick = closeLightbox;
  nextBtn.onclick = (e) => handleNavClick(e, nextImage);
  prevBtn.onclick = (e) => handleNavClick(e, prevImage);

  lightbox.addEventListener("click", (e) => closeOnBackdrop(e));
  document.addEventListener("keydown", handleKeyNav);
}

// executes a navigation action //
function handleNavClick(e, action) {
  e.stopPropagation();
  action();
}

// close the Lightbox when click on the background //
function closeOnBackdrop(e) {
  if (e.target === lightbox) closeLightbox();
}

// lightbox ui //
function updateLightbox() {
  const current = imagesData[currentIndex];
  setLightboxImage(current);
  setLightboxTitle(current);
  setLightboxCounter();
}

// update the displayed image in the Lightbox //
function setLightboxImage(current) {
  lightboxImg.src = current.src;
  lightboxImg.alt = current.alt;
}

// update the title text of lightbox //
function setLightboxTitle(current) {
  if (!titleEl) return;
  const filename = current.src.split("/").pop();
  titleEl.textContent = current.alt || filename;
}

// set the counter (zb. 3 / 12) //
function setLightboxCounter() {
  if (!counterEl) return;
  counterEl.textContent = `${currentIndex + 1}/${imagesData.length}`;
}

// open/close lightbox //
function openLightbox(index) {
  lastFocusedThumb = document.activeElement;
  currentIndex = index;

  lightbox.style.display = "flex";
  lightbox.setAttribute("aria-hidden", "false");

  lockBackgroundScroll();
  updateLightbox();
  focusFirstInLightbox();
}

// close the lghtbox and restore focus and scrollin //
function closeLightbox() {
  lightbox.style.display = "none";
  lightbox.setAttribute("aria-hidden", "true");

  unlockBackgroundScroll();
  restoreFocus();
}
// rturn focus to the previously selected gallery img //
function restoreFocus() {
  if (lastFocusedThumb) lastFocusedThumb.focus();
}

// show next img //
function nextImage() {
  currentIndex = (currentIndex + 1) % imagesData.length;
  updateLightbox();
}

// prev img //
function prevImage() {
  currentIndex = (currentIndex - 1 + imagesData.length) % imagesData.length;
  updateLightbox();
}

// keyboard nav + focus trap (only lightbox tab focus) //
function handleKeyNav(e) {
  if (lightbox.style.display !== "flex") return;

  trapTabKey(e);

  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") nextImage();
  if (e.key === "ArrowLeft") prevImage();
}

// return all focusable elements inside the lightbox //
function getFocusableInLightbox() {
  return lightbox.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
}

// move focus to first interactive element in lightbox //
function focusFirstInLightbox() {
  const focusables = getFocusableInLightbox();
  if (focusables.length) focusables[0].focus();
}

// keeps Tab navigation inside the lightbox (WCAG focus trap) //
function trapTabKey(e) {
  if (e.key !== "Tab") return;

  const focusables = getFocusableInLightbox();
  if (!focusables.length) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

// scrollock smartphones //
function lockBackgroundScroll() {
  document.documentElement.classList.add("no-scroll");
  document.body.classList.add("no-scroll");
}
// unlock no-scroll //
function unlockBackgroundScroll() {
  document.documentElement.classList.remove("no-scroll");
  document.body.classList.remove("no-scroll");
}
