#!/bin/bash

# Fix Tailwind CDN in built HTML
echo "Adding Tailwind CDN to built HTML..."

# Remove any existing Tailwind CDN scripts
sed -i '' '/cdn\.tailwindcss\.com/d' dist/index.html

# Add Tailwind CDN script after the structured data script
sed -i '' '/<\/script>/a\
    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>' dist/index.html

echo "Tailwind CDN added successfully!"
