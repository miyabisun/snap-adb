import { useState, useEffect } from 'react'

export const useBoxSelection = (imgRef) => {
    const [selection, setSelection] = useState(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [startPos, setStartPos] = useState({ x: 0, y: 0 })

    // Moving & Resizing
    const [resizingHandle, setResizingHandle] = useState(null) // 'nw', 'ne', 'sw', 'se'
    const [isMoving, setIsMoving] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

    const getRelPos = (e) => {
        if (!imgRef.current) return { x: 0, y: 0 }
        const rect = imgRef.current.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }

    // 1. Start Adjustment (Resize) - Attached to handles
    const handleStartResize = (e, handle) => {
        e.preventDefault()
        e.stopPropagation()
        setResizingHandle(handle)
    }

    // 2. Start Move - Attached to selection box
    const handleStartMove = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const { x: mX, y: mY } = getRelPos(e)
        setIsMoving(true)
        setDragOffset({ x: mX - (selection?.x || 0), y: mY - (selection?.y || 0) })
    }

    // 3. Start New Draw - Attached to Image/Container (Background)
    const handleStartDraw = (e) => {
        e.preventDefault()
        const { x, y } = getRelPos(e)
        setStartPos({ x, y })
        setSelection({ x, y, w: 0, h: 0 })
        setIsDrawing(true)
        // Clear any previous interaction states just in case
        setResizingHandle(null)
        setIsMoving(false)
    }

    // Common Move Handler (attached to container)
    const handleMouseMove = (e) => {
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

    // Keyboard support for 1px adjustment and resizing
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selection) return

            let { x, y, w, h } = selection
            let changed = false

            if (e.shiftKey) {
                // RESIZE
                if (e.key === 'ArrowRight') { w += 1; changed = true }
                if (e.key === 'ArrowLeft') { w -= 1; changed = true }
                if (e.key === 'ArrowDown') { h += 1; changed = true }
                if (e.key === 'ArrowUp') { h -= 1; changed = true }
            } else {
                // MOVE
                if (e.key === 'ArrowRight') { x += 1; changed = true }
                if (e.key === 'ArrowLeft') { x -= 1; changed = true }
                if (e.key === 'ArrowDown') { y += 1; changed = true }
                if (e.key === 'ArrowUp') { y -= 1; changed = true }
            }

            if (changed) {
                e.preventDefault()
                setSelection({ x, y, w: Math.max(1, w), h: Math.max(1, h) })
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selection])

    return {
        selection,
        setSelection,
        isDrawing,
        isMoving,
        resizingHandle,
        handleStartDraw,
        handleStartMove,
        handleStartResize,
        handleMouseMove,
        handleMouseUp
    }
}
