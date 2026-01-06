import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Sanitize localStorage: clear any keys with corrupted JSON before app mounts
// This prevents white-screen crashes from bad data left by previous runs
const keysToCheck = [
  'learning_trail',
  'explore_progress',
  'lab_feedback',
  'quiz_scores',
  'session_start',
  'pos_addr',
  'custom_rpc',
  'student_mode',
  'eth_lab_wallet_pk'
];

keysToCheck.forEach(key => {
  const val = localStorage.getItem(key);
  if (val !== null) {
    try {
      // Only try to parse if it looks like JSON (starts with { or [)
      if (val.startsWith('{') || val.startsWith('[')) {
        JSON.parse(val);
      }
    } catch (e) {
      console.warn(`[main] Removing corrupt localStorage key "${key}":`, e.message);
      localStorage.removeItem(key);
    }
  }
});

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

