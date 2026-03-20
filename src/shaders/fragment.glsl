uniform sampler2D uTexture;
uniform vec2 uMouse;        // normalized cursor position 0-1
uniform float uMouseEnter;  // 0 = cursor not over, 1 = cursor over (GSAP animated)
uniform float uTime;
uniform vec3 uAccent;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // Distance from this pixel to the cursor
  float dist = distance(uv, uMouse);
  float radius = 0.28;

  // Create bulge — strongest at cursor, fades at radius
  float strength = smoothstep(radius, 0.0, dist) * uMouseEnter;

  // Push UV away from cursor (bulge outward)
  uv -= (uMouse - uv) * strength * 0.18;

  // Subtle RGB shift at edge of distortion (chromatic aberration)
  float r = texture2D(uTexture, uv + vec2(0.002, 0.0) * strength).r;
  float g = texture2D(uTexture, uv).g;
  float b = texture2D(uTexture, uv - vec2(0.002, 0.0) * strength).b;

  float tint = strength * 0.1;
  vec3 finalColor = vec3(r + uAccent.r * tint * 0.3, g, b);
  gl_FragColor = vec4(finalColor, uOpacity);
}
