import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const CARD_SETS = {
  fibonacci: {
    name: 'Fibonacci (Scrum)',
    icon: '🎲',
    values: [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, '?', '∞']
  },
  tshirt: {
    name: 'T-Shirt Sizing',
    icon: '👕',
    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '∞']
  }
};

function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [gameState, setGameState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(true);
  const [selectedCardSet, setSelectedCardSet] = useState('fibonacci');

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('game-state', (state) => {
      setGameState(state);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      alert(error.message);
    });

    return () => newSocket.close();
  }, []);

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (socket && roomId && playerName) {
      socket.emit('join-room', { roomId, playerName });
      setShowJoinForm(false);
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
  };

  const handleCastVote = (vote) => {
    if (socket && roomId) {
      socket.emit('cast-vote', { roomId, vote });
    }
  };

  const handleRevealVotes = () => {
    if (socket && roomId) {
      socket.emit('reveal-votes', { roomId });
    }
  };

  const handleResetVotes = () => {
    if (socket && roomId) {
      socket.emit('reset-votes', { roomId });
    }
  };

  const handleLeaveRoom = () => {
    setShowJoinForm(true);
    setGameState(null);
    setRoomId('');
    setPlayerName('');
  };

  if (showJoinForm) {
    return (
      <div className="app">
        <div className="join-container">
          <h1>Scrum Planning Poker</h1>
          <p>Join a game room to start estimating user stories</p>
          
          <form onSubmit={handleJoinRoom} className="join-form">
            <div className="form-group">
              <label htmlFor="playerName">Your Name:</label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="roomId">Room ID:</label>
              <div className="room-input-group">
                <input
                  type="text"
                  id="roomId"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter room ID"
                  required
                />
                <button type="button" onClick={handleCreateRoom} className="create-room-btn">
                  Create New Room
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label>Card Set:</label>
              <div className="card-set-selector">
                {Object.entries(CARD_SETS).map(([key, cardSet]) => (
                  <button
                    key={key}
                    type="button"
                    className={`card-set-toggle ${selectedCardSet === key ? 'selected' : ''}`}
                    onClick={() => setSelectedCardSet(key)}
                  >
                    <span className="card-set-icon">{cardSet.icon}</span>
                    <span className="card-set-label">{cardSet.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <button type="submit" className="join-btn" disabled={!isConnected}>
              {isConnected ? 'Join Room' : 'Connecting...'}
            </button>
          </form>
          
          <div className="connection-status">
            Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="app">
        <div className="loading">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="game-container">
        <div className="game-header">
          <h1>Scrum Planning Poker</h1>
          <div className="room-info">
            <span>Room: {roomId}</span>
            <span>Players: {gameState.players.length}</span>
            <button onClick={handleLeaveRoom} className="leave-btn">Leave Room</button>
          </div>
        </div>

        <div className="players-section">
          <h3>Players ({gameState.players.length})</h3>
          <div className="players-list">
            {gameState.players.map(player => (
              <div key={player.id} className={`player ${player.hasVoted ? 'voted' : ''}`}>
                <span className="player-name">{player.name}</span>
                <span className="vote-status">
                  {player.hasVoted ? '✓' : '⏳'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {!gameState.votesRevealed && (
          <div className="voting-section">
            <h3>Cast Your Vote</h3>
            <div className="cards-grid">
              {CARD_SETS[selectedCardSet].values.map(value => (
                <button
                  key={value}
                  className={`card ${gameState.players.find(p => p.id === socket.id)?.vote === value ? 'selected' : ''}`}
                  onClick={() => handleCastVote(value)}
                  disabled={gameState.votesRevealed}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="controls-section">
          {!gameState.votesRevealed && (
            <button 
              onClick={handleRevealVotes} 
              className="reveal-btn"
              disabled={!gameState.allVoted}
            >
              Reveal Votes
            </button>
          )}
          
          {gameState.votesRevealed && (
            <button 
              onClick={handleResetVotes} 
              className="reset-btn"
            >
              Reset Votes
            </button>
          )}
        </div>

        {gameState.votesRevealed && (
          <div className="results-section">
            <h3>Voting Results</h3>
            <div className="results-grid">
              {gameState.players.map(player => (
                <div key={player.id} className="result-item">
                  <span className="player-name">{player.name}</span>
                  <span className="vote-value">{gameState.votes[player.id] || 'No vote'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;