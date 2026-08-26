export const CAMERA_DISTANCE = 3.35;
const FIT_SIZE = 1.72;

export const VERTEX_SHADER = `
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

export const FRAGMENT_SHADER = `
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
