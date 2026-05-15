import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { API_BASE_URL } from '../../config/api'
import './chatbot.css'

export default function Chatbot() {
  const user = useSelector((s) => s.auth.user)
  const token = useSelector((s) => s.auth.token)
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [context, setContext] = useState(null)

  useEffect(() => {
    // initial greeting for authenticated student or professor
    if (isAuthenticated && user) {
      // Only set initial messages when there are no messages yet
      if (messages.length === 0) {
        const emailOnly = (user && user.email) ? user.email : '';
        if (user.role === 'student') {
          const studentHelp = `Hi ${emailOnly}!\n\nI am your LMS Student Assistant.\nI can help you with:\n\n• Your enrolled courses\n• Pending and submitted assignments\n• Grades and GPA information\n• Attendance percentage\n• How to update your profile\n• How to change your password\n• How to navigate the student dashboard\n• How to contact professors\n• How to submit assignments\n\nJust ask me anything related to your studies or LMS!`;
          setMessages([{ from: 'bot', text: studentHelp }])
        } else if (user.role === 'professor') {
          const profHelp = `Hi ${emailOnly}!\n\nI am your LMS Professor Assistant.\nI can help you with:\n\n• Managing courses you teach\n• Creating, editing, and publishing assignments\n• Viewing student submissions\n• Adding or updating grades\n• Managing attendance\n• Viewing student performance\n• Posting course announcements\n• Navigating the professor dashboard\n• Managing profile\n\nAsk me anything related to your teaching tasks or LMS!`;
          setMessages([{ from: 'bot', text: profHelp }])
        }
      }
    }
    // clear messages on logout
    if (!isAuthenticated) {
      setMessages([])
      setOpen(false)
    }
  }, [user, isAuthenticated])

  async function loadContext() {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/chatbot/context`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return
      const data = await res.json()
      // backend returns { context }
      setContext(data.context || data.studentContext || null)
    } catch (err) {
      // ignore
    }
  }

  useEffect(() => {
    if (open && !context) loadContext()
  }, [open])

  async function sendMessage() {
    const text = input.trim()
    if (!text) return
    setMessages(m => [...m, { from: 'user', text }])
    setInput('')

    // optimistic local rule fallback
    try {
      const res = await fetch(`${API_BASE_URL}/api/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text })
      })
      if (!res.ok) throw new Error('no')
      const data = await res.json()
      setMessages(m => [...m, { from: 'bot', text: data.reply }])
    } catch (err) {
      // fallback short reply
      const fallback = 'I can only help with LMS and academic-related questions.'
      setMessages(m => [...m, { from: 'bot', text: fallback }])
    }
  }

  // show for authenticated students and professors
  if (!isAuthenticated || !user || (user.role !== 'student' && user.role !== 'professor')) return null

  return (
    <div className={`lms-chatbot ${open ? 'open' : ''}`}>
      {!open && (
        <button className="chat-toggle" onClick={() => setOpen(o => !o)} aria-label="Open chatbot">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#fff"/>
          </svg>
        </button>
      )}

      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <span>{user && user.role === 'professor' ? 'LMS Professor Assistant' : 'LMS Student Assistant'}</span>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
          </div>
          <div className="chat-body">
            {/* show professor-specific summary if available
            {user.role === 'professor' && context && context.pendingReviews && context.pendingReviews.length > 0 && (
              <div style={{ marginBottom: 8, padding: 8, background: '#fff6e6', borderRadius: 6, border: '1px solid #f0d9c4' }}>
                <strong>Pending reviews:</strong>
                <div style={{ fontSize: 12, marginTop: 6 }}>
                  {context.pendingReviews.slice(0,3).map((p, i) => (
                    <div key={i}>• {p.title} — {p.course || ''} {p.dueDate ? `(${p.dueDate})` : ''}</div>
                  ))}
                </div>
              </div>
            )} */}
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.from}`}>
                {m.text.split('\n').map((ln, idx) => <div key={idx}>{ln}</div>)}
              </div>
            ))}
          </div>
          <div className="chat-footer">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Ask about assignments, grades, profile..." />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  )
}
