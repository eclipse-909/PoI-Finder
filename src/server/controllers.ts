import { Request, Response } from 'express';
import { Pool, QueryResult } from 'pg';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import axios, { AxiosError } from 'axios';
import { 
	ApiResponse,
	PointOfInterestResponse, 
	Coordinates,
	TransportMode, 
	UserPreferences,
	Search,
	GeminiResponse,
	PointOfInterest
} from './models';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import fs from 'fs';

// Prompt string for Gemini
const promptFileText = fs.readFileSync('./src/server/gemini_prompt.md', 'utf8');

// ChatGPT estimated speeds in m/s for each mode of transport
const transportSpeeds = {
	Walk: 1.4,
	Bicycle: 4.2,
	Drive: 13.9,
	Transit: 8.3
};

// Add custom type to extend Express Request
declare global {
	namespace Express {
		interface Request {
			user?: { username: string };
		}
	}
}

// Database connection
let db: Pool;

export const initializeDatabase = (pool: Pool) => {
	db = pool;
};

// Helper function to create API responses
const createResponse = <T>(success: boolean, data?: T, errorCode?: string, errorMessage?: string): ApiResponse<T> => {
	const response: ApiResponse<T> = { success };
	
	if (data) {
		response.data = data;
	}
	
	if (errorCode && errorMessage) {
		response.error = {
			code: errorCode,
			message: errorMessage
		};
	}
	
	return response;
};

// Authentication controllers
export const login = async (req: Request, res: Response) => {
	const { username, password } = req.body;
	
	if (!username || !password) {
		return res.status(400).json(createResponse(false, undefined, 'INVALID_INPUT', 'Username and password are required'));
	}
	
	try {
		// Get user from database
		const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
		
		if (result.rows.length === 0) {
			return res.status(401).json(createResponse(false, undefined, 'AUTH_FAILED', 'Invalid username or password'));
		}
		
		const row = result.rows[0];
		
		// Check password
		const match = await bcrypt.compare(password, row.password_hash);
		
		if (!match) {
			return res.status(401).json(createResponse(false, undefined, 'AUTH_FAILED', 'Invalid username or password'));
		}
		
		// Set the user in the session
		req.session.user = { username: username };
		
		// Generate CSRF token for this session
		req.session.csrfToken = Math.random().toString(36).substring(2, 15) + 
							   Math.random().toString(36).substring(2, 15);
		
		// Make sure the session is saved before responding
		req.session.save((err) => {
			if (err) {
				console.error('Session save error:', err);
				return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
			}
			
			console.log('Session saved successfully:', req.session.id);
			
			// Return success
			res.json({
				success: true,
				data: {
					username,
					csrfToken: req.session.csrfToken
				}
			});
		});
	} catch (err) {
		console.error('Database error:', err);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};

export const signup = async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;
		
		if (!username || !password) {
			return res.status(400).json(createResponse(false, undefined, 'INVALID_INPUT', 'Username and password are required'));
		}
		
		// Password validation
		if (password.length < 8) {
			return res.status(400).json(createResponse(false, undefined, 'INVALID_PASSWORD', 'Password must be at least 8 characters long'));
		}
		
		if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
			return res.status(400).json(createResponse(
				false, 
				undefined, 
				'INVALID_PASSWORD', 
				'Password must contain at least one uppercase letter, one lowercase letter, and one number'
			));
		}
		
		// Check if username already exists
		const userCheck = await db.query('SELECT username FROM users WHERE username = $1', [username]);
		
		if (userCheck.rows.length > 0) {
			return res.status(409).json(createResponse(false, undefined, 'USERNAME_EXISTS', 'Username already exists'));
		}
		
		// Hash password
		const saltRounds = 10;
		const passwordHash = await bcrypt.hash(password, saltRounds);
		
		// Create user
		const result = await db.query(
			'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING username', 
			[username, passwordHash]
		);
		
		// Create default preferences
		const defaultPrefs: UserPreferences = {
			mode_of_transport: TransportMode.TRANSIT,
			eat_out: true,
			wake_up: '08:00',
			home_by: '22:00',
			start_date: new Date().toISOString().slice(0, 10),
			end_date: new Date().toISOString().slice(0, 10),
			range: 30,
			context: ''
		};
		
		await db.query(
			'INSERT INTO preferences (username, mode_of_transport, eat_out, wake_up, home_by, start_date, end_date, range, context) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
			[
				username,
				defaultPrefs.mode_of_transport,
				defaultPrefs.eat_out,
				defaultPrefs.wake_up,
				defaultPrefs.home_by,
				defaultPrefs.start_date,
				defaultPrefs.end_date,
				defaultPrefs.range,
				defaultPrefs.context
			]
		);
		
		// Set session cookie
		const sessionId = crypto.randomBytes(64).toString('hex');
		res.cookie('session', sessionId, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
		});
		
		return res.status(201).json(createResponse(true, { username }));
	} catch (error) {
		console.error('Signup error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};

export const changePassword = async (req: Request, res: Response) => {
	try {
		const { current_password, new_password } = req.body;
		const username = req.session.user?.username;

		if (!username || !current_password || !new_password) {
			return res.status(400).json(createResponse(false, undefined, 'INVALID_INPUT', 'Missing required fields'));
		}

		// Check current password
		const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
		
		if (result.rows.length === 0) {
			return res.status(401).json(createResponse(false, undefined, 'AUTH_FAILED', 'Invalid username or password'));
		}

		const passwordMatch = await bcrypt.compare(current_password, result.rows[0].password_hash);
		if (!passwordMatch) {
			return res.status(401).json(createResponse(false, undefined, 'AUTH_FAILED', 'Invalid current password'));
		}

		const saltRounds = 10;
		const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

		await db.query('UPDATE users SET password_hash = $1 WHERE username = $2', [newPasswordHash, username]);
		
		return res.status(200).json(createResponse(true, { message: 'Password updated successfully' }));
	} catch (error) {
		console.error('Change password error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};

export const logout = (req: Request, res: Response) => {
	// Destroy the session
	req.session.destroy((err) => {
		if (err) {
			console.error('Logout error:', err);
			return res.status(500).json({
				success: false,
				error: {
					code: 'SERVER_ERROR',
					message: 'Internal server error'
				}
			});
		}
		
		res.json({ success: true });
	});
};

export const deleteAccount = async (req: Request, res: Response) => {
	try {
		const username: string = req.session.user?.username ?? '';
		
		// Delete user from database (cascade will delete preferences, searches, points of interest, and sessions)
		await db.query('DELETE FROM users WHERE username = $1', [username]);
		
		// Clear session cookie
		res.clearCookie('session');
		return res.status(200).json(createResponse(true));
	} catch (error) {
		console.error('Delete account error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};

// Preferences controllers
export const getPreferences = async (req: Request, res: Response) => {
	try {
		const username: string = req.session.user?.username ?? '';
		
		// Then check if it's empty
		if (!username) {
			return res.status(500).json({
				success: false,
				error: {
					code: 'SESSION_ERROR',
					message: 'User session is invalid or missing username'
				}
			});
		}
		
		const result = await db.query('SELECT * FROM preferences WHERE username = $1', [username]);
		
		if (result.rows.length === 0) {
			return res.status(404).json(createResponse(false, undefined, 'NOT_FOUND', 'Preferences not found'));
		}
		
		const row = result.rows[0];
		const preferences: UserPreferences = {
			mode_of_transport: row.mode_of_transport as TransportMode,
			eat_out: !!row.eat_out,
			wake_up: row.wake_up,
			home_by: row.home_by,
			start_date: row.start_date,
			end_date: row.end_date,
			range: row.range,
			context: row.context
		};
		
		return res.status(200).json(createResponse(true, preferences));
	} catch (error) {
		console.error('Get preferences error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};

export const updatePreferences = async (req: Request, res: Response) => {
	try {
		const username: string = req.session.user?.username ?? '';
		
		// Then check if it's empty
		if (!username) {
			return res.status(500).json({
				success: false,
				error: {
					code: 'SESSION_ERROR',
					message: 'User session is invalid or missing username'
				}
			});
		}
		
		const preferences: UserPreferences = req.body;
		
		if (!preferences) {
			return res.status(400).json(createResponse(false, undefined, 'INVALID_INPUT', 'Preferences are required'));
		}
		
		// Validate preferences
		if (preferences.range < 0 || preferences.range > 60) {
			preferences.range = 60;
		}
		if (preferences.wake_up >= preferences.home_by) {
			return res.status(400).json(createResponse(false, undefined, 'INVALID_INPUT', 'Wake up time must be before home by time'));
		}
		if (new Date(preferences.start_date) > new Date(preferences.end_date)) {
			return res.status(400).json(createResponse(false, undefined, 'INVALID_INPUT', 'Start date must be before end date'));
		}
		
		// Get today's date in local timezone YYYY-MM-DD format
		const today = new Date();
		const todayStr = today.getFullYear() + '-' + 
			String(today.getMonth() + 1).padStart(2, '0') + '-' + 
			String(today.getDate()).padStart(2, '0');
		
		if (preferences.start_date < todayStr) {
			return res.status(400).json(createResponse(false, undefined, 'INVALID_INPUT', 'Start date must be today or in the future'));
		}
		
		await db.query(
			`UPDATE preferences 
			 SET mode_of_transport = $1, eat_out = $2, wake_up = $3, home_by = $4, 
			     start_date = $5, end_date = $6, range = $7, context = $8
			 WHERE username = $9`,
			[
				preferences.mode_of_transport,
				preferences.eat_out,
				preferences.wake_up,
				preferences.home_by,
				preferences.start_date,
				preferences.end_date,
				preferences.range,
				preferences.context,
				username
			]
		);
		
		return res.status(200).json(createResponse(true, preferences));
	} catch (error) {
		console.error('Update preferences error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};

// Search controllers
export const search = async (req: Request, res: Response) => {
	try {
		const gemini_key = process.env.GOOGLE_GEMINI_API_KEY;
		if (!gemini_key) {
			throw new Error('GOOGLE_GEMINI_API_KEY is not set');
		}
		const maps_platform_key = process.env.GOOGLE_MAPS_PLATFORM_API_KEY;
		if (!maps_platform_key) {
			throw new Error('GOOGLE_MAPS_PLATFORM_API_KEY is not set');
		}

		const username: string | undefined = req.session.user?.username;
		
		// Then check if it's empty
		if (!username) {
			return res.status(500).json({
				success: false,
				error: {
					code: 'SESSION_ERROR',
					message: 'User session is invalid or missing username'
				}
			});
		}
		
		const searchData: Coordinates = req.body;
		
		// Get user preferences
		const prefsResult = await db.query('SELECT * FROM preferences WHERE username = $1', [username]);
		
		if (prefsResult.rows.length === 0) {
			console.error('No preferences found');
			return res.status(400).json(createResponse(false, undefined, 'INVALID_INPUT', 'Preferences are required'));
		}
		
		const prefsRow = prefsResult.rows[0];
		const preferences: UserPreferences = {
			mode_of_transport: prefsRow.mode_of_transport,
			eat_out: prefsRow.eat_out,
			wake_up: prefsRow.wake_up,
			home_by: prefsRow.home_by,
			start_date: prefsRow.start_date,
			end_date: prefsRow.end_date,
			range: prefsRow.range,
			context: prefsRow.context
		};

		const date = new Date().toISOString();
		if (new Date(preferences.start_date) < new Date()) {
			preferences.start_date = date;
		}
		if (new Date(preferences.end_date) < new Date()) {
			preferences.end_date = date;
		}
		const preferencesContext: string = JSON.stringify(preferences, null, 2);
		
		// Save search to database
		const searchResult = await db.query(
			'INSERT INTO search (username, latitude, longitude, date) VALUES ($1, $2, $3, $4) RETURNING search_id',
			[username, searchData.latitude, searchData.longitude, date]
		);
		
		const searchId = searchResult.rows[0].search_id;

		// Get nearby places using Google Places API
		//Most of these fields use Places Pro or Enterprise, so we don't get as many free requests.
		//https://developers.google.com/maps/documentation/javascript/place-class-data-fields
		const placesFields: string[] = [
			"displayName",
			"editorialSummary",
			"formattedAddress",
			"regularOpeningHours",
			"photos",
			"id",
			"websiteUri"
		];
		const foodPlacesFields: string[] = [
			"dineIn",
			"servesBreakfast",
			"servesBrunch",
			"servesDessert",
			"servesDinner",
			"servesLunch",
			"takeout"
		];
		//You must use the types from table A, not table B. There cannot be more than 50 total.
		//https://developers.google.com/maps/documentation/places/web-service/place-types
		//These are the types from the categories Culture, Entertainment and Recreation, Natural Features, and Sports
		const placesTypes: string[] = [
			"art_gallery",
			"cultural_landmark",
			"historical_place",
			"monument",
			"museum",
			"performing_arts_theater",
			"adventure_sports_center",
			"amphitheatre",
			"amusement_center",
			"amusement_park",
			"aquarium",
			"botanical_garden",
			"casino",
			"comedy_club",
			"concert_hall",
			"cultural_center",
			"event_venue",
			"ferris_wheel",
			"garden",
			"hiking_area",
			"historical_landmark",
			"karaoke",
			"marina",
			"national_park",
			"night_club",
			"opera_house",
			"philharmonic_hall",
			"plaza",
			"roller_coaster",
			"state_park",
			"tourist_attraction",
			"water_park",
			"zoo",
			"beach",
			"arena",
			"athletic_field",
			"golf_course",
			"ice_skating_rink",
			"ski_resort",
			"sports_activity_location",
			"sports_complex",
			"stadium",
			"swimming_pool"
		];
		//These are the types from the categories Food and Drink
		const foodPlacesTypes: string[] = [
			"bar",
			"breakfast_restaurant",
			"brunch_restaurant",
			"dessert_restaurant",
			"fine_dining_restaurant",
			"pub",
			"restaurant"
		];
		// Radius (meters) = range (minutes) * speed (meters/second) * 60 (seconds/minute)
		let radius: number = preferences.range * transportSpeeds[preferences.mode_of_transport] * 60;
		if (radius <= 0 || radius > 50000) {
			radius = 50000; //setting radius to 0 minutes in preferences will set it to maximum distance
		}
		const request = {
			// required parameters
			locationRestriction: {
				circle: {
					center: {
						latitude: searchData.latitude,
						longitude: searchData.longitude
					},
					radius: radius
				}
			},
			// optional parameters
			includedTypes: preferences.eat_out ? placesTypes.concat(foodPlacesTypes) : placesTypes,
			maxResultCount: 20,
			rankPreference: "POPULARITY",
			languageCode: "en-US",
			regionCode: "us"
		};
		const placesResponse = await axios.post(
			`https://places.googleapis.com/v1/places:searchNearby`,
			request,
			{
				headers: {
					"X-Goog-Api-Key": maps_platform_key,
					"X-Goog-FieldMask": (preferences.eat_out ? placesFields.concat(foodPlacesFields) : placesFields).map((field: string) => {return "places." + field}).join(",")
				}
			}
		);
		// handle error
		if (placesResponse.status !== 200) {
			console.error('Error from Google Places API');
			return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Error from Google Places API'));
		}
		let places: any[] = placesResponse.data.places;
		if (!places || places.length === 0) {
			console.error('No places found');
			return res.status(400).json(createResponse(false, undefined, 'INVALID_INPUT', 'No places found'));
		}
		const placesContext: string = JSON.stringify(places, null, 2);

		// Get weather data (if applicable)
		const end_date = new Date(preferences.end_date);
		const currentDate = new Date();
		const daysDifference = Math.ceil((end_date.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
		let weatherContext: string | undefined = undefined;
		try {
			if (daysDifference <= 1 && daysDifference >= 0) {
				// end_date is within 24 hours
				const weatherData = await axios.get(
					`https://weather.googleapis.com/v1/forecast/hours:lookup?key=${maps_platform_key}&location.latitude=${searchData.latitude}&location.longitude=${searchData.longitude}&hours=24&pageSize=24`
				);
				weatherContext = JSON.stringify(weatherData.data, null, 2);
			} else if (daysDifference <= 10 && daysDifference >= 0) {
				// The end_date is within the next 10 days
				const weatherData = await axios.get(
					`https://weather.googleapis.com/v1/forecast/days:lookup?key=${maps_platform_key}&location.latitude=${searchData.latitude}&location.longitude=${searchData.longitude}&days=${daysDifference}&pageSize=${daysDifference}`
				);
				weatherContext = JSON.stringify(weatherData.data, null, 2);
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;
		  
				// If the error has a response from the API
				if (axiosError.response) {
					res.status(axiosError.response.status).json({
						message: 'Error from Google Weather API',
						details: axiosError.response.data,
					});
				} else if (axiosError.request) {
					// The request was made but no response received
					res.status(504).json({ message: 'No response from Google Weather API' });
				} else {
					// Something else happened in setting up the request
					res.status(500).json({ message: 'Error setting up API request', details: axiosError.message });
				}
			} else {
				// Non-Axios error (e.g., unexpected runtime error)
				res.status(500).json({ message: 'Unexpected server error' });
			}
			return;
		}

		// Make gemini call to get recommendations.
		// Gemini should give a list of JSON objects with an arrival time
		// which we can use to get the route data
		const genAI = new GoogleGenAI({ apiKey: gemini_key });

		const prompt = promptFileText
			.replace("LOCATION_PLACEHOLDER", `Latitude: ${searchData.latitude}, Longitude: ${searchData.longitude}`)
			.replace("PREFERENCES_PLACEHOLDER", preferencesContext)
			.replace("PLACES_PLACEHOLDER", placesContext)
			.replace("WEATHER_PLACEHOLDER", weatherContext ?? "Weather data not applicable - please ignore.");

		const response: GenerateContentResponse = await genAI.models.generateContent({
			model: "gemini-2.0-flash-lite",
			contents: prompt
		});
		if (response.text === undefined) {
			console.error('No response from Gemini');
			return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'No response from Gemini'));
		}

		// Parse the response from Gemini
		let recommendedPlaces: GeminiResponse;
		try {
			recommendedPlaces = JSON.parse(response.text.replace('```json\n', '').replace('\n```', '')) as GeminiResponse;
		} catch (error) {
			console.error('Invalid response from Gemini');
			return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Invalid response from Gemini'));
		}
		recommendedPlaces.places = recommendedPlaces.places.filter((place: any) => {
			// The AI might make typos, so unfortunately we have to exlude the places where the ID doesn't match
			return places.some((p: any) => p.id === place.id);
		});

		// Get Route Data
		const origin = {
			"via": false,
			"vehicleStopover": false,
			"sideOfRoad": false,
			"location": {
				"latLng": {
					"latitude": searchData.latitude,
					"longitude": searchData.longitude
				}
			}
		};
		let destinations: any[] = [];
		recommendedPlaces.places.forEach((place) => {
			destinations.push({
				"id": place.id,
				"waypoint": {
					"via": false,
					"vehicleStopover": false,
					"sideOfRoad": false,
					"placeId": place.id
				},
				"arrivalTime": place.arrival_time,
			});
		});
		let preferredMode: TransportMode = preferences.mode_of_transport;
		let routeResponses: any[] = [];
		const routeHeaders = {
			headers: {
				"X-Goog-Api-Key": maps_platform_key,
				"X-Goog-FieldMask": "routes.duration"
			}
		};
		try {
			if (preferredMode === TransportMode.TRANSIT) {
				// Since transit isn't always reliable, we'll get the route for the first destination.
				// If transit is available, we can do the rest of the destinations.
				// Otherwise, we'll switch to driving, try again, and do the rest of the destinations.
				try {
					let routeResponse = await axios.post(
						"https://routes.googleapis.com/directions/v2:computeRoutes",
						{
							"origin": origin,
							"destination": destinations[0].waypoint,
							"travelMode": "TRANSIT",
							"arrivalTime": destinations[0].arrivalTime,
							"computeAlternativeRoutes": true,
							"languageCode": "en-US",
							"regionCode": "us",
							"units": "METRIC"
						},
						routeHeaders
					);
					routeResponse.data.id = destinations[0].id;
					routeResponses.push(routeResponse.data);
				} catch (error) {
					if (axios.isAxiosError(error)) {
						const axiosError = error as AxiosError;
				  
						// If the error has a response from the API
						if (axiosError.response) {
							// Switch to driving
							preferredMode = TransportMode.DRIVE;
							// Try again
							let routeResponse = await axios.post(
								"https://routes.googleapis.com/directions/v2:computeRoutes",
								{
									"origin": origin,
									"destination": destinations[0].waypoint,
									"travelMode": preferredMode,
									"computeAlternativeRoutes": true,
									"languageCode": "en-US",
									"regionCode": "us",
									"units": "METRIC"
								},
								routeHeaders
							);
							routeResponse.data.id = destinations[0].id;
							routeResponses.push(routeResponse.data);
						} else if (axiosError.request) {
							// The request was made but no response received
							res.status(504).json({ message: 'No response from Google Routes API' });
						} else {
							// Something else happened in setting up the request
							res.status(500).json({ message: 'Error setting up API request', details: axiosError.message });
						}
					} else {
						// Non-Axios error (e.g., unexpected runtime error)
						res.status(500).json({ message: 'Unexpected server error' });
					}
				}
				// Do the rest of the destinations
				for (let i = 1; i < destinations.length; i++) {
					let routeResponse = await axios.post(
						"https://routes.googleapis.com/directions/v2:computeRoutes",
						{
							"origin": origin,
							"destination": destinations[0].waypoint,
							"travelMode": preferredMode,
							"arrivalTime": preferredMode === TransportMode.TRANSIT ? destinations[0].arrivalTime : undefined,
							"computeAlternativeRoutes": true,
							"languageCode": "en-US",
							"regionCode": "us",
							"units": "METRIC"
						},
						routeHeaders
					);
					routeResponse.data.id = destinations[i].id;
					routeResponses.push(routeResponse.data);
				}
			} else {
				// Get route for each destination
				for (const dest of destinations) {
					let routeResponse = await axios.post(
						"https://routes.googleapis.com/directions/v2:computeRoutes",
						{
							"origin": origin,
							"destination": dest.waypoint,
							"travelMode": preferences.mode_of_transport,
							"computeAlternativeRoutes": true,
							"languageCode": "en-US",
							"regionCode": "us",
							"units": "METRIC"
						},
						routeHeaders
					);
					routeResponse.data.id = dest.id;
					routeResponses.push(routeResponse.data);
				}
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;

				// If the error has a response from the API
				if (axiosError.response) {
					res.status(axiosError.response.status).json({
						message: 'Error from Google Routes API',
						details: axiosError.response.data,
					});
				} else if (axiosError.request) {
					// The request was made but no response received
					res.status(504).json({ message: 'No response from Google Routes API' });
				} else {
					// Something else happened in setting up the request
					res.status(500).json({ message: 'Error setting up API request', details: axiosError.message });
				}
			} else {
				// Non-Axios error (e.g., unexpected runtime error)
				res.status(500).json({ message: 'Unexpected server error' });
			}
			return;
		}

		let pois: PointOfInterestResponse[] = [];
		for (let i = 0; i < recommendedPlaces.places.length; i++) {
			const place = recommendedPlaces.places[i];
			const poi: PointOfInterest | undefined = places.find((p: any) => p.id === place.id) as PointOfInterest | undefined;
			const routeResponse = routeResponses.find((r: any) => r.id === place.id);
			if (!poi || !routeResponse || !routeResponse.routes || routeResponse.routes.length === 0) {
				continue;
			}
			pois.push({
				poi: poi,
				arrivalTime: place.arrival_time,
				routeDuration: routeResponse.routes[0].duration,
				modeOfTransport: preferredMode,
				weatherCondition: place.weatherCondition
			});
		}

		// Insert PoIs into database
		for (const poi of pois) {
			await db.query(
				`INSERT INTO points_of_interest (id, json_data)
				 VALUES ($1, $2)
				 ON CONFLICT (id) DO UPDATE SET json_data = $2`,
				[
					poi.poi.id,
					JSON.stringify(poi)
				]
			);
			
			await db.query(
				`INSERT INTO search_poi (search_id, poi_id)
				 VALUES ($1, $2)
				 ON CONFLICT (search_id, poi_id) DO NOTHING`,
				[searchId, poi.poi.id]
			);
		}
		
		return res.status(200).json(createResponse(true, { searchId }));
	} catch (error) {
		console.error('Search error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};

export const getSavedSearches = async (req: Request, res: Response) => {
	try {
		const username: string | undefined = req.session.user?.username;
		
		// Then check if it's empty
		if (!username) {
			return res.status(500).json({
				success: false,
				error: {
					code: 'SESSION_ERROR',
					message: 'User session is invalid or missing username'
				}
			});
		}
		
		const query = `
			SELECT
				s.search_id,
				s.latitude,
				s.longitude,
				s.date,
				COUNT(sp.poi_id) as poi_count
			FROM
				search s
			LEFT JOIN
				search_poi sp ON s.search_id = sp.search_id
			WHERE
				s.username = $1
			GROUP BY
				s.search_id
			ORDER BY
				s.date DESC
		`;
		
		const result = await db.query(query, [username]);
		
		const searches: Search[] = result.rows.map(row => ({
			search_id: row.search_id,
			latitude: row.latitude,
			longitude: row.longitude,
			date: row.date,
			poi_count: row.poi_count
		}));
		
		return res.status(200).json(createResponse(true, searches));
	} catch (error) {
		console.error('Get saved searches error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};

export const getSavedSearch = async (req: Request, res: Response) => {
	try {
		const username: string | undefined = req.session.user?.username;
		
		// Then check if it's empty
		if (!username) {
			return res.status(500).json({
				success: false,
				error: {
					code: 'SESSION_ERROR',
					message: 'User session is invalid or missing username'
				}
			});
		}
		
		const { id } = req.params;
		
		// Get search data and POIs
		const query: string = `
			SELECT poi.id, poi.json_data, s.search_id, s.latitude, s.longitude, s.date
			FROM points_of_interest poi
			JOIN search_poi sp ON poi.id = sp.poi_id
			JOIN search s ON s.search_id = sp.search_id
			WHERE s.search_id = $1 AND s.username = $2;
		`;

		const result = await db.query(query, [id, username]);
		
		if (result.rows.length === 0) {
			return res.status(404).json(createResponse(false, undefined, 'NOT_FOUND', 'Search not found'));
		}
		
		// Get POIs for this search
		const pointsOfInterest: PointOfInterestResponse[] = result.rows.map(row => JSON.parse(row.json_data));
		
		return res.status(200).json(createResponse(true, {
			searchId: result.rows[0].search_id,
			location: {
				latitude: result.rows[0].latitude,
				longitude: result.rows[0].longitude
			},
			date: result.rows[0].date,
			pointsOfInterest
		}));
	} catch (error) {
		console.error('Get saved search error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};

export const deleteSearch = async (req: Request, res: Response) => {
	try {
		const username: string | undefined = req.session.user?.username;
		
		// Then check if it's empty
		if (!username) {
			return res.status(500).json({
				success: false,
				error: {
					code: 'SESSION_ERROR',
					message: 'User session is invalid or missing username'
				}
			});
		}
		
		const { id } = req.params;
		
		const checkResult = await db.query(
			'SELECT search_id FROM search WHERE search_id = $1 AND username = $2', 
			[id, username]
		);
		
		if (checkResult.rows.length === 0) {
			return res.status(404).json(createResponse(false, undefined, 'NOT_FOUND', 'Search not found'));
		}
		
		await db.query('DELETE FROM search WHERE search_id = $1', [id]);
		
		return res.status(200).json(createResponse(true));
	} catch (error) {
		console.error('Delete search error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};