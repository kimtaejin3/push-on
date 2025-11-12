#!/bin/bash
# Check 16KB alignment of .so files in AAB

AAB_PATH="$1"

if [ -z "$AAB_PATH" ]; then
    echo "Usage: $0 <path-to-aab>"
    exit 1
fi

# Extract AAB
TEMP_DIR=$(mktemp -d)
unzip -q "$AAB_PATH" -d "$TEMP_DIR"

echo "Checking 16KB alignment of .so files..."
echo "========================================="

# Find all .so files
find "$TEMP_DIR" -name "*.so" | while read so_file; do
    # Get the file name
    filename=$(basename "$so_file")
    
    # Check if file exists and is readable
    if [ -f "$so_file" ]; then
        # Use readelf to check LOAD segment alignment
        if command -v readelf &> /dev/null; then
            alignment=$(readelf -l "$so_file" 2>/dev/null | grep LOAD | head -1 | awk '{print $NF}')
            
            if [ ! -z "$alignment" ]; then
                # Convert hex to decimal
                dec_alignment=$((16#${alignment#0x}))
                
                if [ $dec_alignment -ge 16384 ]; then
                    echo "✓ $filename: ${dec_alignment} bytes (OK)"
                else
                    echo "✗ $filename: ${dec_alignment} bytes (NOT 16KB aligned)"
                fi
            fi
        else
            echo "⚠️  readelf not found. Install binutils."
            break
        fi
    fi
done

# Cleanup
rm -rf "$TEMP_DIR"

echo "========================================="
echo "Check complete!"

