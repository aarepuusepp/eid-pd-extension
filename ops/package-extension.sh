#!/bin/bash
# Bash script to package extension for Chrome/Edge

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$SCRIPT_DIR/../extension"
OUTPUT_DIR="$SCRIPT_DIR/../dist"
ZIP_FILE="$OUTPUT_DIR/webeid-pd-fallback.zip"

if [ ! -d "$EXTENSION_DIR" ]; then
    echo "Error: Extension directory not found: $EXTENSION_DIR"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Create zip
echo "Packaging extension..."
cd "$EXTENSION_DIR"
zip -r "$ZIP_FILE" . -x "*.DS_Store"

echo "Extension packaged: $ZIP_FILE"
echo "To install: Load unpacked extension from $EXTENSION_DIR in Chrome/Edge"

