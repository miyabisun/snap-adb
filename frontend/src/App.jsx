import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [tab, setTab] = useState('live') // 'live' | 'gallery'
  const [filename, setFilename] = useState('')
  const [selection, setSelection] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [snapStatus, setSnapStatus] = useState('')

  // Gallery State
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [cacheBuster, setCacheBuster] = useState(Date.now())

  const imgRef = useRef(null)

  // Load files when switching to gallery
  useEffect(() => {
    if (tab === 'gallery') {
      fetchFiles()
    }
  }, [tab])

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files')
      const data = await res.json()
      setFiles(data.files || [])
      setCacheBuster(Date.now()) // Force reload images when returning to gallery
    } catch (e) {
      console.error('Failed to fetch files', e)
    }
  }

  const handleDelete = async (e, fname) => {
    e.stopPropagation()
    if (!confirm(`Delete ${fname}?`)) return

    try {
      await fetch('/api/file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: fname })
      })

      // Update list
      setFiles(prev => prev.filter(f => f !== fname))
      if (selectedFile === fname) setSelectedFile(null)
    } catch (e) {
      alert('Delete failed')
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to DELETE ALL images?')) return

    try {
      await fetch('/api/files', { method: 'DELETE' })
      setFiles([])
      setSelectedFile(null)
    } catch (e) {
      alert('Delete all failed')
    }
  }

  /* Resizing & Moving logic */
  const [resizingHandle, setResizingHandle] = useState(null) // 'nw', 'ne', 'sw', 'se'
  const [isMoving, setIsMoving] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const getRelPos = (e) => {
    const rect = imgRef.current.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  // 1. Start Adjustment (Resize) - Attached to handles
  const handleStartResize = (e, handle) => {
    e.preventDefault()
    e.stopPropagation() // Prevent triggering image/box handlers
    setResizingHandle(handle)
  }

  // 2. Start Move - Attached to selection box
  const handleStartMove = (e) => {
    e.preventDefault()
    e.stopPropagation() // Prevent triggering image handler (which clears selection)
    const { x: mX, y: mY } = getRelPos(e)
    setIsMoving(true)
    setDragOffset({ x: mX - selection.x, y: mY - selection.y })
  }

  // 3. Start New Draw - Attached to Image/Container (Background)
  const handleStartDraw = (e) => {
    e.preventDefault()
    // If we clicked on the image background (not box/handle), start new selection
    const { x, y } = getRelPos(e)
    setStartPos({ x, y })
    setSelection({ x, y, w: 0, h: 0 })
    setIsDrawing(true)
  }

  // Common Move Handler (attached to container)
  const handleMouseMove = (e) => {
    // If not interacting, do nothing
    if (!isDrawing && !isMoving && !resizingHandle) return

    const { x: currX, y: currY } = getRelPos(e)

    // A. Handle Resize
    if (resizingHandle && selection) {
      let { x, y, w, h } = selection

      if (resizingHandle === 'nw') {
        const newW = (x + w) - currX
        const newH = (y + h) - currY
        if (newW > 0) { x = currX; w = newW }
        if (newH > 0) { y = currY; h = newH }
      } else if (resizingHandle === 'ne') {
        w = currX - x
        const newH = (y + h) - currY
        if (newH > 0) { y = currY; h = newH }
      } else if (resizingHandle === 'sw') {
        const newW = (x + w) - currX
        if (newW > 0) { x = currX; w = newW }
        h = currY - y
      } else if (resizingHandle === 'se') {
        w = currX - x
        h = currY - y
      }
      setSelection({ x, y, w: Math.max(0, w), h: Math.max(0, h) })
      return
    }

    // B. Handle Move
    if (isMoving && selection) {
      const newX = currX - dragOffset.x
      const newY = currY - dragOffset.y
      setSelection({ ...selection, x: newX, y: newY })
      return
    }

    // C. Handle New Drawing
    if (isDrawing) {
      const x = Math.min(startPos.x, currX)
      const y = Math.min(startPos.y, currY)
      const w = Math.abs(currX - startPos.x)
      const h = Math.abs(currY - startPos.y)
      setSelection({ x, y, w, h })
    }
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
    setResizingHandle(null)
    setIsMoving(false)
  }

  const handleSnap = async () => {
    setSnapStatus('Snapping...')

    try {
      const body = { filename }

      if (selection && selection.w > 0 && selection.h > 0) {
        const naturalWidth = imgRef.current.naturalWidth
        const displayedWidth = imgRef.current.width
        const scale = naturalWidth / displayedWidth

        // Calibration v3
        // Top is fine (-2), Bottom needs more height.
        const OFFSET_Y = -2
        const OFFSET_W = 5
        const OFFSET_H = 10

        body.x = Math.round(selection.x * scale)
        body.y = Math.round(selection.y * scale) + OFFSET_Y
        body.w = Math.round(selection.w * scale) + OFFSET_W
        body.h = Math.round(selection.h * scale) + OFFSET_H

        // Ensure within bounds
        if (body.x < 0) body.x = 0
        if (body.y < 0) body.y = 0
        if (body.w < 1) body.w = 1

      }

      const res = await fetch('/api/snap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        setSnapStatus(`Saved to ${data.path}`)
        // selection kept as requested
      } else {
        setSnapStatus(`Error: ${data.error}`)
      }
    } catch (e) {
      setSnapStatus('Request failed')
      console.error(e)
    }
  }

  return (
    <div className="container" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      <div className="header-row">
        <h1>snap-adb</h1>
        <div className="tabs">
          <button
            className={`tab-btn ${tab === 'live' ? 'active' : ''}`}
            onClick={() => setTab('live')}
          >
            Live Stream
          </button>
          <button
            className={`tab-btn ${tab === 'gallery' ? 'active' : ''}`}
            onClick={() => setTab('gallery')}
          >
            Gallery
          </button>
        </div>
      </div>

      {tab === 'live' ? (
        <>
          <div className="controls">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Filename (e.g. icon)"
            />
            <button className="snap-btn" onClick={handleSnap}>SNAP</button>
            <button onClick={() => setSelection(null)}>Clear</button>
            <span className="status">{snapStatus}</span>
            <div className="spacer"></div>
            <span className="hint">Drag on the video to crop an area.</span>
          </div>

          <div className="stream-container">
            <img
              src="/stream"
              alt="ADB Stream"
              className="stream-video"
              ref={imgRef}
              draggable="false"
              onMouseDown={handleStartDraw}
            />

            {selection && selection.w > 0 && (
              <div
                className="selection-box"
                onMouseDown={handleStartMove}
                style={{
                  left: selection.x,
                  top: selection.y,
                  width: selection.w,
                  height: selection.h
                }}
              >
                <span className="selection-size">{Math.round(selection.w)} x {Math.round(selection.h)}</span>

                {/* Resize Handles */}
                <div className="resize-handle handle-nw" onMouseDown={(e) => handleStartResize(e, 'nw')}></div>
                <div className="resize-handle handle-ne" onMouseDown={(e) => handleStartResize(e, 'ne')}></div>
                <div className="resize-handle handle-sw" onMouseDown={(e) => handleStartResize(e, 'sw')}></div>
                <div className="resize-handle handle-se" onMouseDown={(e) => handleStartResize(e, 'se')}></div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="gallery-container">
          <div className="gallery-sidebar">
            <button className="delete-all-btn" onClick={handleDeleteAll}>
              Delete All Images
            </button>
            <ul className="file-list">
              {files.map(f => (
                <li
                  key={f}
                  className={`file-item ${selectedFile === f ? 'selected' : ''}`}
                  onClick={() => setSelectedFile(f)}
                >
                  <span className="file-name" title={f}>{f}</span>
                  <button
                    className="delete-btn"
                    title="Delete"
                    onClick={(e) => handleDelete(e, f)}
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="gallery-preview">
            {selectedFile ? (
              <img
                src={`/captures/${selectedFile}?t=${cacheBuster}`}
                alt={selectedFile}
                className="preview-image"
              />
            ) : (
              <div className="no-selection">Select an image to view</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
