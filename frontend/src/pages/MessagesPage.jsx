import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { getConversations, getMessages, sendMessage, getUser, searchUsers } from '../services/api'
import Avatar from '../components/Avatar'

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
  const messagesEndRef = useRef(null)

  // Load conversations
  useEffect(() => {
    getConversations().then(setConversations).catch(console.error)
  }, [])

  // Load active chat from URL param
  useEffect(() => {
    if (userId) {
      getUser(userId).then(u => {
        setActiveUser(u)
        loadMessages(u.id)
      }).catch(console.error)
    }
  }, [userId])

  const loadMessages = async (uid) => {
    try {
      const data = await getMessages(uid)
      setMessages(Array.isArray(data) ? data : data.results || [])
    } catch {}
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll for new messages every 3s
  useEffect(() => {
    if (!activeUser) return
    const interval = setInterval(() => loadMessages(activeUser.id), 3000)
    return () => clearInterval(interval)
  }, [activeUser])

  // Search users to start new conv
  useEffect(() => {
    if (!searchQ.trim()) { setSearchRes([]); return }
    const t = setTimeout(async () => {
      const res = await searchUsers(searchQ)
      setSearchRes(res)
    }, 300)
    return () => clearTimeout(t)
  }, [searchQ])

  const selectUser = (u) => {
    setActiveUser(u)
    setSearchQ('')
    setSearchRes([])
    loadMessages(u.id)
    navigate(`/messages/${u.id}`)
    // Add to conversations if not present
    setConversations(prev => prev.find(c => c.id === u.id) ? prev : [u, ...prev])
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || !activeUser || sending) return
    setSending(true)
    try {
      const msg = await sendMessage(activeUser.id, text)
      setMessages(prev => [...prev, msg])
      setText('')
    } catch {} finally {
      setSending(false)
    }
  }

  return (
    <div className="container--wide" style={{ paddingTop: 20 }}>
      <div className="messages-layout">
        {/* Sidebar */}
        <div className="conversations-list">
          <h3>Chats</h3>
          {/* Search */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-border)' }}>
            <input
              style={{ width: '100%', border: 'none', background: 'var(--gray-bg)', borderRadius: 20, padding: '7px 14px', outline: 'none', fontSize: 14 }}
              placeholder="Search…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            {searchRes.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,.12)', marginTop: 4 }}>
                {searchRes.map(u => (
                  <div key={u.id} className="conv-item" onClick={() => selectUser(u)}>
                    <div className="conv-item__avatar"><Avatar user={u} /></div>
                    <span className="conv-item__name">{u.username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {conversations.map(u => (
            <div
              key={u.id}
              className={`conv-item ${activeUser?.id === u.id ? 'active' : ''}`}
              onClick={() => selectUser(u)}
            >
              <div className="conv-item__avatar"><Avatar user={u} /></div>
              <span className="conv-item__name">{u.first_name || u.username}</span>
            </div>
          ))}
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {!activeUser ? (
            <div className="chat-empty">
              <span style={{ fontSize: 48 }}>💬</span>
              <p>Select a conversation or search for someone to message</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-header__avatar"><Avatar user={activeUser} /></div>
                <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${activeUser.id}`)}>
                  {activeUser.first_name || activeUser.username}
                </span>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--gray-text)', marginTop: 40 }}>
                    No messages yet. Say hi! 👋
                  </div>
                )}
                {messages.map(msg => {
                  const isOut = msg.sender.id === me?.id
                  return (
                    <div key={msg.id} className={`msg-bubble msg-bubble--${isOut ? 'out' : 'in'}`}>
                      {!isOut && (
                        <div className="msg-bubble__avatar"><Avatar user={msg.sender} /></div>
                      )}
                      <div className="msg-bubble__text">{msg.content}</div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form className="chat-input" onSubmit={handleSend}>
                <input
                  placeholder="Aa"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" disabled={!text.trim() || sending}>➤</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}