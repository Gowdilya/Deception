import { useEffect, useState, useRef } from 'react'
import './Game.css'
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr'

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
  const [isLoading, setIsLoading] = useState(false)
  const connectionRef = useRef<HubConnection | null>(null)

  useEffect(() => {
    if (!joinedRoom) return

    let mounted = true

    const fetchRoomData = () => {
      setIsLoading(true)
      fetch(`/api/game/${joinedRoom}`)
        .then((res) => {
          if (!res.ok) throw new Error('Room not found')
          return res.json()
        })
        .then((data) => {
          if (!mounted) return
          setRoomData(data)
        })
        .catch((err) => {
          setError(err.message)
          setJoinedRoom(null) // room is invalid
        })
        .finally(() => setIsLoading(false))
    }

    // initial REST fetch to get current state
    fetchRoomData()

    // set up SignalR connection
    const conn = new HubConnectionBuilder()
      .withUrl('/gamehub')
      .withAutomaticReconnect()
      .build()

    conn.on('PlayerJoined', (payload: any) => {
      console.debug('SignalR PlayerJoined payload', payload)
      setRoomData((prev) => ({ ...(prev ?? { code: joinedRoom, players: [], isStarted: false }), players: payload.players ?? payload.Players ?? prev?.players }))
    })

    conn.on('PlayerLeft', (payload: any) => {
      console.debug('SignalR PlayerLeft payload', payload)
      setRoomData((prev) => ({ ...(prev ?? { code: joinedRoom, players: [], isStarted: false }), players: payload.players ?? payload.Players ?? prev?.players }))
    })

    conn.on('GameStarted', (payload: any) => {
      setRoomData((prev) => ({ ...(prev ?? { code: joinedRoom, players: [], isStarted: true }), isStarted: true, players: payload.players ?? payload.Players ?? prev?.players }))
    })

    conn.start()
      .then(() => conn.invoke('JoinRoom', joinedRoom, name))
      .catch((err) => console.error('SignalR connection error', err))

    connectionRef.current = conn

    return () => {
      mounted = false
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {})
        connectionRef.current = null
      }
    }
  }, [joinedRoom, name])

  // debug: log roomData whenever it changes
  useEffect(() => {
    console.debug('RoomData updated', roomData)
  }, [roomData])

  const createRoom = () => {
    if (!name) return alert('Enter name')
    setIsLoading(true)
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
      .finally(() => setIsLoading(false))
  }

  const joinRoom = () => {
    if (!name || !roomCode) return alert('Enter name and code')
    setIsLoading(true)
    setError(null)

    // Validate room exists before setting joinedRoom
    fetch(`/api/game/${roomCode}`)
      .then((res) => {
        if (!res.ok) throw new Error('Room not found')
        // We don't need the response body here, just confirmation that the room exists.
        // The useEffect will fetch the full room details and handle the SignalR join.
        setJoinedRoom(roomCode)
      })
      .catch((err) => {
        setError(err.message)
        setIsLoading(false)
      })
  }

  const startGame = () => {
    if (!joinedRoom) return
    setIsLoading(true)
    fetch('/api/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: joinedRoom }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.message || 'Failed to start game')
        }
        // The useEffect polling will update the game state
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }

  if (isLoading && !roomData) {
    return (
      <div className="game-container fade-in">
        <div className="game-card">Loading...</div>
      </div>
    )
  }

  if (joinedRoom) {
    const isHost = roomData?.players[0] === name;

    return (
      <div className="game-container fade-in">
        <div className="game-header">
          <h1 className="game-title">Deception</h1>
        </div>
        <div className="game-card">
          {error && <div className="error-msg">{error}</div>}
          <h2 style={{ fontSize: '2rem', margin: '0 0 1.5rem 0', color: 'white' }}>Lobby</h2>
          
          <div className="room-code-display">
            <span className="code-label">Room Code</span>
            <div className="code-value">{joinedRoom}</div>
          </div>

          {roomData?.isStarted ? (
            <div className="label">Game has started!</div>
          ) : (
            <>
              <div className="label">Players Joined ({roomData?.players.length ?? 0})</div>
              <ul className="player-list">
                {roomData?.players.map((p, i) => (
                  <li key={`${p}-${i}`} className="player-item">{p}</li>
                ))}
              </ul>

              {isHost ? (
                <button 
                  className="btn btn-start" 
                  onClick={startGame}
                  disabled={(roomData?.players.length ?? 0) < 4}
                >
                  Start Game
                </button>
              ) : (
                <div className="label">Waiting for host to start...</div>
              )}
              {(roomData?.players.length ?? 0) < 4 && isHost && (
                <div className="label" style={{marginTop: '1rem', fontSize: '0.9rem'}}>
                  Need at least 4 players to start.
                </div>
              )}
            </>
          )}
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