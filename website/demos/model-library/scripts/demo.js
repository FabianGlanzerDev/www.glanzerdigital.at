import { createDemoGeometry, parseStl } from './stl-parser.js';
import { createStlThumbnail, createViewer } from './viewer.js';

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const demoGeometry = createDemoGeometry();
const models = [createDemoModel()];

let activeView = 'all';
let layoutMode = 'grid';
let selectedId = models[0].id;
let searchTerm = '';
let categoryFilter = 'all';
let sortMode = 'name-asc';
let viewer = null;

function $(selector) {
  return document.querySelector(selector);
}

function createDemoModel() {
  return {
    id: 'demo-model', name: 'Demo-Modell', category: 'Unsortiert', type: 'Demo', size: '–',
    source: 'Beispiel', favorite: false, geometry: demoGeometry, createdAt: 0,
    description: 'Beispielmodell zum Testen von 3D-Ansicht, Farbe, Favoriten, Namen und Kategorien.',
    thumbnail: createStlThumbnail(demoGeometry)
  };
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `model-${Date.now()}-${Math.random()}`;
}

function getSelectedModel() {
  return models.find((model) => model.id === selectedId) || models[0];
}

function isUpload(model) {
  return model.source === 'Eigene STL';
}

function matchesView(model) {
  if (activeView === 'favorites') return model.favorite;
  if (activeView === 'uploads') return isUpload(model);
  return true;
}

function matchesFilters(model) {
  const text = `${model.name} ${model.category} ${model.type}`.toLowerCase();
  const categoryMatches = categoryFilter === 'all' || model.category === categoryFilter;
  return matchesView(model) && categoryMatches && text.includes(searchTerm.toLowerCase());
}

function compareModels(a, b) {
  if (sortMode === 'name-desc') return b.name.localeCompare(a.name, 'de');
  if (sortMode === 'category') return a.category.localeCompare(b.category, 'de') || a.name.localeCompare(b.name, 'de');
  if (sortMode === 'newest') return b.createdAt - a.createdAt || a.name.localeCompare(b.name, 'de');
  if (sortMode === 'favorites') return Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name, 'de');
  return a.name.localeCompare(b.name, 'de');
}

function getVisibleModels() {
  return models.filter(matchesFilters).sort(compareModels);
}

function modelCard(model) {
  const current = model.id === selectedId;
  const star = model.favorite ? '★' : '☆';
  const thumbnail = model.thumbnail
    ? `<img class="model-thumb-image" src="${model.thumbnail}" alt="" loading="lazy">`
    : '<span class="model-shape" aria-hidden="true"></span>';
  return `<article class="model-card${current ? ' is-current' : ''}">
    <button class="model-select" type="button" data-model-id="${model.id}" aria-current="${current}">
      <span class="model-thumb">${thumbnail}</span>
      <span class="model-body"><strong>${escapeHtml(model.name)}</strong><span class="model-meta"><span>${escapeHtml(model.category)}</span><span>${model.type} · ${model.size}</span></span></span>
    </button>
    <button class="favorite-star" type="button" data-favorite-id="${model.id}" aria-label="${escapeHtml(model.name)} als Favorit markieren" aria-pressed="${model.favorite}">${star}</button>
  </article>`;
}

function escapeHtml(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
  return String(value).replace(/[&<>'"]/g, (char) => map[char]);
}

function renderModels() {
  const visible = getVisibleModels();
  $('[data-model-grid]').innerHTML = visible.map(modelCard).join('');
  $('[data-empty]').hidden = visible.length > 0;
  updateCounts(visible.length);
}

function updateCounts(visibleCount) {
  $('[data-count-all]').textContent = String(models.length);
  $('[data-count-favorites]').textContent = String(models.filter((m) => m.favorite).length);
  $('[data-count-uploads]').textContent = String(models.filter(isUpload).length);
  $('[data-model-count]').textContent = `${visibleCount} ${visibleCount === 1 ? 'Modell' : 'Modelle'}`;
  $('[data-clear-uploads]').hidden = !models.some(isUpload);
}

function updateCategoryFilter() {
  const select = $('[data-category-filter]');
  const categories = [...new Set(models.map((model) => model.category))].sort((a, b) => a.localeCompare(b, 'de'));
  select.innerHTML = ['<option value="all">Alle Kategorien</option>', ...categories.map(categoryOption)].join('');
  select.value = categories.includes(categoryFilter) ? categoryFilter : 'all';
}

function categoryOption(item) {
  return `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`;
}

function geometryStats(geometry) {
  const size = geometry.bounds.size;
  return { triangles: geometry.triangleCount, dimensions: `${fmtMm(size[0])} × ${fmtMm(size[1])} × ${fmtMm(size[2])} mm` };
}

function fmtMm(value) {
  if (!Number.isFinite(value)) return '–';
  return value >= 100 ? value.toFixed(0) : value.toFixed(1);
}

function updateDetails(model) {
  const stats = geometryStats(model.geometry);
  $('[data-detail-title]').textContent = model.name;
  $('[data-detail-description]').textContent = model.description;
  $('[data-detail-type]').textContent = model.type;
  $('[data-detail-size]').textContent = model.size;
  $('[data-detail-source]').textContent = model.source;
  $('[data-detail-triangles]').textContent = stats.triangles ? stats.triangles.toLocaleString('de-DE') : '–';
  $('[data-detail-dimensions]').textContent = model.type === 'STL' ? stats.dimensions : '–';
  $('[data-detail-category]').textContent = model.category;
  $('[data-name-input]').value = model.name;
  $('[data-category-input]').value = model.category;
  $('[data-remove-model]').hidden = !isUpload(model);
  updateFavoriteButton(model);
}

function updateFavoriteButton(model) {
  const button = $('[data-favorite]');
  button.setAttribute('aria-pressed', String(model.favorite));
  button.textContent = model.favorite ? '★ Favorit entfernen' : '☆ Zu Favoriten';
}

function selectModel(id) {
  selectedId = id;
  const model = getSelectedModel();
  updateDetails(model);
  viewer.setGeometry(model.geometry);
  renderModels();
}

function toggleFavorite(id) {
  const model = models.find((item) => item.id === id);
  if (!model) return;
  model.favorite = !model.favorite;
  if (model.id === selectedId) updateFavoriteButton(model);
  renderModels();
}

function saveMetadata() {
  const model = getSelectedModel();
  model.name = $('[data-name-input]').value.trim() || model.name;
  model.category = $('[data-category-input]').value.trim() || 'Unsortiert';
  updateCategoryFilter();
  updateDetails(model);
  renderModels();
  setStatus('Name und Kategorie wurden für diese Browsersitzung gespeichert.', 'success');
}

function setStatus(message, state = '') {
  const status = $('[data-upload-status]');
  status.textContent = message;
  status.dataset.state = state;
}

function setActiveView(button) {
  document.querySelectorAll('[data-view]').forEach((item) => {
    item.classList.toggle('is-active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  });
  activeView = button.dataset.view;
  renderModels();
}

function setLayout(button) {
  document.querySelectorAll('[data-layout]').forEach((item) => {
    item.classList.toggle('is-active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  });
  layoutMode = button.dataset.layout;
  $('[data-model-grid]').classList.toggle('is-list', layoutMode === 'list');
}

function resetFilters() {
  categoryFilter = 'all';
  searchTerm = '';
  sortMode = 'name-asc';
  $('[data-search]').value = '';
  $('[data-sort]').value = sortMode;
  updateCategoryFilter();
  setActiveView(document.querySelector('[data-view="all"]'));
}

function handleGridClick(event) {
  const favorite = event.target.closest('[data-favorite-id]');
  if (favorite) return toggleFavorite(favorite.dataset.favoriteId);
  const model = event.target.closest('[data-model-id]');
  if (model) selectModel(model.dataset.modelId);
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileBaseName(name) {
  return name.replace(/\.stl$/i, '').replace(/[_-]+/g, ' ').trim() || 'Eigene STL';
}

function buildUploadedModel(file, geometry) {
  return {
    id: makeId(), name: fileBaseName(file.name), category: 'Unsortiert', type: 'STL',
    size: formatBytes(file.size), source: 'Eigene STL', favorite: false, geometry,
    createdAt: Date.now(), description: 'Lokale STL-Vorschau aus deinem Browser. Die Datei wurde nicht hochgeladen.',
    thumbnail: createStlThumbnail(geometry)
  };
}

async function parseFile(file) {
  return parseStl(await file.arrayBuffer());
}

function validateFile(file) {
  if (!file.name.toLowerCase().endsWith('.stl')) return 'Nur STL-Dateien werden unterstützt.';
  if (file.size === 0) return 'Die Datei ist leer.';
  if (file.size > MAX_FILE_SIZE) return 'Die Datei ist größer als 100 MB.';
  return '';
}

async function processFiles(fileList) {
  const files = [...fileList];
  if (!files.length) return;
  const result = { added: 0, failed: [] };
  for (let index = 0; index < files.length; index += 1) await processOneFile(files[index], index, files.length, result);
  finishFileImport(result);
}

async function processOneFile(file, index, total, result) {
  const validationError = validateFile(file);
  setStatus(`${file.name} wird eingelesen (${index + 1}/${total}) …`);
  if (validationError) return result.failed.push(`${file.name}: ${validationError}`);
  try {
    const geometry = await parseFile(file);
    models.push(buildUploadedModel(file, geometry));
    result.added += 1;
  } catch (error) {
    console.error(error);
    result.failed.push(`${file.name}: ungültige oder beschädigte STL`);
  }
}

function finishFileImport(result) {
  const uploads = models.filter(isUpload);
  if (uploads.length) selectedId = uploads[uploads.length - 1].id;
  updateCategoryFilter();
  selectModel(selectedId);
  const failed = result.failed.length ? ` ${result.failed.length} Datei(en) konnten nicht geladen werden.` : '';
  setStatus(`${result.added} STL-Datei(en) lokal hinzugefügt.${failed}`, result.added ? 'success' : 'error');
}

function handleFileInput(event) {
  processFiles(event.target.files);
  event.target.value = '';
}

function openFilePicker() {
  $('[data-file-input]').click();
}

function handleDrop(event) {
  event.preventDefault();
  $('[data-drop-zone]').classList.remove('is-dragging');
  processFiles(event.dataTransfer?.files || []);
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  $('[data-drop-zone]').classList.add('is-dragging');
}

function handleDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.classList.remove('is-dragging');
}

function handleDropZoneKeydown(event) {
  if (!['Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  openFilePicker();
}

function removeSelectedModel() {
  const index = models.findIndex((model) => model.id === selectedId && isUpload(model));
  if (index < 0) return;
  const [removed] = models.splice(index, 1);
  selectedId = models[Math.max(0, index - 1)]?.id || models[0].id;
  refreshAfterRemoval(`${removed.name} wurde aus der Demo entfernt.`);
}

function clearUploads() {
  for (let index = models.length - 1; index >= 0; index -= 1) if (isUpload(models[index])) models.splice(index, 1);
  selectedId = models[0].id;
  refreshAfterRemoval('Alle eigenen STL-Dateien wurden aus der Demo entfernt.');
}

function refreshAfterRemoval(message) {
  updateCategoryFilter();
  selectModel(selectedId);
  setStatus(message, 'success');
}

function initializeViewer() {
  viewer = createViewer({
    host: $('[data-viewer]'),
    colorInput: $('[data-model-color]'),
    backgroundInput: $('[data-background-color]')
  });
  viewer.setGeometry(getSelectedModel().geometry);
}

function bindMainEvents() {
  $('[data-file-input]').addEventListener('change', handleFileInput);
  document.querySelectorAll('[data-open-file]').forEach((button) => button.addEventListener('click', openFilePicker));
  $('[data-model-grid]').addEventListener('click', handleGridClick);
  $('[data-save-metadata]').addEventListener('click', saveMetadata);
  $('[data-favorite]').addEventListener('click', () => toggleFavorite(selectedId));
  $('[data-remove-model]').addEventListener('click', removeSelectedModel);
  $('[data-clear-uploads]').addEventListener('click', clearUploads);
  $('[data-reset-view]').addEventListener('click', () => viewer.fit());
  $('[data-reset-filters]').addEventListener('click', resetFilters);
}

function bindFilterEvents() {
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => setActiveView(button)));
  document.querySelectorAll('[data-layout]').forEach((button) => button.addEventListener('click', () => setLayout(button)));
  $('[data-search]').addEventListener('input', (event) => { searchTerm = event.target.value; renderModels(); });
  $('[data-category-filter]').addEventListener('change', (event) => { categoryFilter = event.target.value; renderModels(); });
  $('[data-sort]').addEventListener('change', (event) => { sortMode = event.target.value; renderModels(); });
}

function bindDropEvents() {
  const zone = $('[data-drop-zone]');
  zone.addEventListener('click', (event) => { if (!event.target.closest('button')) openFilePicker(); });
  zone.addEventListener('keydown', handleDropZoneKeydown);
  zone.addEventListener('dragover', handleDragOver);
  zone.addEventListener('dragleave', handleDragLeave);
  zone.addEventListener('drop', handleDrop);
}

function initialize() {
  updateCategoryFilter();
  renderModels();
  updateDetails(getSelectedModel());
  initializeViewer();
  bindMainEvents();
  bindFilterEvents();
  bindDropEvents();
}

initialize();
