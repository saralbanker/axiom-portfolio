import cv2
import numpy as np
import os

def refine_edges(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"Error: File {input_path} not found.")
        return

    # Load image with alpha channel
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        # Try loading with PIL if cv2 fails for some reason
        print(f"Error: Could not load image at {input_path}")
        return

    # Split channels
    if img.shape[2] == 4:
        b, g, r, a = cv2.split(img)
    else:
        print("Error: Image does not have an alpha channel.")
        return

    print(f"Original shape: {img.shape}")

    # 1. Alpha Erosion (1px Pull-in)
    # Using a 3x3 kernel with a single iteration provides exactly 1px erosion
    kernel = np.ones((3, 3), np.uint8)
    eroded_a = cv2.erode(a, kernel, iterations=1)

    # 2. Color Contraction (Defringing)
    # We target pixels that were semi-transparent or on the edge
    # We want to replace their color with the "bleed" from the opaque core.
    
    # Create a mask for pixels that are fully opaque (the "source" of color)
    opaque_mask = (a == 255).astype(np.uint8)
    
    # Prepare RGB for bleeding
    # Set non-opaque pixels to 0 so they get filled by dilation
    clean_rgb = cv2.merge([b, g, r])
    clean_rgb[a < 255] = 0
    
    # Bleed color from opaque area into transparent/edge area using dilation
    # We use multiple iterations to ensure we cover the entire anti-aliased fringe
    # This "pushes" the internal amethyst/purple colors outward.
    bleeding_mask = (a < 255)
    
    # Iterative dilation is a robust way to "bleed" colors without blurring them
    # We'll do enough iterations to cover at least 5-10 pixels of fringe
    dilated_rgb = clean_rgb.copy()
    for _ in range(10):
        # Find where we still have black (unfilled) pixels in the bleed zone
        mask = (np.sum(dilated_rgb, axis=2) == 0)
        # Dilate 1px
        temp_dilated = cv2.dilate(dilated_rgb, kernel, iterations=1)
        # Fill only the black pixels
        dilated_rgb[mask] = temp_dilated[mask]

    # Combine the bleeded RGB with the eroded Alpha
    # This ensures that the RGB component of the anti-aliased edge is now
    # amethyst (from inside) instead of white (the background halo).
    final_output = cv2.merge([
        dilated_rgb[:, :, 0], 
        dilated_rgb[:, :, 1], 
        dilated_rgb[:, :, 2], 
        eroded_a
    ])

    # Save the result
    success = cv2.imwrite(output_path, final_output)
    if success:
        print(f"Successfully saved refined asset to: {output_path}")
    else:
        print(f"Error: Failed to save image to {output_path}")

if __name__ == "__main__":
    # Ensure paths are absolute or relative to the workspace root
    input_file = "src/assets/bg/crystal.png"
    output_file = "src/assets/bg/crystal_clean_v3.png"
    
    # Check if we should use crystal-halo.png instead?
    # Based on the description "current asset has a white halo fringe", 
    # crystal.png is the likely candidate visible in the browser.
    
    refine_edges(input_file, output_file)
