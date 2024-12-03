#!/usr/bin/env bash
export NODE_OPTIONS=--openssl-legacy-provider
# Debug: Print the PORT variable
echo "Using PORT: $PORT"

# Install dependencies
yarn install

# Build the production app
yarn build

# Serve the production build on Heroku's dynamic PORT
npx serve -s build -l ${PORT:-5006}  # Fallback to port 5000 if PORT is not set
