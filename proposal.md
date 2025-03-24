# Travel Planner App
## Problem Being Solved
Sometimes you want to find things to do in an area that you are either visiting, or live in. We want to help guide potential tourists or sightseers to local points of interests without having to ask around or blindly search the internet. This will be done by having an application that allows users to use their current location or a location that they specify to get the general points of interest in the area, alongside an AI summary of what those places are that they can visit.

## Planned Core Features
The main usage of this app is to find out points of interest in a given area, and the AI will display a list of things to do. Maybe it can give recommendations on the best times to do them and how to get there.
### Points of Interest (PoI)
- Search for PoIs in current or specified location
- Summarize things to do
- An AI that helps guide the user(Potentially)
- Save the list of locations
- Use weather data to find the best times to visit the PoI
- Use transportation data to find the best route to the PoI
## AI Integration
We will use the free tier of Google Gemini to generate the PoI recommendations.

## Technology Stack
We will be using TypeScript. The backend will be run with Node.js and Express for the server. We will not use a frontend framework. We will just use classic JavaScript, HTML, and CSS. We are also using SQLite for our database.

We will be using Google Gemini for our AI model, Google Maps API for Places, Routes, and a map integration, and OpenWeather API for weather data.