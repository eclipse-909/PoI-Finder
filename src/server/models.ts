export enum TransportMode {
  CAR = 'car',
  TAXI = 'taxi',
  BIKE = 'bike',
  WALK = 'walk',
  BUS = 'bus',
  TRAIN = 'train',
  SUBWAY = 'subway'
}

export interface User {
  username: string;
  password_hash: string;
}

export interface UserPreferences {
  username: string;
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
  id: number;
  username: string;
  location: string;
  name: string;
  date: string; // Date in ISO format
  description: string;
  image_url: string;
  mode_of_transport: TransportMode;
  arrival_time: string; // Time in ISO format
  departure_time: string; // Time in ISO format
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface SearchRequest {
  location: string;
  dateRange?: {
    start: string;
    end: string;
  };
  useCurrentLocation?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface WeatherData {
  date: string;
  temperature: number;
  condition: string;
  icon: string;
}

export interface RouteInfo {
  distance: string;
  duration: string;
  steps: string[];
}

export interface PointOfInterestResponse {
  id: number;
  name: string;
  description: string;
  image_url: string;
  location: string;
  address: string;
  type: string[];
  rating?: number;
  weather?: WeatherData;
  route?: RouteInfo;
  arrival_time?: string;
  departure_time?: string;
}

export interface SavedSearchSummary {
  id: number;
  location: string;
  date: string;
  count: number;
}

export interface UserSession {
  id: string;
  username: string;
  created_at: string;
  expires_at: string;
  ip_address: string;
  user_agent: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  password: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
} 