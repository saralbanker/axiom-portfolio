uniform sampler2D uTexture;
uniform vec2 uMouse;
uniform float uMouseEnter;
uniform float uVelocity; // Lenis scroll velocity
uniform float uTime;
uniform vec3 uAccent;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // 1. LIQUID DISTORTION (Velocity-based stretch)
  float verticalVelocity = clamp(uVelocity * 0.05, -0.15, 0.15);
  uv.y += sin(uv.x * 10.0 + uTime) * verticalVelocity * 0.2;
  uv.x += cos(uv.y * 10.0 + uTime) * verticalVelocity * 0.1;

  // 2. MOUSE BULGE
  float dist = distance(uv, uMouse);
  float radius = 0.28;
  float strength = smoothstep(radius, 0.0, dist) * uMouseEnter;
  uv -= (uMouse - uv) * strength * 0.25;

  // 3. GRAIN (Masterpiece Noise)
  float noise = (fract(sin(dot(uv.xy ,vec2(12.9898,78.233))) * 43758.5453) - 0.5) * 0.04;
  
  // 4. PRISMATIC ABERRATION (2026 Trend)
  // Chromatic shift increases with both hover AND scroll velocity + Vignette edge
  float edgeDist = length(vUv - 0.5);
  float aberration = (strength * 0.02) + abs(verticalVelocity * 0.1) + (edgeDist * 0.03);
  
  float r = texture2D(uTexture, uv + vec2(aberration, 0.0)).r;
  float g = texture2D(uTexture, uv).g;
  float b = texture2D(uTexture, uv - vec2(aberration, 0.0)).b;

  vec3 finalColor = vec3(r, g, b) + noise;
  
  // 5. VIGNETTE & GLOW
  float vignette = smoothstep(1.2, 0.5, edgeDist);
  finalColor *= vignette;

  float glow = smoothstep(0.5, 0.0, dist) * uMouseEnter * 0.12;
  finalColor += uAccent * glow;

  gl_FragColor = vec4(finalColor, uOpacity * vignette);
}
