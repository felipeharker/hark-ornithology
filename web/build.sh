#!/bin/bash
set -e
echo "Building Next.js app..."
npm install
npm run build
echo "Build complete!"
