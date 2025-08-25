# Gemini 2.5 Powered Appointment Scheduling Agent

An AI-powered appointment scheduling system with natural language processing, voice capabilities, and a modern conversational interface.

## Features

- **Natural Language Processing**: Uses Gemini 2.5 for intelligent conversation and intent recognition
- **Voice Interface**: Speech-to-text and text-to-speech capabilities
- **Calendar Management**: Schedule, check availability, and list appointments
- **Responsive Design**: Works seamlessly across all devices
- **Real-time Chat**: Modern conversational interface with typing indicators

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Web Speech API for voice features
- Zustand for state management
- Lucide React for icons

### Backend
- Flask with Python
- PostgreSQL database
- Google Calendar API integration
- Gemini AI API integration

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- PostgreSQL
- Google Calendar API credentials
- Gemini AI API key

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

```bash
# Navigate to server directory
cd server

# Install Python dependencies
pip install -r requirements.txt

# Set environment variables
export GEMINI_API_KEY="your_gemini_api_key"
export GOOGLE_CALENDAR_CREDENTIALS="path_to_credentials.json"
export DATABASE_URL="postgresql://username:password@localhost/scheduler_db"

# Initialize database
python database.py

# Start Flask server
python main.py
```

### Environment Variables

Create a `.env` file in the server directory:

```
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CALENDAR_CREDENTIALS=./credentials.json
DATABASE_URL=postgresql://username:password@localhost/scheduler_db
FLASK_ENV=development
```

### Google Calendar API Setup

1. Go to the Google Cloud Console
2. Create a new project or select existing
3. Enable the Google Calendar API
4. Create credentials (OAuth 2.0 Client ID)
5. Download the credentials.json file to the server directory

## Usage

1. Start the backend server: `python server/main.py`
2. Start the frontend: `npm run dev`
3. Open your browser to `http://localhost:5173`
4. Start chatting with the Scheduler Bot!

### Example Commands

- "Schedule a meeting with John at 2 PM tomorrow"
- "Am I free on Friday at 3 PM?"
- "What's on my schedule for next week?"
- "Cancel my 10 AM meeting"
- "Move my Tuesday meeting to Wednesday"

## API Endpoints

- `POST /api/chat` - Send message to AI agent
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `GET /api/availability` - Check calendar availability
- `DELETE /api/appointments/:id` - Delete appointment

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details