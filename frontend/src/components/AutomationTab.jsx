import { useState, useEffect } from 'react'
import FileList from './FileList'
import JsonViewer from './JsonViewer'

const AutomationTab = () => {
    const [files, setFiles] = useState([])
    const [selectedFiles, setSelectedFiles] = useState([])
    const [config, setConfig] = useState({
        threshold: 0.85,
        timeout: 5000,
        mode: 'match',
        swipeStart: { x: 0, y: 0 },
        swipeEnd: { x: 0, y: 0 },
        swipeDuration: 500
    })
    const [logs, setLogs] = useState([])
    const [isMatching, setIsMatching] = useState(false)
    const [hoverImage, setHoverImage] = useState(null)
    const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })

    useEffect(() => {
        fetchFiles()
    }, [])

    // Clear tooltip when logs update (e.g. response received)
    useEffect(() => {
        setHoverImage(null)
    }, [logs])

    const fetchFiles = async () => {
        try {
            const res = await fetch('/api/files')
            const data = await res.json()
            setFiles(data.files || [])
        } catch (e) {
            console.error('Failed to fetch files', e)
        }
    }

    const addLog = (entry) => {
        setLogs(prev => [entry, ...prev])
    }

    const fileToBase64 = async (filename) => {
        const res = await fetch(`/captures/${filename}`)
        const blob = await res.blob()
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(blob)
        })
    }

    const handleSelect = (file, e) => {
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
            setSelectedFiles(prev => {
                if (prev.includes(file)) {
                    return prev.filter(f => f !== file)
                } else {
                    return [...prev, file]
                }
            })
        } else {
            setSelectedFiles([file])
        }
    }

    const handleMatch = async (type) => {
        if (selectedFiles.length === 0) {
            alert('Please select at least one template image')
            return
        }

        setIsMatching(true)
        const endpoint = `/api/match/${type}`

        try {
            const targets = await Promise.all(selectedFiles.map(async (f) => ({
                name: f,
                image: await fileToBase64(f)
            })))

            const payload = {
                targets,
                threshold: Number(config.threshold),
                // Only include timeout for wait/race (polling actions)
                ...(type === 'wait' || type === 'race' ? { timeout: Number(config.timeout) } : {})
            }

            const startTime = Date.now()

            // Store payload for logging (using a custom type to trigger renderer)
            addLog({ type: 'req', method: 'POST', url: endpoint, payload })

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const json = await res.json()
            const duration = Date.now() - startTime

            addLog({ type: 'res', status: res.status, duration, body: json })

        } catch (e) {
            addLog({ type: 'err', message: e.message })
        } finally {
            setIsMatching(false)
        }
    }

    const handleAction = async (actionType) => {
        setIsMatching(true)
        try {
            if (actionType === 'tap') {
                if (selectedFiles.length === 0) {
                    alert('Select a target to tap')
                    return
                }
                // Tap supports single target for now (or first one)
                const target = selectedFiles[0]
                const base64 = await fileToBase64(target)

                const endpoint = '/api/action/tap'
                const payload = {
                    target: { name: target, image: base64 },
                    threshold: Number(config.threshold)
                    // No timeout - tap is one-shot
                }

                addLog({ type: 'req', method: 'POST', url: endpoint, payload })
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                const json = await res.json()
                addLog({ type: 'res', status: res.status, body: json })

            } else if (actionType === 'swipe') {
                const endpoint = '/api/action/swipe'
                const payload = {
                    x1: config.swipeStart.x,
                    y1: config.swipeStart.y,
                    x2: config.swipeEnd.x,
                    y2: config.swipeEnd.y,
                    duration: config.swipeDuration
                }
                addLog({ type: 'req', method: 'POST', url: endpoint, payload })
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                const json = await res.json()
                addLog({ type: 'res', status: res.status, body: json })

            } else if (actionType === 'seek') {
                if (selectedFiles.length === 0) {
                    alert('Select a target to seek')
                    return
                }
                const target = selectedFiles[0]
                const base64 = await fileToBase64(target)

                const endpoint = '/api/action/seek'
                const payload = {
                    target: { name: target, image: base64 },
                    threshold: Number(config.threshold),
                    timeout: Number(config.timeout)
                }

                addLog({ type: 'req', method: 'POST', url: endpoint, payload })
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                const json = await res.json()
                addLog({ type: 'res', status: res.status, body: json })
            }
        } catch (e) {
            addLog({ type: 'err', message: e.message })
        } finally {
            setIsMatching(false)
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
            if (selectedFiles.includes(fname)) {
                setSelectedFiles(prev => prev.filter(f => f !== fname))
            }
        } catch (e) { alert('Delete failed') }
    }

    const handleDeleteAll = async () => {
        if (!confirm('Delete ALL?')) return
        try {
            await fetch('/api/files', { method: 'DELETE' })
            setFiles([])
            setSelectedFiles([])
        } catch (e) { }
    }

    return (
        <div className="gallery-container">
            <FileList
                files={files}
                selectedFile={selectedFiles}
                onSelect={handleSelect}
                onDelete={handleDelete}
                onDeleteAll={handleDeleteAll}
            />

            <div className="match-panel">
                <div className="match-controls">
                    <div className="control-group">
                        <label>Mode:</label>
                        <select
                            value={config.mode}
                            onChange={async (e) => {
                                const newMode = e.target.value
                                const newConfig = { ...config, mode: newMode }
                                if (newMode === 'swipe') {
                                    try {
                                        const res = await fetch('/api/device/size')
                                        const size = await res.json()
                                        if (size.width && size.height) {
                                            newConfig.swipeStart = {
                                                x: Math.floor(size.width / 2),
                                                y: Math.floor(size.height / 2)
                                            }
                                            newConfig.swipeEnd = {
                                                x: Math.floor(size.width / 2),
                                                y: Math.floor(size.height / 2 - size.height / 4)
                                            }
                                        }
                                    } catch (err) {
                                        console.error('Failed to get device size', err)
                                    }
                                }
                                setConfig(newConfig)
                            }}
                            style={{ padding: '4px' }}
                        >
                            <option value="match">Match</option>
                            <option value="swipe">Swipe</option>
                        </select>
                    </div>

                    {/* Match Mode UI */}
                    {config.mode === 'match' && (
                        <>
                            <div className="control-group">
                                <label>Threshold:</label>
                                <input
                                    type="number"
                                    step="0.05"
                                    min="0" max="1"
                                    value={config.threshold}
                                    onChange={e => setConfig({ ...config, threshold: e.target.value })}
                                />
                            </div>
                            <div className="control-group">
                                <label>Timeout (ms):</label>
                                <input
                                    type="number"
                                    step="5000"
                                    value={config.timeout}
                                    onChange={e => setConfig({ ...config, timeout: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {/* Swipe Mode UI - Explicit 5 Inputs */}
                    {config.mode === 'swipe' && (
                        <>
                            <div className="control-group">
                                <label>Start X:</label>
                                <input
                                    type="number"
                                    style={{ width: '60px' }}
                                    value={config.swipeStart.x}
                                    onChange={e => setConfig({ ...config, swipeStart: { ...config.swipeStart, x: e.target.value } })}
                                />
                            </div>
                            <div className="control-group">
                                <label>Start Y:</label>
                                <input
                                    type="number"
                                    style={{ width: '60px' }}
                                    value={config.swipeStart.y}
                                    onChange={e => setConfig({ ...config, swipeStart: { ...config.swipeStart, y: e.target.value } })}
                                />
                            </div>
                            <div className="control-group">
                                <label>End X:</label>
                                <input
                                    type="number"
                                    style={{ width: '60px' }}
                                    value={config.swipeEnd.x}
                                    onChange={e => setConfig({ ...config, swipeEnd: { ...config.swipeEnd, x: e.target.value } })}
                                />
                            </div>
                            <div className="control-group">
                                <label>End Y:</label>
                                <input
                                    type="number"
                                    style={{ width: '60px' }}
                                    value={config.swipeEnd.y}
                                    onChange={e => setConfig({ ...config, swipeEnd: { ...config.swipeEnd, y: e.target.value } })}
                                />
                            </div>
                            <div className="control-group">
                                <label>Duration (ms):</label>
                                <input
                                    type="number"
                                    step="100"
                                    defaultValue={500}
                                    value={config.swipeDuration}
                                    onChange={e => setConfig({ ...config, swipeDuration: e.target.value })}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="action-buttons">
                    {config.mode === 'match' && (
                        <>
                            <button onClick={() => handleMatch('scan')} disabled={isMatching}>Scan</button>
                            <button onClick={() => handleMatch('wait')} disabled={isMatching}>Wait</button>
                            <button onClick={() => handleMatch('race')} disabled={isMatching}>Race</button>
                            <button onClick={() => handleMatch('best')} disabled={isMatching}>Best</button>
                            <button onClick={() => handleAction('tap')} disabled={isMatching} className="action-btn-primary">Tap</button>
                            <button onClick={() => handleAction('seek')} disabled={isMatching} className="action-btn-primary">Seek</button>
                        </>
                    )}
                    {config.mode === 'swipe' && (
                        <button onClick={() => handleAction('swipe')} disabled={isMatching} className="action-btn-primary">
                            SWIPE
                        </button>
                    )}
                </div>

                <div className="log-area">
                    <h3>Logs</h3>
                    <div className="log-content">
                        {logs.map((log, i) => (
                            <div key={i} className="log-entry">
                                {log.type === 'req' && (
                                    <>
                                        <div className="log-header req">
                                            &gt;&gt; {log.method} {log.url}
                                        </div>
                                        <div className="log-body">
                                            <JsonViewer
                                                data={log.payload}
                                                onHoverImage={setHoverImage}
                                            />
                                        </div>
                                    </>
                                )}
                                {log.type === 'res' && (
                                    <>
                                        <div className="log-header res">
                                            &lt;&lt; {log.status} ({log.duration}ms)
                                        </div>
                                        <div className="log-body">
                                            <JsonViewer
                                                data={log.body}
                                                onHoverImage={setHoverImage}
                                            />
                                        </div>
                                    </>
                                )}
                                {log.type === 'err' && (
                                    <div className="log-header err">!! {log.message}</div>
                                )}
                                {/* Backward compatibility for string logs */}
                                {typeof log === 'string' && log}
                            </div>
                        ))}
                    </div>
                    {/* Hover Tooltip - Moved inside match-panel to prevent flex layout issues */}
                    {hoverImage && (
                        <div className="image-tooltip">
                            <img src={hoverImage} alt="Base64 Preview" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AutomationTab
