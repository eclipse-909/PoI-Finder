import { Request, Response } from 'express';
import { Database } from 'sqlite3';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import axios from 'axios';
import { 
	ApiResponse, 
	LoginRequest, 
	PointOfInterestResponse, 
	SearchRequest, 
	SignupRequest, 
	TransportMode, 
	UserPreferences,
	SavedSearchSummary
} from './models';

// Add custom type to extend Express Request
declare global {
	namespace Express {
		interface Request {
			user?: { username: string };
		}
	}
}

// Database connection
let db: Database;

export const initializeDatabase = (database: Database) => {
	db = database;
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
	
	// Get user from database
	db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row: any) => {
		if (err) {
			console.error('Database error:', err);
			return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
		}
		
		if (!row) {
			return res.status(401).json(createResponse(false, undefined, 'AUTH_FAILED', 'Invalid username or password'));
		}
		
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
	});
};

export const signup = async (req: Request, res: Response) => {
	try {
		const { username, password }: SignupRequest = req.body;
		
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
		db.get('SELECT username FROM users WHERE username = ?', [username], async (err, row) => {
			if (err) {
				console.error('Database error:', err);
				return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
			}
			
			if (row) {
				return res.status(409).json(createResponse(false, undefined, 'USERNAME_EXISTS', 'Username already exists'));
			}
			
			// Hash password
			const saltRounds = 10;
			const passwordHash = await bcrypt.hash(password, saltRounds);
			
			// Create user
			db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash], function(err) {
				if (err) {
					console.error('Database error:', err);
					return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
				}
				
				// Create default preferences
				const defaultPrefs: UserPreferences = {
					username,
					mode_of_transport: TransportMode.CAR,
					eat_out: true,
					wake_up: '08:00',
					home_by: '22:00',
					start_date: new Date().toISOString().slice(0, 10),
					end_date: new Date().toISOString().slice(0, 10),
					range: 30,
					context: ''
				};
				
				db.run(
					'INSERT INTO preferences (username, mode_of_transport, eat_out, wake_up, home_by, start_date, end_date, range, context) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
					[
						defaultPrefs.username,
						defaultPrefs.mode_of_transport,
						defaultPrefs.eat_out ? 1 : 0,
						defaultPrefs.wake_up,
						defaultPrefs.home_by,
						defaultPrefs.start_date,
						defaultPrefs.end_date,
						defaultPrefs.range,
						defaultPrefs.context
					],
					(err) => {
						if (err) {
							console.error('Database error:', err);
							// User was created, so we'll still proceed with login
						}
						
						// Log user in
						const sessionId = crypto.randomBytes(64).toString('hex');
						const now = new Date();
						const expires = new Date(now);
						expires.setDate(expires.getDate() + 7); // 7 days session
						
						// const ip = req.ip || req.socket.remoteAddress || '';
						// const userAgent = req.headers['user-agent'] || '';
						
						// db.run(
						// 	'INSERT INTO sessions (id, username, created_at, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
						// 	[sessionId, username, now.toISOString(), expires.toISOString(), ip, userAgent],
						// 	(err) => {
						// 		if (err) {
						// 			console.error('Database error:', err);
						// 			return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
						// 		}
								
						// 		// Set session cookie
						// 		res.cookie('session', sessionId, {
						// 			httpOnly: true,
						// 			secure: process.env.NODE_ENV === 'production',
						// 			sameSite: 'strict',
						// 			expires
						// 		});
								
						// 		return res.status(201).json(createResponse(true, { username }));
						// 	}
						// );

						// Set session cookie
						res.cookie('session', sessionId, {
							httpOnly: true,
							secure: process.env.NODE_ENV === 'production',
							sameSite: 'strict',
							expires
						});
						
						return res.status(201).json(createResponse(true, { username }));
					}
				);
			});
		});
	} catch (error) {
		console.error('Signup error:', error);
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

export const deleteAccount = (req: Request, res: Response) => {
	try {
		const { username } = req.session.user as { username: string };
		
		// Delete user from database (cascade will delete preferences, searches, points of interest, and sessions)
		db.run('DELETE FROM users WHERE username = ?', [username], (err) => {
			if (err) {
				console.error('Database error:', err);
				return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
			}
			
			// Clear session cookie
			res.clearCookie('session');
			return res.status(200).json(createResponse(true));
		});
	} catch (error) {
		console.error('Delete account error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};

// Preferences controllers
export const getPreferences = (req: Request, res: Response) => {
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
		
		db.get('SELECT * FROM preferences WHERE username = ?', [username], (err, row: any) => {
			if (err) {
				console.error('Database error:', err);
				return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
			}
			
			if (!row) {
				return res.status(404).json(createResponse(false, undefined, 'NOT_FOUND', 'Preferences not found'));
			}
			
			const preferences: UserPreferences = {
				username: row.username,
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
		});
	} catch (error) {
		console.error('Get preferences error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};

export const updatePreferences = (req: Request, res: Response) => {
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
		if (preferences.range && (preferences.range < 1 || preferences.range > 300)) {
			return res.status(400).json(createResponse(
				false, 
				undefined, 
				'INVALID_INPUT', 
				'Range must be between 1 and 300 minutes'
			));
		}
		
		db.run(
			`UPDATE preferences 
			 SET mode_of_transport = ?, eat_out = ?, wake_up = ?, home_by = ?, start_date = ?, end_date = ?, range = ?, context = ?
			 WHERE username = ?`,
			[
				preferences.mode_of_transport,
				preferences.eat_out ? 1 : 0,
				preferences.wake_up,
				preferences.home_by,
				preferences.start_date,
				preferences.end_date,
				preferences.range,
				preferences.context,
				username
			],
			(err) => {
				if (err) {
					console.error('Database error:', err);
					return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
				}
				
				return res.status(200).json(createResponse(true, preferences));
			}
		);
	} catch (error) {
		console.error('Update preferences error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};

// Search controllers
export const search = async (req: Request, res: Response) => {
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
		
		const searchData: SearchRequest = req.body;
		
		if (!searchData || (!searchData.location && !searchData.useCurrentLocation)) {
			return res.status(400).json(createResponse(
				false, 
				undefined, 
				'INVALID_INPUT', 
				'Location information is required'
			));
		}
		
		let location = searchData.location;
		
		// Get current location name if using coordinates
		if (searchData.useCurrentLocation && searchData.latitude && searchData.longitude) {
			try {
				// Use Google Geocoding API to get location name from coordinates
				const geocodeResult = await axios.get(
					`https://maps.googleapis.com/maps/api/geocode/json?latlng=${searchData.latitude},${searchData.longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`
				);
				
				if (geocodeResult.data.results && geocodeResult.data.results.length > 0) {
					location = geocodeResult.data.results[0].formatted_address;
				} else {
					location = `${searchData.latitude},${searchData.longitude}`;
				}
			} catch (error) {
				console.error('Geocoding error:', error);
				location = `${searchData.latitude},${searchData.longitude}`;
			}
		}
		
		// Get user preferences
		db.get('SELECT * FROM preferences WHERE username = ?', [username], async (err, prefsRow: any) => {
			if (err) {
				console.error('Database error:', err);
				return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
			}
			
			const preferences = prefsRow ? {
				mode_of_transport: prefsRow.mode_of_transport as TransportMode,
				eat_out: !!prefsRow.eat_out,
				wake_up: prefsRow.wake_up,
				home_by: prefsRow.home_by,
				start_date: prefsRow.start_date,
				end_date: prefsRow.end_date,
				range: prefsRow.range,
				context: prefsRow.context
			} : null;
			
			// Save search to database
			const date = new Date().toISOString();
			
			db.run(
				'INSERT INTO searches (username, location, date) VALUES (?, ?, ?)',
				[username, location, date],
				async function(err) {
					if (err) {
						console.error('Database error:', err);
						return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
					}
					
					const searchId = this.lastID;
					
					try {
						// Get nearby places using Google Places API
						const placesResult = await axios.get(
							`https://maps.googleapis.com/maps/api/place/textsearch/json?query=tourist+attractions+in+${encodeURIComponent(location)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
						);
						
						// Get weather data
						let weatherData = [];
						try {
							// Extract lat,lng for weather API call
							let lat, lng;
							
							if (searchData.latitude && searchData.longitude) {
								lat = searchData.latitude;
								lng = searchData.longitude;
							} else if (placesResult.data.results && placesResult.data.results.length > 0) {
								const firstPlace = placesResult.data.results[0];
								lat = firstPlace.geometry.location.lat;
								lng = firstPlace.geometry.location.lng;
							}
							
							if (lat && lng) {
								const weatherResult = await axios.get(
									`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`
								);
								weatherData = weatherResult.data.list || [];
							}
						} catch (error) {
							console.error('Weather API error:', error);
							// Continue without weather data
						}
						
						// Make API call to OpenAI for AI-based recommendations
						const places = placesResult.data.results || [];
						
						// Prepare data for AI
						const aiRequestData = {
							location,
							preferences,
							places: places.map((place: any) => ({
								name: place.name,
								address: place.formatted_address,
								types: place.types,
								rating: place.rating
							})),
							weather: weatherData.map((item: any) => ({
								date: item.dt_txt,
								temperature: item.main.temp,
								condition: item.weather[0].main,
								description: item.weather[0].description,
								icon: item.weather[0].icon
							}))
						};
						
						const aiResponse = await axios.post(
							'https://api.openai.com/v1/chat/completions',
							{
								model: 'gpt-4o-mini',
								messages: [
									{
										role: 'system',
										content: 'You are a travel assistant that recommends points of interest for tourists. Based on the provided location, places data, user preferences, and weather forecast, recommend the best places to visit. For each recommendation, provide a brief description, why it\'s worth visiting, and the best time to visit based on the weather and user preferences.'
									},
									{
										role: 'user',
										content: JSON.stringify(aiRequestData)
									}
								],
								temperature: 0.7,
								max_tokens: 1000
							},
							{
								headers: {
									'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
									'Content-Type': 'application/json'
								}
							}
						);
						
						const aiSuggestions = aiResponse.data.choices[0].message.content;
						
						// Parse AI suggestions
						const suggestions = JSON.parse(aiSuggestions);
						
						// Get route information for each POI
						const pointsOfInterest: PointOfInterestResponse[] = [];
						
						// Get route for each place
						for (const suggestion of suggestions) {
							const place = places.find((p: any) => p.name === suggestion.name) || places[0];
							
							// Get detailed place info including photos
							let photoUrl = '';
							try {
								const placeDetailsResult = await axios.get(
									`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=photos&key=${process.env.GOOGLE_MAPS_API_KEY}`
								);
								
								if (placeDetailsResult.data.result && 
										placeDetailsResult.data.result.photos && 
										placeDetailsResult.data.result.photos.length > 0) {
									const photoRef = placeDetailsResult.data.result.photos[0].photo_reference;
									photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
								}
							} catch (error) {
								console.error('Place details error:', error);
								// Continue without photo
							}
							
							// Get route to place based on user preferences
							let routeData;
							try {
								const origin = searchData.useCurrentLocation && searchData.latitude && searchData.longitude
									? `${searchData.latitude},${searchData.longitude}`
									: location;
									
								const destination = `${place.geometry.location.lat},${place.geometry.location.lng}`;
								const transportMode = preferences?.mode_of_transport || 'driving';
								
								const routeResult = await axios.get(
									`https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${transportMode}&key=${process.env.GOOGLE_MAPS_API_KEY}`
								);
								
								if (routeResult.data.routes && routeResult.data.routes.length > 0) {
									const route = routeResult.data.routes[0];
									const leg = route.legs[0];
									
									routeData = {
										distance: leg.distance.text,
										duration: leg.duration.text,
										steps: leg.steps.map((step: any) => step.html_instructions)
									};
								}
							} catch (error) {
								console.error('Route error:', error);
								// Continue without route data
							}
							
							// Save POI to database
							db.run(
								`INSERT INTO points_of_interest (
									search_id, name, description, image_url, location, mode_of_transport
								) VALUES (?, ?, ?, ?, ?, ?)`,
								[
									searchId,
									suggestion.name,
									suggestion.description,
									photoUrl,
									place.formatted_address,
									preferences?.mode_of_transport || TransportMode.CAR
								],
								function(err) {
									if (err) {
										console.error('Database error:', err);
										// Continue with response
									}
								}
							);
							
							// Add to response
							pointsOfInterest.push({
								id: pointsOfInterest.length + 1,
								name: suggestion.name,
								description: suggestion.description,
								image_url: photoUrl,
								location: place.formatted_address,
								address: place.formatted_address,
								type: place.types || [],
								rating: place.rating,
								weather: suggestion.weather,
								route: routeData,
								arrival_time: suggestion.arrival_time,
								departure_time: suggestion.departure_time
							});
						}
						
						return res.status(200).json(createResponse(true, {
							searchId,
							location,
							date,
							pointsOfInterest
						}));
					} catch (error) {
						console.error('API error:', error);
						return res.status(500).json(createResponse(false, undefined, 'API_ERROR', 'Error fetching data from external APIs'));
					}
				}
			);
		});
	} catch (error) {
		console.error('Search error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};

export const getSavedSearches = (req: Request, res: Response) => {
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
		
		const query = `
			SELECT 
				s.id, 
				s.location, 
				s.date,
				COUNT(poi.id) as count
			FROM 
				searches s
			LEFT JOIN 
				points_of_interest poi ON s.id = poi.search_id
			WHERE 
				s.username = ?
			GROUP BY 
				s.id
			ORDER BY 
				s.date DESC
		`;
		
		db.all(query, [username], (err, rows: any[]) => {
			if (err) {
				console.error('Database error:', err);
				return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
			}
			
			const searches: SavedSearchSummary[] = rows.map(row => ({
				id: row.id,
				location: row.location,
				date: row.date,
				count: row.count
			}));
			
			return res.status(200).json(createResponse(true, searches));
		});
	} catch (error) {
		console.error('Get saved searches error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};

export const getSavedSearch = (req: Request, res: Response) => {
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
		
		const { id } = req.params;
		
		// Get search data
		db.get('SELECT * FROM searches WHERE id = ? AND username = ?', [id, username], (err, searchRow: any) => {
			if (err) {
				console.error('Database error:', err);
				return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
			}
			
			if (!searchRow) {
				return res.status(404).json(createResponse(false, undefined, 'NOT_FOUND', 'Search not found'));
			}
			
			// Get POIs for this search
			db.all('SELECT * FROM points_of_interest WHERE search_id = ?', [id], (err, poiRows: any[]) => {
				if (err) {
					console.error('Database error:', err);
					return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
				}
				
				const pointsOfInterest: PointOfInterestResponse[] = poiRows.map(row => ({
					id: row.id,
					name: row.name,
					description: row.description,
					image_url: row.image_url,
					location: row.location,
					address: row.location,
					type: [],
					mode_of_transport: row.mode_of_transport as TransportMode,
					arrival_time: row.arrival_time,
					departure_time: row.departure_time
				}));
				
				return res.status(200).json(createResponse(true, {
					searchId: searchRow.id,
					location: searchRow.location,
					date: searchRow.date,
					saved: !!searchRow.saved,
					pointsOfInterest
				}));
			});
		});
	} catch (error) {
		console.error('Get saved search error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};

export const deleteSearch = (req: Request, res: Response) => {
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
		
		const { id } = req.params;
		
		db.get('SELECT id FROM searches WHERE id = ? AND username = ?', [id, username], (err, row) => {
			if (err) {
				console.error('Database error:', err);
				return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
			}
			
			if (!row) {
				return res.status(404).json(createResponse(false, undefined, 'NOT_FOUND', 'Search not found'));
			}
			
			db.run('DELETE FROM searches WHERE id = ?', [id], (err) => {
				if (err) {
					console.error('Database error:', err);
					return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
				}
				
				return res.status(200).json(createResponse(true));
			});
		});
	} catch (error) {
		console.error('Delete search error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
};

export const saveSearch = (req: Request, res: Response) => {
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
		
		const { id } = req.params;
		
		db.get('SELECT id FROM searches WHERE id = ? AND username = ?', [id, username], (err, row) => {
			if (err) {
				console.error('Database error:', err);
				return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
			}
			
			if (!row) {
				return res.status(404).json(createResponse(false, undefined, 'NOT_FOUND', 'Search not found'));
			}
			
			db.run('UPDATE searches SET saved = 1 WHERE id = ?', [id], (err) => {
				if (err) {
					console.error('Database error:', err);
					return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
				}
				
				return res.status(200).json(createResponse(true));
			});
		});
	} catch (error) {
		console.error('Save search error:', error);
		return res.status(500).json(createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error'));
	}
}; 