#!/bin/bash

SOURCE="frontend/logo.png"
RES_DIR="frontend/android/app/src/main/res"

# Ensure source exists
if [ ! -f "$SOURCE" ]; then
    echo "Source logo not found at $SOURCE"
    exit 1
fi

echo "Generating Android Icons from $SOURCE..."

# mdpi - 48x48
sips -z 48 48 "$SOURCE" --out "$RES_DIR/mipmap-mdpi/ic_launcher.png"
sips -z 48 48 "$SOURCE" --out "$RES_DIR/mipmap-mdpi/ic_launcher_round.png"

# hdpi - 72x72
sips -z 72 72 "$SOURCE" --out "$RES_DIR/mipmap-hdpi/ic_launcher.png"
sips -z 72 72 "$SOURCE" --out "$RES_DIR/mipmap-hdpi/ic_launcher_round.png"

# xhdpi - 96x96
sips -z 96 96 "$SOURCE" --out "$RES_DIR/mipmap-xhdpi/ic_launcher.png"
sips -z 96 96 "$SOURCE" --out "$RES_DIR/mipmap-xhdpi/ic_launcher_round.png"

# xxhdpi - 144x144
sips -z 144 144 "$SOURCE" --out "$RES_DIR/mipmap-xxhdpi/ic_launcher.png"
sips -z 144 144 "$SOURCE" --out "$RES_DIR/mipmap-xxhdpi/ic_launcher_round.png"

# xxxhdpi - 192x192
sips -z 192 192 "$SOURCE" --out "$RES_DIR/mipmap-xxxhdpi/ic_launcher.png"
sips -z 192 192 "$SOURCE" --out "$RES_DIR/mipmap-xxxhdpi/ic_launcher_round.png"

echo "Icon generation complete."
