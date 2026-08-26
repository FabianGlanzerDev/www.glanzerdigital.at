import { CAMERA_DISTANCE } from './viewerShaders.js';

const THUMBNAIL_TRIANGLES = 2600;


/** Creates a WebP thumbnail for parsed STL geometry.
 * @param {object} geometry - Parsed STL geometry.
 * @param {string} color - Base model color.
 * @returns {string} Data URL for the generated thumbnail.
 */
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
