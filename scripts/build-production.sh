#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting production build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building application..."
npm run build

# Fix Tailwind CDN in built HTML
echo "🎨 Adding Tailwind CDN to built HTML..."
sed -i '' '/cdn\.tailwindcss\.com/d' dist/index.html
sed -i '' '/<script type="module" crossorigin src="\/assets\/main-/i\
    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>' dist/index.html

# Verify build
if [ ! -d "dist" ]; then
  echo "❌ Build failed - dist directory not found"
  exit 1
fi

echo "✅ Build completed successfully with Tailwind CDN"
echo "📁 Build output:"
ls -la dist/
