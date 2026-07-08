import os
import argparse
from pathlib import Path

def setup_environment():
    print("Checking for required dependencies...")
    try:
        from PIL import Image
        return Image
    except ImportError:
        print("Pillow library not found. Installing via pip...")
        os.system("python -m pip install Pillow")
        try:
            from PIL import Image
            return Image
        except ImportError:
            print("Failed to install Pillow. Please run: pip install Pillow")
            return None

Image = setup_environment()

def resize_and_crop(input_folder, output_folder, target_size=(500, 500)):
    if not Image:
        return
        
    in_dir = Path(input_folder)
    out_dir = Path(output_folder)
    
    if not in_dir.exists():
        print(f"Error: Input folder '{input_folder}' does not exist.")
        return
        
    out_dir.mkdir(parents=True, exist_ok=True)
    
    supported_formats = {'.jpg', '.jpeg', '.png', '.webp'}
    images = [f for f in in_dir.iterdir() if f.suffix.lower() in supported_formats]
    
    if not images:
        print(f"No valid images found in '{input_folder}'. Supported: JPG, PNG, WEBP")
        return
        
    print(f"Found {len(images)} images to process...")
    
    for i, img_path in enumerate(images, 1):
        try:
            with Image.open(img_path) as img:
                # Convert RGBA to RGB if saving as JPG (optional, but good practice)
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                # 1. Resize to cover the target size while maintaining aspect ratio
                width, height = img.size
                target_w, target_h = target_size
                
                ratio_w = target_w / width
                ratio_h = target_h / height
                ratio = max(ratio_w, ratio_h) # Max ensures we cover the whole area
                
                new_size = (int(width * ratio), int(height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
                
                # 2. Crop from center to get exact target size
                width, height = img.size
                left = (width - target_w) / 2
                top = (height - target_h) / 2
                right = (width + target_w) / 2
                bottom = (height + target_h) / 2
                
                img = img.crop((left, top, right, bottom))
                
                # Save optimized image
                out_name = f"{img_path.stem}_optimized.jpg"
                out_path = out_dir / out_name
                img.save(out_path, "JPEG", quality=85)
                
                print(f"[{i}/{len(images)}] Processed {img_path.name} -> {out_name}")
                
        except Exception as e:
            print(f"Error processing {img_path.name}: {e}")
            
    print(f"\nDone! Optimized {len(images)} photos saved to '{output_folder}'.")
    print("These smaller, squared images are perfect for bulk-importing into the ID generator.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Batch resize and square-crop ID photos")
    parser.add_argument("--input", "-i", default="../raw_photos", help="Input folder containing raw photos")
    parser.add_argument("--output", "-o", default="../optimized_photos", help="Output folder for resized photos")
    parser.add_argument("--size", "-s", type=int, default=600, help="Target size (width and height in pixels)")
    
    args = parser.parse_args()
    
    # Create the raw input folder if it doesn't exist so the user has a place to drop files
    Path(args.input).mkdir(exist_ok=True)
    
    resize_and_crop(args.input, args.output, (args.size, args.size))
