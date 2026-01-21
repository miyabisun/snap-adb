import { useState } from 'react'
import './App.css'
import LiveTab from './components/LiveTab'
import GalleryTab from './components/GalleryTab'

function App() {
  const [tab, setTab] = useState('live') // 'live' | 'gallery'

  return (
    <div className="container">
      <div className="header-row">
        <h1>snap-adb</h1>
        <div className="tabs">
          <button
            type="button"
            className={`tab-btn ${tab === 'live' ? 'active' : ''}`}
            onClick={() => setTab('live')}
          >
            Live Stream
          </button>
          <button
            type="button"
            className={`tab-btn ${tab === 'gallery' ? 'active' : ''}`}
            onClick={() => setTab('gallery')}
          >
            Gallery
          </button>
        </div>
      </div>

      {tab === 'live' ? <LiveTab /> : <GalleryTab />}
    </div>
  )
}

export default App
