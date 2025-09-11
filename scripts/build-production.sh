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

# Remove Tailwind CDN from production build (it's only for development)
echo "🎨 Removing Tailwind CDN from production build..."
sed -i '' '/cdn\.tailwindcss\.com/d' dist/index.html

# Verify build
if [ ! -d "dist" ]; then
  echo "❌ Build failed - dist directory not found"
  exit 1
fi

echo "✅ Build completed successfully without Tailwind CDN"
echo "📁 Build output:"
ls -la dist/
