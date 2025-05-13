# POI Finder - AI-Powered Point of Interest Recommendations

This web application allows users to discover points of interest in any location using AI to generate personalized recommendations. The app integrates several APIs to provide a comprehensive travel planning experience.

## Live Website

[https://poi-finder.onrender.com]()

*Disclaimer* This website will only be active for demonstration in class and will be shutdown after.

## Features

- **Location-Based Search**: Use your current location or enter a specific location manually
- **AI-Powered Recommendations**: Get personalized suggestions based on your preferences
- **Interactive Map**: Select locations directly from a map interface
- **User Preferences**: Customize search settings such as transportation mode, time constraints, and more
- **Save and View History**: Save your favorite searches and access them later
- **Mobile-Friendly Design**: Optimized for both desktop and mobile experiences

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (vanilla)
- **Backend**: TypeScript, Node.js, Express.js
- **Database**: Postgres
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
- API keys required for functionality, but not required to run:
  - Google Map (with JavaScript Map, Places (New), and Geocoding enabled)
  - Google Maps Platform (with Places (New), Geocoding, Routes, and Weather APIs enabled)
  - Google Gemini AI
- Postgres database

### Installation

1. Clone this repository and execute the run script:
   ```bash
   git clone https://github.com/eclipse-909/e_morton-394-lab2.git
   cd e_morton-394-lab2
   ./run.sh
   ```

2. Follow the instructions of the run script if you get errors. If you do not have API keys, most features will not work, but you can at least run and look at the website.

3. Visit http://127.0.0.1:8080 in your browser once the server starts. The website does not use TLS/SSL encryption because that will be provided by Heroku for the produciton build.

## Development

### Debugging

For VS Code-based editors, a .vscode directory is provided with a debug configuration. The tasks will not work if you have not successfully ran using the run.sh script once.

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

## Security Features

- Password hashing with bcrypt
- CSRF protection
- Rate limiting
- Session management
- Input validation and sanitization
- Secure cookies

## AI Integration

We use Retrieval-Augmented Generation (RAG) for our AI approach. This means that we dynamically gather information, put it in the prompt, and send it to the AI. Specifically, we are getting user preferences from the database, weather data, and nearby places from Google, and we inject this data into the prompt string directly. This prompt is sent to the AI. Since we dynamically retrieve the data every search, users can change their preferences, the weather can change, and nearby places can update their information without us having to do anything. As long as the APIs remain the same, the data can change and the AI model's job is to handle the data.

## License
Closed source at the moment. We may consider open sourcing when the project is done.