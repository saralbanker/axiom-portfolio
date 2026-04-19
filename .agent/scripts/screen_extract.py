"""
Screen Extraction v2: Luminosity-to-Alpha for edge pixels.

Source analysis of crystal.png:
  - BG (α=0): RGB is pure black (0,0,0) → 3.66M pixels
  - Body (α=255): dark amethyst, mean RGB ≈ (63,53,78) → 363K pixels
  - Edge (1≤α≤254): premultiplied RGB, very dark → 199K pixels

Approach:
  1. Body pixels (α=255) → keep as-is, fully opaque.
  2. Edge pixels (1≤α≤254) → use existing alpha but smooth via luminosity blending.
  3. Pure black where α=0 → stays transparent.
  4. Un-premultiply edge RGB so colors are correct against any background.
"""
import cv2
import numpy as np
import sys

INPUT  = "src/assets/bg/crystal.png"
OUTPUT = "src/assets/bg/crystal_final_optimized.png"


def screen_extract_v2(input_path: str, output_path: str) -> None:
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        sys.exit(f"[ERROR] Could not load: {input_path}")

    h, w = img.shape[:2]
    print(f"Loaded {input_path} — {w}×{h}")

    b, g, r, a = cv2.split(img)

    # Convert to float for precision
    rf = r.astype(np.float32)
    gf = g.astype(np.float32)
    bf = b.astype(np.float32)
    af = a.astype(np.float32)

    # === ZONE MASKS ===
    body_mask = a == 255
    edge_mask = (a > 0) & (a < 255)
    bg_mask   = a == 0

    # === EDGE PROCESSING ===
    # The edge pixels have premultiplied RGB (rendered against black).
    # Their current alpha values may produce a white halo when composited
    # because the alpha is too high for the dark premultiplied color.
    #
    # Screen technique: use luminosity of the premultiplied color to
    # derive a better alpha. This ensures the glow fades smoothly.
    
    # Compute luminosity for edge pixels (Rec. 709 weights)
    lum = 0.2126 * rf + 0.7152 * gf + 0.0722 * bf  # 0-255 range

    # For edge pixels, blend existing alpha with luminosity.
    # The key insight: if lum is low but alpha is high → the pixel will
    # appear as a dark semi-transparent overlay → looks like a dark halo.
    # We want: alpha ≈ proportional to how much "visible color" the pixel carries.
    #
    # Take the MINIMUM of (existing alpha, luminosity-scaled) to suppress
    # the dark halo without killing the bright specular edge glow.
    new_alpha = af.copy()

    edge_lum  = lum[edge_mask]
    edge_orig = af[edge_mask]

    # Scale luminosity: map the brightest edge pixel → 255
    lum_max = edge_lum.max() if edge_lum.max() > 1 else 1.0
    lum_scaled = (edge_lum / lum_max) * 255.0

    # Use the geometric mean of original alpha and luminosity.
    # This preserves the original matte shape while pulling in dark fringes.
    blended = np.sqrt(edge_orig * lum_scaled)
    blended = np.clip(blended, 0, 255)

    new_alpha[edge_mask] = blended

    # === UN-PREMULTIPLY EDGE RGB ===
    # The source RGB is premultiplied (color × alpha/255).
    # To get correct straight alpha, un-premultiply: color = prem / (alpha/255)
    out_r = rf.copy()
    out_g = gf.copy()
    out_b = bf.copy()

    # Only un-premultiply where new_alpha > 0 to avoid div-by-zero
    safe_a = np.maximum(new_alpha, 1.0)
    
    # For edge pixels only — body pixels are already correct
    out_r[edge_mask] = np.clip(rf[edge_mask] * 255.0 / safe_a[edge_mask], 0, 255)
    out_g[edge_mask] = np.clip(gf[edge_mask] * 255.0 / safe_a[edge_mask], 0, 255)
    out_b[edge_mask] = np.clip(bf[edge_mask] * 255.0 / safe_a[edge_mask], 0, 255)

    # Zero out RGB where alpha is 0
    out_r[bg_mask] = 0
    out_g[bg_mask] = 0
    out_b[bg_mask] = 0

    # Also zero out any edge pixel whose new alpha dropped to 0
    zero_alpha = new_alpha < 1
    out_r[zero_alpha] = 0
    out_g[zero_alpha] = 0
    out_b[zero_alpha] = 0
    new_alpha[zero_alpha] = 0

    # === WRITE OUTPUT ===
    final_alpha = new_alpha.astype(np.uint8)
    output = cv2.merge([
        out_b.astype(np.uint8),
        out_g.astype(np.uint8),
        out_r.astype(np.uint8),
        final_alpha
    ])

    ok = cv2.imwrite(output_path, output)
    if not ok:
        sys.exit(f"[ERROR] Failed to write: {output_path}")

    print(f"Saved → {output_path}")
    print(f"  Body (α=255)   : {body_mask.sum():>10,}")
    print(f"  Edge (refined)  : {edge_mask.sum():>10,}")
    print(f"  Transparent     : {(final_alpha == 0).sum():>10,}")
    print(f"  Alpha range     : [{final_alpha.min()} .. {final_alpha.max()}]")
    print("Done ✓")


if __name__ == "__main__":
    screen_extract_v2(INPUT, OUTPUT)
