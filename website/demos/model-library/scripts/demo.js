import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { STLLoader } from '../vendor/STLLoader.js';

const demoGeometry = new THREE.TorusKnotGeometry(0.72, 0.22, 90, 14);
const models = [createDemoModel()];
let activeView = 'all';
let layoutMode = 'grid';
let selectedId = models[0].id;
let searchTerm = '';
let categoryFilter = 'all';
let sortMode = 'name';
let sceneState = {};

function $(selector) {
  return document.querySelector(selector);
}

function createDemoModel() {
  return {
    id: 'demo-model', name: 'Demo-Modell', category: 'Unsortiert', type: 'Demo', size: '–',
    source: 'Beispiel', favorite: false, geometry: demoGeometry,
    description: 'Beispielmodell zum Testen von 3D-Ansicht, Farbe, Favoriten, Namen und Kategorien.'
  };
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `model-${Date.now()}-${Math.random()}`;
}

function getSelectedModel() {
  return models.find((model) => model.id === selectedId) || models[0];
}

function matchesView(model) {
  if (activeView === 'favorites') return model.favorite;
  if (activeView === 'uploads') return model.source === 'Eigene STL';
  return true;
}

function matchesFilters(model) {
  const text = `${model.name} ${model.category} ${model.type}`.toLowerCase();
  const categoryMatches = categoryFilter === 'all' || model.category === categoryFilter;
  return matchesView(model) && categoryMatches && text.includes(searchTerm.toLowerCase());
}

function compareModels(a, b) {
  if (sortMode === 'favorites') return Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name, 'de');
  return a.name.localeCompare(b.name, 'de');
}

function getVisibleModels() {
  return models.filter(matchesFilters).sort(compareModels);
}

function modelCard(model) {
  const current = model.id === selectedId;
  const star = model.favorite ? '★' : '☆';
  return `<article class="model-card${current ? ' is-current' : ''}">
    <button class="model-select" type="button" data-model-id="${model.id}" aria-current="${current}">
      <span class="model-thumb"><span class="model-shape${model.source === 'Eigene STL' ? ' model-shape--uploaded' : ''}" aria-hidden="true"></span></span>
      <span class="model-body"><strong>${escapeHtml(model.name)}</strong><span class="model-meta"><span>${escapeHtml(model.category)}</span><span>${model.type} · ${model.size}</span></span></span>
    </button>
    <button class="favorite-star" type="button" data-favorite-id="${model.id}" aria-label="${escapeHtml(model.name)} als Favorit markieren" aria-pressed="${model.favorite}">${star}</button>
  </article>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
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
  $('[data-count-uploads]').textContent = String(models.filter((m) => m.source === 'Eigene STL').length);
  $('[data-model-count]').textContent = `${visibleCount} ${visibleCount === 1 ? 'Modell' : 'Modelle'}`;
}

function updateCategoryFilter() {
  const select = $('[data-category-filter]');
  const categories = [...new Set(models.map((model) => model.category))].sort((a, b) => a.localeCompare(b, 'de'));
  const options = ['<option value="all">Alle Kategorien</option>', ...categories.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)];
  select.innerHTML = options.join('');
  select.value = categories.includes(categoryFilter) ? categoryFilter : 'all';
}

function updateDetails(model) {
  $('[data-detail-title]').textContent = model.name;
  $('[data-detail-description]').textContent = model.description;
  $('[data-detail-type]').textContent = model.type;
  $('[data-detail-size]').textContent = model.size;
  $('[data-detail-source]').textContent = model.source;
  $('[data-name-input]').value = model.name;
  $('[data-category-input]').value = model.category;
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
  setMeshGeometry(model.geometry.clone());
  renderModels();
}

function toggleFavorite(id) {
  const model = models.find((item) => item.id === id);
  if (!model) return;
  model.favorite = !model.favorite;
  updateFavoriteButton(model);
  renderModels();
}

function saveMetadata() {
  const model = getSelectedModel();
  model.name = $('[data-name-input]').value.trim() || model.name;
  model.category = $('[data-category-input]').value.trim() || 'Unsortiert';
  updateCategoryFilter();
  updateDetails(model);
  renderModels();
  setStatus('Name und Kategorie wurden für diese Sitzung gespeichert.');
}

function setStatus(message) {
  $('[data-upload-status]').textContent = message;
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
  activeView = 'all';
  categoryFilter = 'all';
  searchTerm = '';
  sortMode = 'name';
  $('[data-search]').value = '';
  $('[data-sort]').value = 'name';
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
    description: 'Lokale STL-Vorschau aus deinem Browser. Die Datei wurde nicht hochgeladen.'
  };
}

function addUploadedModel(file, geometry) {
  const model = buildUploadedModel(file, geometry);
  models.push(model);
  selectedId = model.id;
  updateCategoryFilter();
  selectModel(model.id);
  setStatus(`${file.name} wurde lokal geladen und zur Demo-Bibliothek hinzugefügt.`);
}

function parseStlFile(file) {
  const reader = new FileReader();
  reader.addEventListener('load', () => parseStlBuffer(file, reader.result));
  reader.addEventListener('error', () => setStatus('Die Datei konnte nicht gelesen werden.'));
  reader.readAsArrayBuffer(file);
}

function parseStlBuffer(file, buffer) {
  try {
    const geometry = new STLLoader().parse(buffer);
    geometry.computeVertexNormals();
    addUploadedModel(file, geometry);
  } catch (error) {
    console.error(error);
    setStatus('Die STL-Datei ist ungültig oder beschädigt.');
  }
}

function handleFileInput(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.stl')) return setStatus('Bitte eine STL-Datei auswählen.');
  setStatus(`${file.name} wird lokal eingelesen …`);
  parseStlFile(file);
  event.target.value = '';
}

function buildScene() {
  const host = $('[data-viewer]');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.append(renderer.domElement);
  sceneState = { scene, camera, renderer, host };
}

function addLighting() {
  sceneState.scene.add(new THREE.HemisphereLight(0xffffff, 0x3b2a1d, 2.2));
  const light = new THREE.DirectionalLight(0xffffff, 3.2);
  light.position.set(3, 5, 4);
  sceneState.scene.add(light);
}

function addControls() {
  const controls = new OrbitControls(sceneState.camera, sceneState.renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1;
  controls.maxDistance = 20;
  sceneState.controls = controls;
}

function disposeMesh() {
  if (!sceneState.mesh) return;
  sceneState.mesh.geometry.dispose();
  sceneState.mesh.material.dispose();
  sceneState.scene.remove(sceneState.mesh);
}

function setMeshGeometry(geometry) {
  disposeMesh();
  const color = $('[data-model-color]').value;
  const material = new THREE.MeshStandardMaterial({ color, roughness: .48, metalness: .08 });
  sceneState.mesh = new THREE.Mesh(geometry, material);
  sceneState.scene.add(sceneState.mesh);
  fitMeshToView();
}

function fitMeshToView() {
  const box = new THREE.Box3().setFromObject(sceneState.mesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = Math.max(box.getSize(new THREE.Vector3()).length(), 1);
  sceneState.mesh.position.sub(center);
  sceneState.camera.position.set(size * .9, size * .65, size * 1.25);
  sceneState.controls.target.set(0, 0, 0);
  sceneState.controls.update();
}

function resizeViewer() {
  const { clientWidth: width, clientHeight: height } = sceneState.host;
  sceneState.renderer.setSize(width, height, false);
  sceneState.camera.aspect = width / height;
  sceneState.camera.updateProjectionMatrix();
}

function animate() {
  sceneState.controls.update();
  sceneState.renderer.render(sceneState.scene, sceneState.camera);
  sceneState.renderer.setAnimationLoop(animate);
}

function handleViewerKeydown(event) {
  const mesh = sceneState.mesh;
  if (!mesh) return;
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-'];
  if (!keys.includes(event.key)) return;
  event.preventDefault();
  transformMeshFromKey(mesh, event.key);
}

function transformMeshFromKey(mesh, key) {
  if (key === 'ArrowLeft') mesh.rotation.y -= .12;
  if (key === 'ArrowRight') mesh.rotation.y += .12;
  if (key === 'ArrowUp') mesh.rotation.x -= .12;
  if (key === 'ArrowDown') mesh.rotation.x += .12;
  if (['+', '='].includes(key)) sceneState.camera.position.multiplyScalar(.9);
  if (key === '-') sceneState.camera.position.multiplyScalar(1.1);
}

function initializeViewer() {
  buildScene();
  sceneState.scene.background = new THREE.Color($('[data-background-color]').value);
  addLighting();
  addControls();
  setMeshGeometry(getSelectedModel().geometry.clone());
  resizeViewer();
  animate();
}

function bindEvents() {
  $('[data-file-input]').addEventListener('change', handleFileInput);
  $('[data-model-grid]').addEventListener('click', handleGridClick);
  $('[data-save-metadata]').addEventListener('click', saveMetadata);
  $('[data-favorite]').addEventListener('click', () => toggleFavorite(selectedId));
  $('[data-reset-view]').addEventListener('click', fitMeshToView);
  $('[data-reset-filters]').addEventListener('click', resetFilters);
  $('[data-viewer]').addEventListener('keydown', handleViewerKeydown);
}

function bindFilterEvents() {
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => setActiveView(button)));
  document.querySelectorAll('[data-layout]').forEach((button) => button.addEventListener('click', () => setLayout(button)));
  $('[data-search]').addEventListener('input', (event) => { searchTerm = event.target.value; renderModels(); });
  $('[data-category-filter]').addEventListener('change', (event) => { categoryFilter = event.target.value; renderModels(); });
  $('[data-sort]').addEventListener('change', (event) => { sortMode = event.target.value; renderModels(); });
}

function bindViewerEvents() {
  $('[data-model-color]').addEventListener('input', (event) => sceneState.mesh?.material.color.set(event.target.value));
  $('[data-background-color]').addEventListener('input', (event) => sceneState.scene.background = new THREE.Color(event.target.value));
  new ResizeObserver(resizeViewer).observe($('[data-viewer]'));
}

function initialize() {
  updateCategoryFilter();
  renderModels();
  updateDetails(getSelectedModel());
  initializeViewer();
  bindEvents();
  bindFilterEvents();
  bindViewerEvents();
}

initialize();
