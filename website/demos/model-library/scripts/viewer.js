const MAX_GPU_TRIANGLES = 400000;
const THUMBNAIL_TRIANGLES = 2600;
const DEFAULT_ROTATION_X = -0.42;
const DEFAULT_ROTATION_Y = 0.68;
const CAMERA_DISTANCE = 3.35;
const FIT_SIZE = 1.72;

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform vec3 uCenter;
uniform float uScale;
uniform float uZoom;
uniform vec2 uRotation;
uniform float uAspect;
varying vec3 vNormal;
varying vec3 vViewPosition;

vec3 rotateModel(vec3 point) {
  float cy = cos(uRotation.y);
  float sy = sin(uRotation.y);
  float cx = cos(uRotation.x);
  float sx = sin(uRotation.x);
  vec3 yRotated = vec3(point.x * cy + point.z * sy, point.y, -point.x * sy + point.z * cy);
  return vec3(yRotated.x, yRotated.y * cx - yRotated.z * sx, yRotated.y * sx + yRotated.z * cx);
}

void main() {
  vec3 localPosition = (aPosition - uCenter) * uScale * uZoom;
  vec3 viewPosition = rotateModel(localPosition);
  viewPosition.z -= ${CAMERA_DISTANCE.toFixed(2)};
  vViewPosition = viewPosition;
  vNormal = normalize(rotateModel(aNormal));

  float nearPlane = 0.1;
  float farPlane = 100.0;
  float f = 2.41421356;
  float z = ((farPlane + nearPlane) / (nearPlane - farPlane)) * viewPosition.z
    + ((2.0 * farPlane * nearPlane) / (nearPlane - farPlane));
  gl_Position = vec4(viewPosition.x * f / uAspect, viewPosition.y * f, z, -viewPosition.z);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec3 uBaseColor;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  if (!gl_FrontFacing) normal = -normal;

  vec3 keyLight = normalize(vec3(0.45, 0.75, 1.0));
  vec3 fillLight = normalize(vec3(-0.75, 0.2, 0.55));
  vec3 viewDirection = normalize(-vViewPosition);
  vec3 halfDirection = normalize(keyLight + viewDirection);

  float diffuse = max(dot(normal, keyLight), 0.0);
  float fill = max(dot(normal, fillLight), 0.0);
  float specular = pow(max(dot(normal, halfDirection), 0.0), 28.0);
  float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.2);

  float brightness = 0.30 + diffuse * 0.72 + fill * 0.24;
  vec3 color = uBaseColor * brightness;
  color += vec3(specular * 0.22 + rim * 0.055);
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

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

export function createStlThumbnail(geometry, color = '#c79762') {
  const canvas = document.createElement('canvas');
  canvas.width = 180;
  canvas.height = 180;
  const context = canvas.getContext('2d');
  if (!context || !geometry?.triangleCount) return '';
  drawThumbnailBackground(context, canvas.width, canvas.height);
  drawThumbnailGeometry(context, geometry, color, canvas.width, canvas.height);
  return canvas.toDataURL('image/webp', 0.82);
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

function drawThumbnailBackground(context, width, height) {
  const gradient = context.createRadialGradient(width * 0.5, height * 0.38, width * 0.08, width * 0.5, height * 0.5, width * 0.75);
  gradient.addColorStop(0, '#222a30');
  gradient.addColorStop(1, '#0e1215');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.fillStyle = 'rgba(0,0,0,.28)';
  context.beginPath();
  context.ellipse(width * 0.5, height * 0.77, width * 0.29, height * 0.07, 0, 0, Math.PI * 2);
  context.fill();
}

function drawThumbnailGeometry(context, geometry, color, width, height) {
  const step = Math.max(1, Math.ceil(geometry.triangleCount / THUMBNAIL_TRIANGLES));
  const scale = 1.72 / Math.max(...geometry.bounds.size, 0.0001);
  const triangles = [];
  for (let triangle = 0; triangle < geometry.triangleCount; triangle += step) {
    const projected = thumbnailTriangle(geometry, triangle, scale, width, height);
    if (projected) triangles.push(projected);
  }
  triangles.sort((a, b) => a.depth - b.depth);
  for (const triangle of triangles) drawThumbnailTriangle(context, triangle, color);
}

function thumbnailTriangle(geometry, triangle, scale, width, height) {
  const base = triangle * 9;
  const world = [0, 3, 6].map((offset) => thumbnailPoint(geometry, base + offset, scale));
  const normal = normalize(cross(subtract(world[1], world[0]), subtract(world[2], world[0])));
  const points = world.map((point) => thumbnailProject(point, width, height));
  const depth = (world[0][2] + world[1][2] + world[2][2]) / 3;
  const light = clamp(0.34 + Math.abs(dot(normal, normalize([0.45, -0.7, 1]))) * 0.72, 0.22, 1.08);
  return { points, depth, light };
}

function thumbnailPoint(geometry, index, scale) {
  const center = geometry.bounds.center;
  const point = [
    (geometry.positions[index] - center[0]) * scale,
    (geometry.positions[index + 1] - center[1]) * scale,
    (geometry.positions[index + 2] - center[2]) * scale
  ];
  return rotatePoint(point, -0.42, 0.68);
}

function rotatePoint(point, rotationX, rotationY) {
  const cosY = Math.cos(rotationY), sinY = Math.sin(rotationY);
  const x = point[0] * cosY + point[2] * sinY;
  const z = -point[0] * sinY + point[2] * cosY;
  const cosX = Math.cos(rotationX), sinX = Math.sin(rotationX);
  return [x, point[1] * cosX - z * sinX, point[1] * sinX + z * cosX];
}

function thumbnailProject(point, width, height) {
  const perspective = CAMERA_DISTANCE / Math.max(CAMERA_DISTANCE + point[2], 0.4);
  const size = Math.min(width, height) * 0.34 * perspective;
  return [width / 2 + point[0] * size, height * 0.48 - point[1] * size];
}

function drawThumbnailTriangle(context, triangle, color) {
  const [a, b, c] = triangle.points;
  context.beginPath();
  context.moveTo(a[0], a[1]);
  context.lineTo(b[0], b[1]);
  context.lineTo(c[0], c[1]);
  context.closePath();
  context.fillStyle = shadedColor(color, triangle.light);
  context.fill();
}

function shadedColor(hexColor, light) {
  const value = hexColor.replace('#', '');
  const channels = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
  return `rgb(${channels.map((channel) => Math.min(255, Math.round(channel * light))).join(',')})`;
}

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalize(vector) {
  const length = Math.hypot(...vector) || 1;
  return vector.map((value) => value / length);
}
