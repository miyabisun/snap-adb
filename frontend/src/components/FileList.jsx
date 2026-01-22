import React from 'react'

const FileList = ({ files, selectedFile, onSelect, onDelete, onDeleteAll }) => {
    return (
        <div className="gallery-sidebar">
            <button className="delete-all-btn" onClick={onDeleteAll}>
                Delete All Images
            </button>
            <ul className="file-list">
                {files.map(f => {
                    const isSelected = Array.isArray(selectedFile)
                        ? selectedFile.includes(f)
                        : selectedFile === f

                    return (
                        <li
                            key={f}
                            className={`file-item ${isSelected ? 'selected' : ''}`}
                            onClick={(e) => onSelect(f, e)}
                        >
                            <span className="file-name" title={f}>{f}</span>
                            <button
                                className="delete-btn"
                                title="Delete"
                                onClick={(e) => onDelete(e, f)}
                            >
                                🗑️
                            </button>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

export default FileList
