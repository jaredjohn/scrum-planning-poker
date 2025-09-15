# Scrum Planning Poker

A real-time Scrum planning poker game built with React and Socket.io. Perfect for remote teams to estimate user stories collaboratively.

## Features

- 🎯 **Real-time Voting**: Cast your story point estimates in real-time
- 🏠 **Game Rooms**: Create or join rooms with unique IDs
- 👥 **Multiplayer**: Support for multiple players in the same room
- 🔄 **Vote Management**: Reveal all votes at once, reset for new stories
- 📱 **Responsive Design**: Works great on desktop and mobile
- ⚡ **Live Updates**: See when players have voted and their status

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Real-time**: Socket.io
- **Styling**: CSS3 with modern design

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd scrum-planning-poker
```

2. Install all dependencies:
```bash
npm run install-all
```

3. Start the development servers:
```bash
npm run dev
```

This will start both the backend server (port 3001) and frontend client (port 5173).

### Manual Setup

If you prefer to run the servers separately:

**Backend:**
```bash
cd server
npm install
npm run dev
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

## How to Use

1. **Join a Room**: Enter your name and either create a new room or join an existing one
2. **Cast Votes**: Click on story point cards (1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, ∞)
3. **Reveal Votes**: Once everyone has voted, click "Reveal Votes" to see all estimates
4. **Reset**: Click "Reset Votes" to start estimating the next story

## Card Values

The game uses the Fibonacci sequence for story points:
- **1, 2, 3, 5, 8, 13, 21, 34, 55, 89** - Standard story point values
- **?** - Need more information
- **∞** - Too big to estimate

## Development

### Project Structure

```
scrum-planning-poker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   ├── App.css        # Styles
│   │   └── main.jsx       # Entry point
│   └── package.json
├── server/                 # Node.js backend
│   ├── index.js           # Express server with Socket.io
│   └── package.json
└── package.json           # Root package.json with scripts
```

### Available Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run client` - Start only the React client
- `npm run server` - Start only the Node.js server
- `npm run build` - Build the client for production
- `npm start` - Start the production server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
