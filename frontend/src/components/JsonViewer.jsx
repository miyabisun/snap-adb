import React from 'react'

const JsonViewer = ({ data, level = 0, onHoverImage }) => {
    const indentStyle = { paddingLeft: `${level * 15}px` }

    if (data === null) return <span className="json-null">null</span>
    if (data === undefined) return <span className="json-undefined">undefined</span>

    if (typeof data === 'string') {
        if (data.startsWith('data:image/')) {
            const fullBase64 = data
            // Truncate: first 30 + ... + last 10
            const truncated = fullBase64.length > 50
                ? fullBase64.substring(0, 30) + '...' + fullBase64.substring(fullBase64.length - 10)
                : fullBase64

            return (
                <span
                    className="base64-token"
                    onMouseEnter={() => onHoverImage(fullBase64)}
                    onMouseLeave={() => onHoverImage(null)}
                    title="Hover to preview"
                >
                    "{truncated}"
                </span>
            )
        }
        return <span className="json-string">"{data}"</span>
    }

    if (typeof data === 'number') return <span className="json-number">{data}</span>
    if (typeof data === 'boolean') return <span className="json-boolean">{String(data)}</span>

    if (Array.isArray(data)) {
        if (data.length === 0) return <span>[]</span>
        return (
            <span className="json-array">
                [
                {data.map((item, i) => (
                    <div key={i} style={{ paddingLeft: '15px' }}>
                        <JsonViewer data={item} level={0} onHoverImage={onHoverImage} />
                        {i < data.length - 1 && ','}
                    </div>
                ))}
                ]
            </span>
        )
    }

    // Object
    const keys = Object.keys(data)
    if (keys.length === 0) return <span>{"{}"}</span>

    return (
        <span className="json-object">
            {"{"}
            {keys.map((key, i) => (
                <div key={key} style={{ paddingLeft: '15px' }}>
                    <span className="json-key">"{key}": </span>
                    <JsonViewer data={data[key]} level={0} onHoverImage={onHoverImage} />
                    {i < keys.length - 1 && ','}
                </div>
            ))}
            {"}"}
        </span>
    )
}

export default JsonViewer
