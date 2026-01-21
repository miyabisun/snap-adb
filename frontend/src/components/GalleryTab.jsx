import { useState, useRef, useEffect } from 'react'
import { useBoxSelection } from '../hooks/useBoxSelection'

const GalleryTab = () => {
    const [files, setFiles] = useState([])
    const [selectedFile, setSelectedFile] = useState(null)
    const [cacheBuster, setCacheBuster] = useState(Date.now())
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

    useEffect(() => {
        fetchFiles()
    }, [])

    const fetchFiles = async () => {
        try {
            const res = await fetch('/api/files')
            const data = await res.json()
            setFiles(data.files || [])
            setCacheBuster(Date.now())
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

    const handleCrop = async () => {
        if (!selection || selection.w <= 0 || !selectedFile) return
        if (!confirm('Overwrite this image with the cropped selection?')) return

        try {
            const naturalWidth = imgRef.current.naturalWidth
            const displayedWidth = imgRef.current.width
            const scale = naturalWidth / displayedWidth

            const body = {
                filename: selectedFile,
                x: Math.round(selection.x * scale),
                y: Math.round(selection.y * scale),
                w: Math.round(selection.w * scale),
                h: Math.round(selection.h * scale)
            }

            const res = await fetch('/api/crop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            const data = await res.json()
            if (data.success) {
                setSelection(null)
                setCacheBuster(Date.now())
            } else {
                alert(`Crop failed: ${data.error}`)
            }
        } catch (e) {
            console.error(e)
            alert('Crop request failed')
        }
    }

    return (
        <div className="gallery-container" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
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
                    <div
                        className="image-wrapper"
                        style={{ position: 'relative', display: 'inline-block' }}
                    >
                        <img
                            src={`/captures/${selectedFile}?t=${cacheBuster}`}
                            alt={selectedFile}
                            className="preview-image"
                            ref={imgRef}
                            draggable="false"
                            onMouseDown={handleStartDraw}
                            style={{ display: 'block' }}
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

                                <button
                                    className="crop-btn"
                                    onMouseDown={(e) => {
                                        e.stopPropagation()
                                        handleCrop()
                                    }}
                                    style={{
                                        position: 'absolute',
                                        bottom: '-45px',
                                        right: '0', // Right aligned as requested
                                        zIndex: 20,
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        pointerEvents: 'auto'
                                    }}
                                >
                                    CROP
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="no-selection">Select an image to view</div>
                )}
            </div>
        </div>
    )
}

export default GalleryTab
