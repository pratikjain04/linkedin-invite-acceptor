#!/bin/bash

# Create simple 1x1 blue PNG icons using ImageMagick if available
# Otherwise, create placeholder files

ICON_DIR="/Users/pratik/Projects/linkedin-invite-acceptor/src/assets"

if command -v convert &> /dev/null; then
    # Use ImageMagick if available
    convert -size 16x16 xc:'#0A66C2' "${ICON_DIR}/icon-16.png"
    convert -size 48x48 xc:'#0A66C2' "${ICON_DIR}/icon-48.png"
    convert -size 128x128 xc:'#0A66C2' "${ICON_DIR}/icon-128.png"
    echo "Icons created with ImageMagick"
else
    # Create placeholder PNG files (minimal valid PNG)
    # This is a 1x1 blue pixel PNG
    python3 << 'PYTHON_EOF'
import struct
import zlib

def create_minimal_png(filename, size):
    """Create a minimal valid PNG file"""
    # PNG signature
    png_signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk (image header)
    width = size.to_bytes(4, 'big')
    height = size.to_bytes(4, 'big')
    ihdr_data = width + height + b'\x08\x02\x00\x00\x00'  # 8-bit RGB
    ihdr = b'IHDR' + ihdr_data
    ihdr_crc = zlib.crc32(ihdr)
    
    # IDAT chunk (image data) - all blue pixels
    idat_data = b'\x00' + (b'\x0A\x66\xC2' * size)  # Filter byte + RGB values
    idat_data = idat_data * size  # Repeat for each row
    idat_compressed = zlib.compress(idat_data)
    idat = b'IDAT' + idat_compressed
    idat_crc = zlib.crc32(idat)
    
    # IEND chunk
    iend = b'IEND'
    iend_crc = zlib.crc32(iend)
    
    # Assemble PNG
    with open(filename, 'wb') as f:
        f.write(png_signature)
        f.write(len(ihdr_data).to_bytes(4, 'big'))
        f.write(ihdr)
        f.write(ihdr_crc.to_bytes(4, 'big'))
        f.write(len(idat_compressed).to_bytes(4, 'big'))
        f.write(idat)
        f.write(idat_crc.to_bytes(4, 'big'))
        f.write(b'\x00\x00\x00\x00')  # IEND length
        f.write(iend)
        f.write(iend_crc.to_bytes(4, 'big'))

# Create icons
create_minimal_png('/Users/pratik/Projects/linkedin-invite-acceptor/src/assets/icon-16.png', 16)
create_minimal_png('/Users/pratik/Projects/linkedin-invite-acceptor/src/assets/icon-48.png', 48)
create_minimal_png('/Users/pratik/Projects/linkedin-invite-acceptor/src/assets/icon-128.png', 128)
print("Icons created successfully")
PYTHON_EOF
fi
