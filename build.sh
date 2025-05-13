#!/bin/bash

# This script is used to build the server for production
rm -rf dist
npm install
npm install --save-dev @types/express @types/pg @types/bcrypt @types/cors @types/cookie-parser @types/express-session @types/connect-pg-simple
tsc
mkdir -p dist/public
cp -r src/public/* dist/public 2>/dev/null || true
mkdir -p dist/migrations
cp -r src/migrations/* dist/migrations 2>/dev/null || true