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

export enum SecondaryHoursType {
	SECONDARY_HOURS_TYPE_UNSPECIFIED,
	DRIVE_THROUGH,
	HAPPY_HOUR,
	DELIVERY,
	TAKEOUT,
	KITCHEN,
	BREAKFAST,
	LUNCH,
	DINNER,
	BRUNCH,
	PICKUP,
	ACCESS,
	SENIOR_HOURS,
	ONLINE_SERVICE_HOURS
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
		periods: [
			{
				open: {
					date: {
						year: number,
						month: number,
						day: number
					},
					truncated: boolean,
					day: number,
					hour: number,
					minute: number
				},
				close: {
					date: {
						year: number,
						month: number,
						day: number
					},
					truncated: boolean,
					day: number,
					hour: number,
					minute: number
				}
			}
		],
		weekdayDescriptions: string[],
		secondaryHoursType: SecondaryHoursType,
		specialDays: [
			{
				date: {
					year: number,
					month: number,
					day: number
				}
			}
		],
		nextOpenTime: string,
		nextCloseTime: string,
		openNow: boolean
	},
	photos?: [
		{
			name: string,
			widthPx: number,
			heightPx: number,
			authorAttributions: [
				{
					displayName: string,
					uri: string,
					photoUri: string
				}
			],
			flagContentUri: string,
			googleMapsUri: string
		}
	],
	websiteUri?: string,

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
	routeDuration: string,
	modeOfTransport: TransportMode,
	weatherCondition: {
		///Must be appended with '.svg' to get the correct icon
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