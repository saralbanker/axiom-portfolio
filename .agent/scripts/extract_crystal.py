from PIL import Image, ImageFilter
import os

def extract_crystal(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return

    # Open the image and ensure it's in RGBA mode
    img = Image.open(input_path).convert("RGBA")
    
    # 1. Background Masking (White -> Transparent)
    # Target pure white more specifically, but handle selection dots
    datas = img.getdata()
    new_data = []
    threshold = 245  # Back to tighter threshold to preserve crystal highlights
    
    for item in datas:
        # If pixel is very bright white, it's background
        if item[0] >= threshold and item[1] >= threshold and item[2] >= threshold:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    
    # 2. Alpha Refinement (Gentle Fringe Removal)
    # We use a 3x3 filter instead of 5x5 to avoid 'eating' into the asset mass.
    alpha = img.getchannel('A')
    
    # Erode the mask gently
    alpha = alpha.filter(ImageFilter.MinFilter(3)) 
    
    # Re-apply the refined alpha
    img.putalpha(alpha)
    
    # 3. Export to project assets
    img.save(output_path, "PNG")
    print(f"Successfully processed and saved crystal to: {output_path}")

if __name__ == "__main__":
    import sys
    # Paths configured for the current task
    input_file = "/home/virus/.gemini/antigravity/brain/3c9b6644-1024-4aa5-b0f9-1f85bd02c9e2/media__1776587883809.png"
    output_file = "/mnt/data/rj/my-3d-site/src/assets/crystal-hero.png"
    
    extract_crystal(input_file, output_file)
