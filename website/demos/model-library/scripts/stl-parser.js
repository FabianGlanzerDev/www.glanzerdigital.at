const TRIANGLE_BYTES = 50;
const HEADER_BYTES = 84;

export function parseStl(buffer) {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 15) throw new Error('STL-Datei ist leer oder zu klein.');
  const geometry = looksBinary(buffer) ? parseBinary(buffer) : parseAscii(buffer);
  validateGeometry(geometry);
  return geometry;
}

export function createDemoGeometry() {
  const vertices = [
    [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
    [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]
  ];
  const faces = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[3,7,6],[3,6,2],[0,4,7],[0,7,3],[1,2,6],[1,6,5]];
  return geometryFromFaces(vertices, faces);
}

function looksBinary(buffer) {
  if (buffer.byteLength < HEADER_BYTES) return false;
  const view = new DataView(buffer);
  const triangles = view.getUint32(80, true);
  return HEADER_BYTES + triangles * TRIANGLE_BYTES === buffer.byteLength;
}

function parseBinary(buffer) {
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);
  const positions = new Float32Array(triangleCount * 9);
  const normals = new Float32Array(triangleCount * 9);
  let offset = HEADER_BYTES;
  for (let triangle = 0; triangle < triangleCount; triangle += 1) offset = readBinaryTriangle(view, offset, positions, normals, triangle);
  return finalizeGeometry(positions, normals);
}

function readBinaryTriangle(view, offset, positions, normals, triangle) {
  const normal = [view.getFloat32(offset, true), view.getFloat32(offset + 4, true), view.getFloat32(offset + 8, true)];
  offset += 12;
  for (let vertex = 0; vertex < 3; vertex += 1) offset = readBinaryVertex(view, offset, positions, normals, triangle, vertex, normal);
  return offset + 2;
}

function readBinaryVertex(view, offset, positions, normals, triangle, vertex, normal) {
  const base = triangle * 9 + vertex * 3;
  positions[base] = view.getFloat32(offset, true);
  positions[base + 1] = view.getFloat32(offset + 4, true);
  positions[base + 2] = view.getFloat32(offset + 8, true);
  normals.set(normal, base);
  return offset + 12;
}

function parseAscii(buffer) {
  const text = new TextDecoder().decode(buffer);
  const values = [...text.matchAll(/vertex\s+([-+\deE.]+)\s+([-+\deE.]+)\s+([-+\deE.]+)/gi)];
  if (!values.length || values.length % 3 !== 0) throw new Error('ASCII-STL enthält keine gültigen Dreiecke.');
  const positions = new Float32Array(values.length * 3);
  values.forEach((match, index) => positions.set([Number(match[1]), Number(match[2]), Number(match[3])], index * 3));
  return finalizeGeometry(positions, calculateNormals(positions));
}

function calculateNormals(positions) {
  const normals = new Float32Array(positions.length);
  for (let index = 0; index < positions.length; index += 9) writeFaceNormal(positions, normals, index);
  return normals;
}

function writeFaceNormal(positions, normals, index) {
  const a = pointAt(positions, index);
  const b = pointAt(positions, index + 3);
  const c = pointAt(positions, index + 6);
  const normal = normalize(cross(subtract(b, a), subtract(c, a)));
  normals.set(normal, index);
  normals.set(normal, index + 3);
  normals.set(normal, index + 6);
}

function geometryFromFaces(vertices, faces) {
  const positions = new Float32Array(faces.length * 9);
  faces.forEach((face, faceIndex) => face.forEach((vertexIndex, corner) => positions.set(vertices[vertexIndex], faceIndex * 9 + corner * 3)));
  return finalizeGeometry(positions, calculateNormals(positions));
}

function finalizeGeometry(positions, normals) {
  return { positions, normals, triangleCount: positions.length / 9, bounds: calculateBounds(positions) };
}

function calculateBounds(positions) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let index = 0; index < positions.length; index += 3) updateBounds(min, max, positions, index);
  return { min, max, size: max.map((value, axis) => value - min[axis]), center: max.map((value, axis) => (value + min[axis]) / 2) };
}

function updateBounds(min, max, positions, index) {
  for (let axis = 0; axis < 3; axis += 1) {
    const value = positions[index + axis];
    min[axis] = Math.min(min[axis], value);
    max[axis] = Math.max(max[axis], value);
  }
}

function validateGeometry(geometry) {
  if (!geometry.triangleCount) throw new Error('STL enthält keine Dreiecke.');
  if (!geometry.positions.every(Number.isFinite)) throw new Error('STL enthält ungültige Koordinaten.');
  if (!geometry.bounds.size.some((value) => value > 0)) throw new Error('STL hat keine darstellbare Größe.');
}

function pointAt(values, index) {
  return [values[index], values[index + 1], values[index + 2]];
}

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function normalize(vector) {
  const length = Math.hypot(...vector) || 1;
  return vector.map((value) => value / length);
}
