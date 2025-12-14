import { useEffect, useState } from 'react'
import './Game.css'

interface Room {
  code: string
  players: string[]
  isStarted: boolean
}

export const ApiExample = () => {
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null)
  const [roomData, setRoomData] = useState<Room | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    if (!joinedRoom) return

    // Poll for room updates every 2 seconds
    const interval = setInterval(() => {
      fetch(`/api/game/${joinedRoom}`)
        .then((res) => res.json())
        .then((data) => setRoomData(data))
        .catch((err) => console.error(err))
    }, 2000)

    return () => clearInterval(interval)
  }, [joinedRoom])

  const createRoom = () => {
    if (!name) return alert('Enter name')
    fetch('/api/game/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setJoinedRoom(data.code)
        setRoomCode(data.code)
        setError(null)
      })
      .catch((err) => setError(err.message))
  }

  const joinRoom = () => {
    if (!name || !roomCode) return alert('Enter name and code')
    fetch('/api/game/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: roomCode, name }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Room not found')
        setJoinedRoom(roomCode)
        setError(null)
      })
      .catch((err) => setError(err.message))
  }

  if (joinedRoom) {
    return (
      <div className="game-container fade-in">
        <div className="game-header">
          <h1 className="game-title">Deception</h1>
        </div>
        <div className="game-card">
          <h2 style={{ fontSize: '2rem', margin: '0 0 1.5rem 0', color: 'white' }}>Lobby</h2>
          
          <div className="room-code-display">
            <span className="code-label">Room Code</span>
            <div className="code-value">{joinedRoom}</div>
          </div>

          <div className="label">Players Joined</div>
          <ul className="player-list">
            {roomData?.players.map((p) => (
              <li key={p} className="player-item">{p}</li>
            ))}
          </ul>

          <div className="label">Waiting for host to start...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="game-container fade-in">
      <div className="game-header">
        <h1 className="game-title">Deception</h1>
        <p className="game-tagline">Don't know who to trust...</p>
      </div>

      <div className="game-card">
        {error && <div className="error-msg">{error}</div>}

        <div className="input-group">
          <label className="label">Your Name</label>
          <input
            className="game-input"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {!isJoining ? (
          <>
            <button className="btn btn-primary" onClick={createRoom}>Create New Game</button>
            <button className="btn btn-secondary" onClick={() => setIsJoining(true)}>Join Existing Game</button>
          </>
        ) : (
          <div className="fade-in">
            <div className="input-group">
              <label className="label">Room Code</label>
              <input
                className="game-input"
                placeholder="ABCD"
                maxLength={6}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              />
            </div>
            <button className="btn btn-primary" onClick={joinRoom}>Enter Room</button>
            <button className="btn btn-secondary" onClick={() => setIsJoining(false)}>Back</button>
          </div>
        )}
      </div>
    </div>
  )
}