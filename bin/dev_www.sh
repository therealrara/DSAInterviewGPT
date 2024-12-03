#!/usr/bin/env bash
export NODE_OPTIONS=--openssl-legacy-provider

# Install dependencies
yarn install

# Build the production app
yarn build

# Serve the production build on Heroku's dynamic PORT
npx serve -s build -l $PORT
