const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

export async function parse3mf(buffer) {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 22) throw new Error('3MF-Datei ist leer oder zu klein.');
  const entries = readZipDirectory(buffer);
  const modelEntry = findModelEntry(entries);
  if (!modelEntry) throw new Error('3MF enthält keine Modelldatei.');
  const xmlBytes = await extractZipEntry(buffer, modelEntry);
  return parseModelXml(new TextDecoder().decode(xmlBytes));
}

function readZipDirectory(buffer) {
  const view = new DataView(buffer);
  const eocd = findEndOfCentralDirectory(view);
  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const entries = [];
  for (let index = 0; index < count; index += 1) {
    const entry = readCentralEntry(view, offset, buffer);
    entries.push(entry);
    offset = entry.nextOffset;
  }
  return entries;
}

function findEndOfCentralDirectory(view) {
  const start = Math.max(0, view.byteLength - 65557);
  for (let offset = view.byteLength - 22; offset >= start; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) return offset;
  }
  throw new Error('3MF ist kein gültiges ZIP-Paket.');
}

function readCentralEntry(view, offset, buffer) {
  if (view.getUint32(offset, true) !== CENTRAL_SIGNATURE) throw new Error('Ungültiges 3MF-ZIP-Verzeichnis.');
  const nameLength = view.getUint16(offset + 28, true);
  const extraLength = view.getUint16(offset + 30, true);
  const commentLength = view.getUint16(offset + 32, true);
  const nameBytes = new Uint8Array(buffer, offset + 46, nameLength);
  return {
    name: new TextDecoder().decode(nameBytes).replaceAll('\\', '/'),
    method: view.getUint16(offset + 10, true),
    compressedSize: view.getUint32(offset + 20, true),
    localOffset: view.getUint32(offset + 42, true),
    nextOffset: offset + 46 + nameLength + extraLength + commentLength
  };
}

function findModelEntry(entries) {
  const models = entries.filter((entry) => entry.name.toLowerCase().endsWith('.model'));
  return models.find((entry) => entry.name.toLowerCase() === '3d/3dmodel.model') || models[0];
}

async function extractZipEntry(buffer, entry) {
  const view = new DataView(buffer);
  const offset = entry.localOffset;
  if (view.getUint32(offset, true) !== LOCAL_SIGNATURE) throw new Error('Ungültiger 3MF-ZIP-Eintrag.');
  const nameLength = view.getUint16(offset + 26, true);
  const extraLength = view.getUint16(offset + 28, true);
  const start = offset + 30 + nameLength + extraLength;
  const compressed = new Uint8Array(buffer.slice(start, start + entry.compressedSize));
  if (entry.method === 0) return compressed;
  if (entry.method === 8) return inflateRaw(compressed);
  throw new Error(`Nicht unterstützte 3MF-Kompression (${entry.method}).`);
}

async function inflateRaw(bytes) {
  if (!globalThis.DecompressionStream) throw new Error('Dieser Browser unterstützt komprimierte 3MF-Dateien nicht.');
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function parseModelXml(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (xml.getElementsByTagName('parsererror').length) throw new Error('3MF-Modell-XML ist ungültig.');
  const model = firstByLocalName(xml, 'model');
  if (!model) throw new Error('3MF enthält kein gültiges Modell.');
  const scale = unitScale(model.getAttribute('unit'));
  const objects = createObjectMap(model, scale);
  const positions = buildModelPositions(model, objects);
  return finalizeGeometry(new Float32Array(positions));
}

function createObjectMap(model, scale) {
  const map = new Map();
  for (const object of allByLocalName(model, 'object')) {
    const id = object.getAttribute('id');
    if (id) map.set(id, parseObject(object, scale));
  }
  return map;
}

function parseObject(object, scale) {
  const mesh = directChild(object, 'mesh');
  const components = directChild(object, 'components');
  return { mesh: mesh ? parseMesh(mesh, scale) : null, components: components ? parseComponents(components) : [] };
}

function parseMesh(mesh, scale) {
  const verticesNode = directChild(mesh, 'vertices');
  const trianglesNode = directChild(mesh, 'triangles');
  if (!verticesNode || !trianglesNode) return null;
  const vertices = directChildren(verticesNode, 'vertex').map((node) => parseVertex(node, scale));
  const triangles = directChildren(trianglesNode, 'triangle').map(parseTriangle);
  return { vertices, triangles };
}

function parseVertex(node, scale) {
  return ['x', 'y', 'z'].map((axis) => Number(node.getAttribute(axis)) * scale);
}

function parseTriangle(node) {
  return ['v1', 'v2', 'v3'].map((key) => Number(node.getAttribute(key)));
}

function parseComponents(node) {
  return directChildren(node, 'component').map((component) => ({
    objectId: component.getAttribute('objectid'),
    transform: parseTransform(component.getAttribute('transform'))
  }));
}

function buildModelPositions(model, objects) {
  const build = firstByLocalName(model, 'build');
  const items = build ? directChildren(build, 'item') : [];
  const result = [];
  if (items.length) items.forEach((item) => appendObject(result, objects, item.getAttribute('objectid'), parseTransform(item.getAttribute('transform')), new Set()));
  else objects.forEach((_, id) => appendObject(result, objects, id, identityTransform(), new Set()));
  return result;
}

function appendObject(target, objects, id, transform, trail) {
  if (!id || trail.has(id)) return;
  const object = objects.get(id);
  if (!object) return;
  const nextTrail = new Set(trail).add(id);
  if (object.mesh) appendMesh(target, object.mesh, transform);
  object.components.forEach((component) => appendComponent(target, objects, component, transform, nextTrail));
}

function appendComponent(target, objects, component, parentTransform, trail) {
  const local = objectPositions(objects, component.objectId, trail);
  for (let index = 0; index < local.length; index += 3) {
    const point = applyTransform([local[index], local[index + 1], local[index + 2]], component.transform);
    target.push(...applyTransform(point, parentTransform));
  }
}

function objectPositions(objects, id, trail) {
  const result = [];
  appendObject(result, objects, id, identityTransform(), trail);
  return result;
}

function appendMesh(target, mesh, transform) {
  mesh.triangles.forEach((face) => face.forEach((index) => {
    const vertex = mesh.vertices[index];
    if (!vertex) throw new Error('3MF enthält ungültige Vertex-Referenzen.');
    target.push(...applyTransform(vertex, transform));
  }));
}

function parseTransform(value) {
  if (!value) return identityTransform();
  const numbers = value.trim().split(/\s+/).map(Number);
  if (numbers.length !== 12 || numbers.some((number) => !Number.isFinite(number))) return identityTransform();
  return numbers;
}

function identityTransform() {
  return [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
}

function applyTransform(point, matrix) {
  const [x, y, z] = point;
  return [
    x * matrix[0] + y * matrix[3] + z * matrix[6] + matrix[9],
    x * matrix[1] + y * matrix[4] + z * matrix[7] + matrix[10],
    x * matrix[2] + y * matrix[5] + z * matrix[8] + matrix[11]
  ];
}

function unitScale(unit = 'millimeter') {
  const scales = { micron: 0.001, millimeter: 1, centimeter: 10, inch: 25.4, foot: 304.8, meter: 1000 };
  return scales[String(unit).toLowerCase()] || 1;
}

function finalizeGeometry(positions) {
  if (!positions.length || positions.length % 9 !== 0) throw new Error('3MF enthält keine darstellbaren Dreiecke.');
  if (!positions.every(Number.isFinite)) throw new Error('3MF enthält ungültige Koordinaten.');
  const normals = calculateNormals(positions);
  const bounds = calculateBounds(positions);
  if (!bounds.size.some((value) => value > 0)) throw new Error('3MF hat keine darstellbare Größe.');
  return { positions, normals, triangleCount: positions.length / 9, bounds };
}

function calculateNormals(positions) {
  const normals = new Float32Array(positions.length);
  for (let index = 0; index < positions.length; index += 9) writeFaceNormal(positions, normals, index);
  return normals;
}

function writeFaceNormal(positions, normals, index) {
  const a = pointAt(positions, index), b = pointAt(positions, index + 3), c = pointAt(positions, index + 6);
  const normal = normalize(cross(subtract(b, a), subtract(c, a)));
  normals.set(normal, index); normals.set(normal, index + 3); normals.set(normal, index + 6);
}

function calculateBounds(positions) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let index = 0; index < positions.length; index += 3) for (let axis = 0; axis < 3; axis += 1) {
    min[axis] = Math.min(min[axis], positions[index + axis]); max[axis] = Math.max(max[axis], positions[index + axis]);
  }
  return { min, max, size: max.map((value, axis) => value - min[axis]), center: max.map((value, axis) => (value + min[axis]) / 2) };
}

function allByLocalName(root, name) {
  return [...root.getElementsByTagNameNS('*', name)];
}

function firstByLocalName(root, name) {
  return allByLocalName(root, name)[0] || null;
}

function directChildren(root, name) {
  return [...root.children].filter((child) => child.localName === name);
}

function directChild(root, name) {
  return directChildren(root, name)[0] || null;
}

function pointAt(values, index) { return [values[index], values[index + 1], values[index + 2]]; }
function subtract(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function normalize(vector) { const length = Math.hypot(...vector) || 1; return vector.map((value) => value / length); }
