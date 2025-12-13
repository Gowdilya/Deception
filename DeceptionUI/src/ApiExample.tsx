import { useEffect, useState } from 'react'

export const ApiExample = () => {
  const [data, setData] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Because of the proxy in vite.config.ts, this request to
    // '/api/game/state' is forwarded to 'http://localhost:8080/api/game/state'
    fetch('/api/game/state')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`)
        }
        // Assuming the backend returns JSON
        return res.json()
      })
      .then((jsonData) => setData(jsonData))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading backend data...</div>
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>

  return (
    <pre>{JSON.stringify(data, null, 2)}</pre>
  )
}