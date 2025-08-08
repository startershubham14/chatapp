#!/bin/bash

echo "Updating frontend dependencies..."

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Install dependencies
npm install

# Clear any cached files
npm cache clean --force

echo "Dependencies updated successfully!"
echo "You can now run 'npm start' to start the development server."
