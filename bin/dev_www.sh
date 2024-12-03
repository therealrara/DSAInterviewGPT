#!/usr/bin/env bash
export NODE_OPTIONS=--openssl-legacy-provider

# Install dependencies
yarn install

# Build the production app
yarn build

# Serve the production build
npx serve -s build
