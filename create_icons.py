"""
Create placeholder icons for the extension
This generates simple PNG icons with the initials "LIA"
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    """Create a simple icon with text"""
    # Create image with LinkedIn blue background
    img = Image.new('RGB', (size, size), color='#0A66C2')
    draw = ImageDraw.Draw(img)
    
    # Try to use a nice font, fall back to default
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", int(size * 0.4))
    except:
        font = ImageFont.load_default()
    
    # Draw white text in the center
    text = "LIA"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    draw.text((x, y), text, fill='white', font=font)
    
    # Save image
    img.save(filename)
    print(f"Created {filename}")

# Create icons directory if it doesn't exist
icon_dir = '/Users/pratik/Projects/linkedin-invite-acceptor/src/assets'
os.makedirs(icon_dir, exist_ok=True)

# Create icons in different sizes
create_icon(16, f'{icon_dir}/icon-16.png')
create_icon(48, f'{icon_dir}/icon-48.png')
create_icon(128, f'{icon_dir}/icon-128.png')

print("All icons created successfully!")
