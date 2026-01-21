import { useState, useRef } from 'react'
import { useBoxSelection } from '../hooks/useBoxSelection'

const LiveTab = () => {
    const [filename, setFilename] = useState('')
    const [snapStatus, setSnapStatus] = useState('')
    const imgRef = useRef(null)

    const {
        selection,
        setSelection,
        handleStartDraw,
        handleStartMove,
        handleStartResize,
        handleMouseMove,
        handleMouseUp
    } = useBoxSelection(imgRef)

    const handleSnap = async () => {
        setSnapStatus('Snapping...')
        try {
            const body = { filename }

            if (selection && selection.w > 0 && selection.h > 0) {
                const naturalWidth = imgRef.current.naturalWidth
                const displayedWidth = imgRef.current.width
                const scale = naturalWidth / displayedWidth

                const OFFSET_Y = -2
                const OFFSET_W = 5
                const OFFSET_H = 10

                body.x = Math.round(selection.x * scale)
                body.y = Math.round(selection.y * scale) + OFFSET_Y
                body.w = Math.round(selection.w * scale) + OFFSET_W
                body.h = Math.round(selection.h * scale) + OFFSET_H

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
            } else {
                setSnapStatus(`Error: ${data.error}`)
            }
        } catch (e) {
            setSnapStatus('Request failed')
            console.error(e)
        }
    }

    const handleFormSnap = (e) => {
        e.preventDefault()
        handleSnap()
    }

    return (
        <div className="tab-content" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
            <form className="controls" onSubmit={handleFormSnap}>
                <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="Filename (e.g. icon)"
                />
                <button type="submit" className="snap-btn">SNAP</button>
                <button type="button" onClick={() => setSelection(null)}>Clear</button>
                <span className="status">{snapStatus}</span>
                <div className="spacer"></div>
                <span className="hint">Drag on the video to crop an area.</span>
            </form>

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

                        <div className="resize-handle handle-nw" onMouseDown={(e) => handleStartResize(e, 'nw')}></div>
                        <div className="resize-handle handle-ne" onMouseDown={(e) => handleStartResize(e, 'ne')}></div>
                        <div className="resize-handle handle-sw" onMouseDown={(e) => handleStartResize(e, 'sw')}></div>
                        <div className="resize-handle handle-se" onMouseDown={(e) => handleStartResize(e, 'se')}></div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default LiveTab
