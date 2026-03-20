uniform float uVelocity;
uniform float uTime;
varying vec2 vUv;

void main() {
  vUv = uv;

  vec3 pos = position;

  // Scroll velocity creates a wave along Z axis
  // sin wave peaks at center (uv.x = 0.5), flat at edges
  float wave = sin(uv.x * 3.14159) * uVelocity * 0.4;
  pos.z += wave;

  // Subtle ambient float
  pos.y += sin(uv.x * 6.28 + uTime * 0.5) * 0.02;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
