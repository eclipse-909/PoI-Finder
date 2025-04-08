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
  - Google Places (New) API
  - Google Geocoding API
  - Google Routes API
  - Google Weather API
  - Google Gemini API

## Getting Started

### Prerequisites

- Node.js
- npm
- API keys for:
  - Google Maps Platform (with JavaScript Map, Places (New), Geocoding, Routes, and Weather APIs enabled)
  - Google Gemini AI

### Installation

1. Clone this repository and execute the run script:
   ```bash
   git clone https://github.com/eclipse-909/e_morton-394-lab2.git
   cd e_morton-394-lab2
   ./run.sh
   ```

2. Follow the instructions of the run script if you get errors. If you do not have API keys, most features will not work, but you can at least look at the website.

3. Visit https://127.0.0.1:3000 in your browser once the server starts.

## Development

### Debugging

For VS Code-based editors, a .vscode directory is provided with a debug configuration.

### Project Structure

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
│       ├── images/         # Image files
│       └── index.html      # Main HTML file
├── dist/                   # Compiled code
├── .env                    # Environment variables
├── cert.pem                # Certificate for TLS encryption
├── key.pem                 # Key for TLS encryption
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

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