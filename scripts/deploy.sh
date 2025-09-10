#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting deployment..."

# Build the application
./scripts/build-production.sh

# Deploy to Firebase
echo "🔥 Deploying to Firebase..."
firebase deploy --only hosting

echo "✅ Deployment completed successfully"
