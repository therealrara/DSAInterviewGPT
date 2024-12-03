#!/usr/bin/env bash
export NODE_OPTIONS=--openssl-legacy-provider

# Navigate to the React app folder
cd ../src/www

# Install frontend dependencies
yarn install

# Build the React app for production
yarn build

# Serve the production build on the PORT provided by Heroku
npx serve -s build -l ${PORT:-5006}