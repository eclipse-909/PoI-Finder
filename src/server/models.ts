export enum TransportMode {
	DRIVE = "Drive",
	TRANSIT = "Transit",
	WALK = "Walk",
	BICYCLE = "Bicycle"
}

export interface User {
	username: string;
	password_hash: string;
}

export interface UserPreferences {
	mode_of_transport: TransportMode;
	eat_out: boolean;
	wake_up: string; // Time in ISO format
	home_by: string; // Time in ISO format
	start_date: string; // Date in ISO format
	end_date: string; // Date in ISO format
	range: number; // Range in minutes
	context: string;
}

export interface PointOfInterest {
	id: string,
	displayName: {
		text: string,
		languageCode: string
	},
	editorialSummary?: {
		text: string,
		languageCode: string
	},
	formattedAddress?: string,
	openingHours?: {
		periods: any[],
		weekdayDescriptions: string[],
		secondaryHoursType: any,
		specialDays: any[],
		nextOpenTime: string,
		nextCloseTime: string,
		openNow: boolean
	},
	photos?: any[],
	websiteURI?: string,
	addressDescriptor?: {
		landmarks: any[],
		areas: any[]
	},

	hasDineIn?: boolean,
	servesBreakfast?: boolean,
	servesBrunch?: boolean,
	servesDessert?: boolean,
	servesDinner?: boolean,
	servesLunch?: boolean,
	hasTakeout?: boolean
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
	};
}

export interface Coordinates {
	latitude: number;
	longitude: number;
}

export interface PointOfInterestResponse {
	poi: PointOfInterest,
	arrivalTime: string,
	departureTime: string,
	routeDuration: string,
	weatherCondition: {
		iconBaseUri: string,
		description: {
			text: string,
			languageCode: string
		},
		type: string
	}
	maxTemperature?: {
		degrees: number,
		unit: string
	},
	minTemperature?: {
		degrees: number,
		unit: string
	},
	temperature?: {
		degrees: number,
		unit: string
	}
}

export interface Search {
	search_id: number;
	latitude: number;
	longitude: number;
	date: string;
}

export interface GeminiResponse {
	places: {
		id: string;
		arrival_time: string;
		departure_time: string;
		weatherCondition: {
			iconBaseUri: string,
			description: {
				text: string,
				languageCode: string
			},
			type: string
        }
		maxTemperature?: {
			degrees: number,
			unit: string
		},
		minTemperature?: {
			degrees: number,
			unit: string
		},
		temperature?: {
			degrees: number,
			unit: string
		}
	}[];
}