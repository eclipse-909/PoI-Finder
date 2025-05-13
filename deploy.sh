#!/bin/bash

# This script is used to deploy the server to a production environment
rm -rf dist
npm install
tsc
mkdir -p dist/public
cp -r src/public/* dist/public 2>/dev/null || true
mkdir -p dist/migrations
cp -r src/migrations/* dist/migrations 2>/dev/null || true
node dist/server/main.js