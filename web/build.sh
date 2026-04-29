#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Building static site..."
npm run build

echo "Build complete. Static files are in out/ directory."
