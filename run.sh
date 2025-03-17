#! /bin/bash

#compile typescript files
tsc

#if dist/public doesn't exist, create it
if [ ! -d "dist/public" ]; then
    mkdir -p dist/public
fi

#copy only html and css files from src/public to dist/public
cp -r src/public/*.html dist/public
cp -r src/public/*.css dist/public

#run the server
node dist/server/main.js