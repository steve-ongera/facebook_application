import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import {
  getConversations, getMessages,
  sendMessage, getUser, searchUsers
} from '../services/api'
import Avatar from '../components/Avatar'

function timeLabel(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 86400 && d.getDate() === now.getDate())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff < 172800) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function sameDay(a, b) {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() &&
         da.getMonth() === db.getMonth() &&
         da.getDate() === db.getDate()
}

export default function MessagesPage() {
  const { userId } = useParams()
  const { user: me } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [activeUser, setActiveUser]       = useState(null)
  const [messages, setMessages]           = useState([])
  const [text, setText]                   = useState('')
  const [sending, setSending]             = useState(false)
  const [searchQ, setSearchQ]             = useState('')
  const [searchRes, setSearchRes]         = useState([])
  const [chatOpen, setChatOpen]           = useState(false)  // mobile toggle

  const bottomRef  = useRef(null)
  const textareaRef = useRef(null)

  /* Load conversations */
  useEffect(() => {
    getConversations().then(setConversations).catch(console.error)
  }, [])

  /* Load active user from URL param */
  useEffect(() => {
    if (!userId) return
    getUser(userId)
      .then(u => { setActiveUser(u); setChatOpen(true) })
      .catch(console.error)
  }, [userId])

  /* Load + poll messages */
  const loadMessages = useCallback(async (uid) => {
    try {
      const data = await getMessages(uid)
      setMessages(Array.isArray(data) ? data : data.results || [])
    } catch {}
  }, [])

  useEffect(() => {
    if (!activeUser) return
    loadMessages(activeUser.id)
    const interval = setInterval(() => loadMessages(activeUser.id), 3000)
    return () => clearInterval(interval)
  }, [activeUser, loadMessages])

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* User search */
  useEffect(() => {
    if (!searchQ.trim()) { setSearchRes([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await searchUsers(searchQ)
        setSearchRes(res)
      } catch {}
    }, 280)
    return () => clearTimeout(t)
  }, [searchQ])

  const selectUser = (u) => {
    setActiveUser(u)
    setSearchQ('')
    setSearchRes([])
    setChatOpen(true)
    navigate(`/messages/${u.id}`)
    setConversations(prev =>
      prev.find(c => c.id === u.id) ? prev : [u, ...prev]
    )
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || !activeUser || sending) return
    setSending(true)
    try {
      const msg = await sendMessage(activeUser.id, text)
      setMessages(prev => [...prev, msg])
      setText('')
      textareaRef.current?.focus()
    } catch {} finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  const activeFullName = activeUser
    ? (activeUser.first_name ? `${activeUser.first_name} ${activeUser.last_name || ''}` : activeUser.username)
    : ''

  return (
    <div className="messages-page">

      {/* ── Left sidebar ── */}
      <div className={`msg-sidebar ${chatOpen ? '' : 'mobile-show'}`}>
        <div className="msg-sidebar__head">
          <div className="msg-sidebar__title">Chats</div>
          {/* Search */}
          <div className="msg-search">
            <i className="bi bi-search" />
            <input
              placeholder="Search Messenger"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            {searchQ && (
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}
                onClick={() => { setSearchQ(''); setSearchRes([]) }}
              >
                <i className="bi bi-x" style={{ fontSize: 18 }} />
              </button>
            )}
          </div>

          {/* Search results */}
          {searchRes.length > 0 && (
            <div style={{ marginTop: 8, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
              {searchRes.map(u => (
                <div key={u.id} className="conv-item" onClick={() => selectUser(u)}>
                  <div className="conv-item__av">
                    <Avatar user={u} size={44} />
                  </div>
                  <div className="conv-item__info">
                    <div className="conv-item__name">
                      {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username}
                    </div>
                    <div className="conv-item__preview">@{u.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversation list */}
        <div className="msg-sidebar__list">
          {conversations.length === 0 ? (
            <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-2)' }}>
              <i className="bi bi-chat" style={{ fontSize: 32, color: 'var(--border)', display: 'block', marginBottom: 8 }} />
              No conversations yet.<br />
              <span style={{ fontSize: 13 }}>Search for someone to start chatting.</span>
            </div>
          ) : (
            conversations.map(u => (
              <div
                key={u.id}
                className={`conv-item ${activeUser?.id === u.id ? 'active' : ''}`}
                onClick={() => selectUser(u)}
              >
                <div className="conv-item__av">
                  <Avatar user={u} size={44} />
                </div>
                <div className="conv-item__info">
                  <div className="conv-item__name">
                    {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username}
                  </div>
                  <div className="conv-item__preview">@{u.username}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className={`chat-area ${chatOpen ? 'is-open' : ''}`}>
        {!activeUser ? (
          <div className="chat-empty">
            <div className="chat-empty__icon">
              <i className="bi bi-chat-heart" />
            </div>
            <h3>Your Messages</h3>
            <p>Send private messages to friends and connections.</p>
            <button
              className="btn btn--primary"
              style={{ marginTop: 8 }}
              onClick={() => textareaRef.current?.focus()}
            >
              <i className="bi bi-pencil-square" /> Start new chat
            </button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="chat-header">
              {/* Back button (mobile) */}
              <button
                className="chat-hbtn"
                style={{ display: 'none' }}
                id="chat-back-btn"
                onClick={() => { setChatOpen(false); navigate('/messages') }}
              >
                <i className="bi bi-arrow-left" />
              </button>

              <Avatar user={activeUser} size={40} />
              <div className="chat-header__info">
                <div
                  className="chat-header__name"
                  onClick={() => navigate(`/profile/${activeUser.id}`)}
                >
                  {activeFullName}
                </div>
                <div className="chat-header__status">
                  <i className="bi bi-circle-fill" style={{ fontSize: 8, marginRight: 4 }} />
                  Active now
                </div>
              </div>
              <div className="chat-header__btns">
                <button className="chat-hbtn" title="Voice call">
                  <i className="bi bi-telephone" />
                </button>
                <button className="chat-hbtn" title="Video call">
                  <i className="bi bi-camera-video" />
                </button>
                <button className="chat-hbtn" title="Info">
                  <i className="bi bi-info-circle" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-2)', marginTop: 40 }}>
                  <Avatar user={activeUser} size={64} />
                  <div style={{ marginTop: 12, fontWeight: 800, fontSize: 16 }}>{activeFullName}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    Say hi to start the conversation! 👋
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isOut = msg.sender.id === me?.id
                const showDate = idx === 0 || !sameDay(messages[idx - 1].created_at, msg.created_at)

                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="msg-date-sep">
                        <span>
                          {new Date(msg.created_at).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    <div className={`msg-bubble msg-bubble--${isOut ? 'out' : 'in'}`}>
                      {!isOut && <Avatar user={msg.sender} size={28} />}
                      <div className="msg-bubble__body">
                        <div className="msg-bubble__text">{msg.content}</div>
                        <div className="msg-bubble__time">{timeLabel(msg.created_at)}</div>
                      </div>
                    </div>
                  </React.Fragment>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="chat-input-bar">
              <div className="chat-input-bar__icons">
                <button className="chat-icon-btn" title="Add photo">
                  <i className="bi bi-image" />
                </button>
                <button className="chat-icon-btn" title="Emoji">
                  <i className="bi bi-emoji-smile" />
                </button>
              </div>

              <div className="chat-input-wrap">
                <textarea
                  ref={textareaRef}
                  placeholder="Aa"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  rows={1}
                />
              </div>

              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!text.trim() || sending}
                title="Send"
              >
                <i className="bi bi-send-fill" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile: inject back button style */}
      <style>{`
        @media (max-width: 768px) {
          #chat-back-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}