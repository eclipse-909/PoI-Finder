# POI Finder - AI-Powered Point of Interest Recommendations

This web application allows users to discover points of interest in any location using AI to generate personalized recommendations. The app integrates several APIs to provide a comprehensive travel planning experience.

## Features

- **Location-Based Search**: Use your current location or enter a specific location manually
- **AI-Powered Recommendations**: Get personalized suggestions based on your preferences
- **Interactive Map**: Select locations directly from a map interface
- **User Preferences**: Customize search settings such as transportation mode, time constraints, and more
- **Save and View History**: Save your favorite searches and access them later
- **Mobile-Friendly Design**: Optimized for both desktop and mobile experiences

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (vanilla)
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **APIs**:
  - Google Maps JavaScript API
  - Google Places API
  - Google Geocoding API
  - Google Routes API
  - OpenWeather API
  - OpenAI GPT-4o Mini API

## Getting Started

### Prerequisites

- Node.js (v12 or higher)
- npm (v6 or higher)
- API keys for:
  - Google Maps Platform (with Places, Geocoding, and Routes APIs enabled)
  - OpenWeather API
  - OpenAI API

### Installation

1. Clone this repository:
   ```
   git clone <repository-url>
   cd poi-finder
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   GOOGLE_PLACES_API_KEY=your_google_places_api_key
   OPENWEATHER_API_KEY=your_openweather_api_key
   OPENAI_API_KEY=your_openai_api_key
   SESSION_SECRET=your_session_secret
   NODE_ENV=development
   PORT=3000
   DB_PATH=./database.sqlite
   TLS_CERT_PATH=./cert.pem
   TLS_KEY_PATH=./key.pem
   ```

4. Generate self-signed TLS certificates for development:
   ```
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   ```

5. Build the TypeScript code:
   ```
   npm run build
   ```

6. Start the server:
   ```
   npm start
   ```

7. Visit `https://localhost:3000` in your browser

### Development

For development with automatic recompilation:
```
npm run dev
```

## Project Structure

```
.
├── src/                    # Source code
│   ├── server/             # Backend code
│   │   ├── main.ts         # Server entry point
│   │   ├── routes.ts       # API routes
│   │   ├── controllers.ts  # Route controllers
│   │   └── models.ts       # Data models
│   ├── migrations/         # Database migrations
│   │   └── 01_initial_schema.sql
│   └── public/             # Frontend code
│       ├── css/            # Stylesheets
│       ├── js/             # JavaScript files
│       └── index.html      # Main HTML file
├── dist/                   # Compiled code
├── .env                    # Environment variables
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

## Required Assets

For the UI to look complete, you'll need to provide the following image assets in the `dist/public/images` directory:
- logo.png - Application logo (recommended size: 50x50px)
- hero.jpg - Hero image for the landing page (recommended size: 800x450px)
- feature-location.jpg - Feature image for location feature (recommended size: 400x200px)
- feature-ai.jpg - Feature image for AI feature (recommended size: 400x200px)
- feature-save.jpg - Feature image for save feature (recommended size: 400x200px)

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/signup` - User registration
- `GET /api/logout` - User logout
- `DELETE /api/delete_account` - Delete user account

### Preferences
- `GET /api/preferences` - Get user preferences
- `PATCH /api/preferences` - Update user preferences

### Searches
- `POST /api/search` - Search for points of interest
- `GET /api/saved_searches` - Get all saved searches
- `GET /api/saved_search/{id}` - Get a specific saved search
- `DELETE /api/delete_search/{id}` - Delete a saved search
- `POST /api/save_search/{id}` - Save a search

## Security Features

- HTTPS/TLS encryption
- Password hashing with bcrypt
- CSRF protection
- Rate limiting
- Session management
- Input validation and sanitization
- Secure cookies

## License
Closed source at the moment. We may consider open sourcing when the project is done.