import { FRAGMENT_SHADER, VERTEX_SHADER } from './viewerShaders.js';
export { createStlThumbnail } from './viewerThumbnail.js';

const MAX_GPU_TRIANGLES = 400000;
const DEFAULT_ROTATION_X = -0.42;
const DEFAULT_ROTATION_Y = 0.68;
export function createViewer(elements) {
  const state = createState(elements);
  bindEvents(state);
  resize(state);
  syncBackground(state);
  return {
    setGeometry: (geometry) => setGeometry(state, geometry),
    fit: () => resetView(state)
  };
}

function createState(elements) {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', {
    antialias: true,
    alpha: true,
    depth: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false
  });
  elements.host.replaceChildren(canvas);
  elements.host.classList.add('viewer-host--webgl');
  if (!gl) return createUnsupportedState(elements, canvas);

  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  const state = {
    ...elements,
    canvas,
    gl,
    program,
    geometry: null,
    buffers: null,
    vertexCount: 0,
    rotationX: DEFAULT_ROTATION_X,
    rotationY: DEFAULT_ROTATION_Y,
    zoom: 1,
    dragging: false,
    lastX: 0,
    lastY: 0,
    frame: 0,
    supported: true,
    locations: getLocations(gl, program)
  };
  configureGl(gl);
  return state;
}

function createUnsupportedState(elements, canvas) {
  const message = document.createElement('div');
  message.className = 'viewer-fallback';
  message.textContent = 'Die 3D-Vorschau wird von diesem Browser nicht unterstützt.';
  elements.host.append(message);
  return { ...elements, canvas, supported: false, geometry: null };
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'WebGL-Programm konnte nicht erstellt werden.');
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'WebGL-Shader konnte nicht kompiliert werden.');
  return shader;
}

function getLocations(gl, program) {
  return {
    position: gl.getAttribLocation(program, 'aPosition'),
    normal: gl.getAttribLocation(program, 'aNormal'),
    center: gl.getUniformLocation(program, 'uCenter'),
    scale: gl.getUniformLocation(program, 'uScale'),
    zoom: gl.getUniformLocation(program, 'uZoom'),
    rotation: gl.getUniformLocation(program, 'uRotation'),
    aspect: gl.getUniformLocation(program, 'uAspect'),
    baseColor: gl.getUniformLocation(program, 'uBaseColor')
  };
}

function configureGl(gl) {
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 0);
}

function bindEvents(state) {
  if (!state.supported) return;
  state.host.addEventListener('pointerdown', (event) => beginDrag(state, event));
  state.host.addEventListener('pointermove', (event) => drag(state, event));
  state.host.addEventListener('pointerup', (event) => endDrag(state, event));
  state.host.addEventListener('pointercancel', (event) => endDrag(state, event));
  state.host.addEventListener('wheel', (event) => zoom(state, event), { passive: false });
  state.host.addEventListener('keydown', (event) => keyControl(state, event));
  state.colorInput.addEventListener('input', () => requestRender(state));
  state.backgroundInput.addEventListener('input', () => syncBackground(state));
  new ResizeObserver(() => resize(state)).observe(state.host);
}

function setGeometry(state, geometry) {
  state.geometry = geometry;
  if (!state.supported) return;
  uploadGeometry(state, geometry);
  resetView(state);
}

function uploadGeometry(state, geometry) {
  disposeBuffers(state);
  const preview = previewArrays(geometry);
  const gl = state.gl;
  state.buffers = {
    positions: createArrayBuffer(gl, preview.positions),
    normals: createArrayBuffer(gl, preview.normals)
  };
  state.vertexCount = preview.positions.length / 3;
}

function previewArrays(geometry) {
  if (geometry.triangleCount <= MAX_GPU_TRIANGLES) return { positions: geometry.positions, normals: geometry.normals };
  const step = Math.ceil(geometry.triangleCount / MAX_GPU_TRIANGLES);
  const count = Math.ceil(geometry.triangleCount / step);
  const positions = new Float32Array(count * 9);
  const normals = new Float32Array(count * 9);
  let target = 0;
  for (let triangle = 0; triangle < geometry.triangleCount; triangle += step) {
    const source = triangle * 9;
    positions.set(geometry.positions.subarray(source, source + 9), target);
    normals.set(geometry.normals.subarray(source, source + 9), target);
    target += 9;
  }
  return { positions: positions.subarray(0, target), normals: normals.subarray(0, target) };
}

function createArrayBuffer(gl, values) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW);
  return buffer;
}

function disposeBuffers(state) {
  if (!state.buffers) return;
  state.gl.deleteBuffer(state.buffers.positions);
  state.gl.deleteBuffer(state.buffers.normals);
  state.buffers = null;
}

function resetView(state) {
  if (!state.supported) return;
  state.rotationX = DEFAULT_ROTATION_X;
  state.rotationY = DEFAULT_ROTATION_Y;
  state.zoom = 1;
  requestRender(state);
}

function beginDrag(state, event) {
  state.dragging = true;
  state.lastX = event.clientX;
  state.lastY = event.clientY;
  state.host.classList.add('is-rotating');
  state.host.setPointerCapture?.(event.pointerId);
}

function drag(state, event) {
  if (!state.dragging) return;
  state.rotationY += (event.clientX - state.lastX) * 0.008;
  state.rotationX = clamp(state.rotationX + (event.clientY - state.lastY) * 0.008, -Math.PI / 2, Math.PI / 2);
  state.lastX = event.clientX;
  state.lastY = event.clientY;
  requestRender(state);
}

function endDrag(state, event) {
  state.dragging = false;
  state.host.classList.remove('is-rotating');
  if (event?.pointerId !== undefined) state.host.releasePointerCapture?.(event.pointerId);
}

function zoom(state, event) {
  event.preventDefault();
  state.zoom = clamp(state.zoom * Math.exp(-event.deltaY * 0.00115), 0.35, 3.8);
  requestRender(state);
}

function keyControl(state, event) {
  const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-'].includes(event.key);
  if (!handled) return;
  event.preventDefault();
  if (event.key === 'ArrowLeft') state.rotationY -= 0.12;
  if (event.key === 'ArrowRight') state.rotationY += 0.12;
  if (event.key === 'ArrowUp') state.rotationX -= 0.12;
  if (event.key === 'ArrowDown') state.rotationX += 0.12;
  if (['+', '='].includes(event.key)) state.zoom = clamp(state.zoom * 1.12, 0.35, 3.8);
  if (event.key === '-') state.zoom = clamp(state.zoom / 1.12, 0.35, 3.8);
  requestRender(state);
}

function resize(state) {
  if (!state.supported) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(Math.round(state.host.clientWidth * ratio), 1);
  const height = Math.max(Math.round(state.host.clientHeight * ratio), 1);
  if (state.canvas.width === width && state.canvas.height === height) return;
  state.canvas.width = width;
  state.canvas.height = height;
  requestRender(state);
}

function requestRender(state) {
  if (!state.supported || state.frame) return;
  state.frame = requestAnimationFrame(() => {
    state.frame = 0;
    render(state);
  });
}

function render(state) {
  if (!state.geometry || !state.buffers || !state.vertexCount) return;
  const gl = state.gl;
  const width = state.canvas.width;
  const height = state.canvas.height;
  gl.viewport(0, 0, width, height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(state.program);

  bindAttribute(gl, state.buffers.positions, state.locations.position);
  bindAttribute(gl, state.buffers.normals, state.locations.normal);

  const bounds = state.geometry.bounds;
  const modelScale = FIT_SIZE / Math.max(...bounds.size, 0.0001);
  gl.uniform3fv(state.locations.center, bounds.center);
  gl.uniform1f(state.locations.scale, modelScale);
  gl.uniform1f(state.locations.zoom, state.zoom);
  gl.uniform2f(state.locations.rotation, state.rotationX, state.rotationY);
  gl.uniform1f(state.locations.aspect, width / Math.max(height, 1));
  gl.uniform3fv(state.locations.baseColor, hexToRgb(state.colorInput.value));
  gl.drawArrays(gl.TRIANGLES, 0, state.vertexCount);
}

function bindAttribute(gl, buffer, location) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
}

function syncBackground(state) {
  state.host.style.setProperty('--viewer-bg', state.backgroundInput.value);
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
