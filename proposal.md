# Travel Planner App
## Problem Being Solved
Sometimes you want to find things to do in an area that you are either visiting, or live in. We want to help guide potential tourists or sightseers to local points of interests without having to ask around or blindly search the internet. This will be done by having an application that allows users to use their current location or a location that they specify to get the general points of interest in the area, alongside an AI summary of what those places are that they can visit.

## Planned Core Features
The main usage of this app is to find out points of interest in a given area, and the AI will display a list of things to do. Maybe it can give recommendations on the best times to do them. We could even go a step further if we have time and have a button to generate an itinerary. The itinerary should give an output of points of interest along with details about it, when you should go, and how to get there.
### Points of Interest (PoI)
- Search for PoIs in current or specified location
- Summarize things to do
- An AI that helps guide the user(Potentially)
- Save the list of locations
- Use weather data to find the best times to visit the PoI
- Use transportation data to find the best route to the PoI
### Itinerary - Possibly
- After generating the list of PoIs, there could be a button to generate an itinerary based on the PoIs
- User can input preferences: prefered mode of transport, whether you want to find places to eat, time to wake up and be home by, time range you will be in the area (day trip, a few days, a couple weeks, etc), text input for any additional context
- AI generates an itinerary that plans out your activities and what PoIs you should visit, transportation, and activities throughout your travels

## AI Integration
We're not quite settled on the specifics, but we will likely have an AI API subscription. We don't know how we will be using it yet, but we have an idea of what we want to send and receive with the API.

## Technology Stack
We will be using TypeScript. The backend will be run with Node.js and Express for the server. We will not use a frontend framework. We will just use classic TypeScript, HTML, and CSS.

We will need some APIs for things like weather data and transportation data. We have yet to decide on which API to use.