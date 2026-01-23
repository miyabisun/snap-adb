import { useState } from 'react'
import './App.css'
import AutomationTab from './components/AutomationTab'
import LiveTab from './components/LiveTab'
import GalleryTab from './components/GalleryTab'

function App() {
  const [tab, setTab] = useState('live') // 'live' | 'gallery' | 'match'

  return (
    <div className="container">
      <div className="header-row">
        <h1>adb-pilot</h1>
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
          <button
            type="button"
            className={`tab-btn ${tab === 'automation' ? 'active' : ''}`}
            onClick={() => setTab('automation')}
          >
            Automation
          </button>
        </div>
      </div>

      {tab === 'live' && <LiveTab />}
      {tab === 'gallery' && <GalleryTab />}
      {tab === 'automation' && <AutomationTab />}
    </div>
  )
}

export default App
