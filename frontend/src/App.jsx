import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [filename, setFilename] = useState('icon_shot')
  const [selection, setSelection] = useState(null) // { x, y, w, h }
  const [isDragging, setIsDragging] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [snapStatus, setSnapStatus] = useState('')

  const imgRef = useRef(null)

  const handleMouseDown = (e) => {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setStartPos({ x, y })
    setSelection({ x, y, w: 0, h: 0 })
    setIsDragging(true)
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    const x = Math.min(startPos.x, currentX)
    const y = Math.min(startPos.y, currentY)
    const w = Math.abs(currentX - startPos.x)
    const h = Math.abs(currentY - startPos.y)

    setSelection({ x, y, w, h })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleSnap = async () => {
    /* Allow snap without selection (Full Screen) */
    // if (!selection || selection.w === 0 || selection.h === 0) { ... }

    setSnapStatus('Snapping...')

    try {
      const body = { filename }

      if (selection && selection.w > 0 && selection.h > 0) {
        const naturalWidth = imgRef.current.naturalWidth
        const displayedWidth = imgRef.current.width
        const scale = naturalWidth / displayedWidth

        body.x = Math.round(selection.x * scale)
        body.y = Math.round(selection.y * scale)
        body.w = Math.round(selection.w * scale)
        body.h = Math.round(selection.h * scale)
      }

      const res = await fetch('/api/snap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        setSnapStatus(`Saved to ${data.path}`)
      } else {
        setSnapStatus(`Error: ${data.error}`)
      }
    } catch (err) {
      setSnapStatus(`Error: ${err.message}`)
    }
  }

  return (
    <div className="container" onMouseUp={handleMouseUp}>
      <h1>snap-adb</h1>

      <div className="controls">
        <label>
          Filename:
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
          />
        </label>
        <button onClick={handleSnap}>SNAP</button>
        <button onClick={() => setSelection(null)}>Clear</button>
        <span className="status">{snapStatus}</span>
      </div>

      <div className="stream-container">
        <img
          src="/stream"
          alt="ADB Stream"
          className="stream-video"
          ref={imgRef}
          draggable={false}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        />
        {selection && (
          <div
            className="overlay"
            style={{
              left: selection.x,
              top: selection.y,
              width: selection.w,
              height: selection.h
            }}
          >
            <div className="dims">{Math.round(selection.w)}x{Math.round(selection.h)}</div>
          </div>
        )}
      </div>

      <p className="hint">Drag on the video to crop an area.</p>
    </div>
  )
}

export default App
