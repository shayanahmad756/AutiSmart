import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import chatAPI from '../api/chat.api';
import socketService from '../services/socket.service';

const API_BASE =
  (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

const AI_CONTACT = {
  _id: 'ai',
  name: 'AutiSmart AI',
  role: 'ai',
  isAI: true,
};

const Communication = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [search, setSearch] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalSearch, setAddModalSearch] = useState('');
  const [floatingNotif, setFloatingNotif] = useState(null);
  const floatingTimerRef = useRef(null);
  const contactsRef = useRef([]);
  const [aiMessages, setAiMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('autismart_ai_chat') || '[]'); }
    catch { return []; }
  });

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeContactRef = useRef(null);

  useEffect(() => { activeContactRef.current = activeContact; }, [activeContact]);
  useEffect(() => { contactsRef.current = contacts; }, [contacts]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const socket = socketService.connect(token);
      socket.on('receive_message', (msg) => {
        const current = activeContactRef.current;
        const senderStr = msg.senderId?.toString?.() || msg.senderId;
        if (current && !current.isAI && current._id?.toString() === senderStr) {
          setMessages((prev) => [...prev, msg]);
        } else {
          setUnreadCounts((prev) => ({ ...prev, [senderStr]: (prev[senderStr] || 0) + 1 }));
          const senderContact = contactsRef.current.find((c) => c._id?.toString() === senderStr);
          if (senderContact) {
            if (floatingTimerRef.current) clearTimeout(floatingTimerRef.current);
            setFloatingNotif({ contact: senderContact, message: msg });
            floatingTimerRef.current = setTimeout(() => setFloatingNotif(null), 4000);
          }
        }
      });
      socket.on('message_sent', (msg) => {
        setMessages((prev) => {
          if (prev.some((m) => m._id?.toString() === msg._id?.toString())) return prev;
          return [...prev, msg];
        });
      });
      socket.on('user_typing', ({ senderId }) => {
        if (activeContactRef.current?._id?.toString() === senderId) setIsTyping(true);
      });
      socket.on('user_stop_typing', ({ senderId }) => {
        if (activeContactRef.current?._id?.toString() === senderId) setIsTyping(false);
      });
    }
    fetchContacts();
    return () => { socketService.disconnect(); if (floatingTimerRef.current) clearTimeout(floatingTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeContact) return;
    if (activeContact.isAI) { setMessages([...aiMessages]); }
    else { loadMessages(activeContact._id); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContact?._id]);

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const res = await chatAPI.getContacts();
      const data = res.data || [];
      setContacts(data);
      const counts = {};
      data.forEach((c) => { if (c.unreadCount) counts[c._id] = c.unreadCount; });
      setUnreadCounts(counts);
    } catch (err) { console.error('[Chat] contacts:', err); }
    finally { setLoadingContacts(false); }
  };

  const loadMessages = async (contactId) => {
    try {
      setLoadingMessages(true);
      setMessages([]);
      const res = await chatAPI.getMessages(contactId);
      setMessages(res.data || []);
      await chatAPI.markRead(contactId);
      setUnreadCounts((prev) => ({ ...prev, [contactId]: 0 }));
    } catch (err) { console.error('[Chat] messages:', err); }
    finally { setLoadingMessages(false); }
  };

  const handleSelectContact = (contact) => {
    setActiveContact(contact);
    setIsTyping(false);
    setInputText('');
    setAttachedFile(null);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !attachedFile) return;
    if (!activeContact) return;
    setSendingMessage(true);
    try {
      if (activeContact.isAI) {
        const userMsg = { _id: `lu-${Date.now()}`, senderId: user?._id || user?.id || 'user', content: inputText, type: 'text', createdAt: new Date().toISOString(), isOwnLocal: true };
        const withUser = [...aiMessages, userMsg];
        setAiMessages(withUser); setMessages(withUser);
        const currentInput = inputText; setInputText('');
        const historyForAI = withUser.slice(-11, -1).map((m) => ({ role: m.isOwnLocal ? 'user' : 'assistant', content: m.content }));
        const res = await chatAPI.sendAIMessage(currentInput, historyForAI);
        const aiMsg = { _id: `lai-${Date.now()}`, senderId: 'ai', content: res.data.reply, type: 'text', createdAt: new Date().toISOString(), isOwnLocal: false };
        const withAI = [...withUser, aiMsg];
        setAiMessages(withAI); setMessages(withAI);
        localStorage.setItem('autismart_ai_chat', JSON.stringify(withAI.slice(-100)));
      } else {
        let content = inputText, type = 'text', fileUrl, fileName;
        if (attachedFile) {
          const fd = new FormData(); fd.append('file', attachedFile);
          const up = await chatAPI.uploadFile(fd);
          fileUrl = up.data.fileUrl; fileName = up.data.fileName; type = up.data.type;
          content = inputText || fileName;
        }
        const socket = socketService.getSocket();
        if (socket?.connected) {
          socket.emit('send_message', { receiverId: activeContact._id, content, type, fileUrl, fileName });
        } else {
          const res = await chatAPI.sendMessage(activeContact._id, { content, type, fileUrl, fileName });
          setMessages((prev) => [...prev, res.data]);
        }
        setInputText(''); setAttachedFile(null);
        socketService.emit('stop_typing', { receiverId: activeContact._id });
      }
    } catch (err) { console.error('[Chat] send:', err); }
    finally { setSendingMessage(false); }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!activeContact?.isAI && activeContact) {
      socketService.emit('typing', { receiverId: activeContact._id });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => socketService.emit('stop_typing', { receiverId: activeContact._id }), 2000);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };
  const handleFileSelect = (e) => { const f = e.target.files[0]; if (f) setAttachedFile(f); e.target.value = ''; };

  const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (ts) => {
    const d = new Date(ts), today = new Date(), yest = new Date(today);
    yest.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOwn = (msg) => {
    if (msg.isOwnLocal !== undefined) return msg.isOwnLocal;
    const uid = (user?._id || user?.id)?.toString();
    return (msg.senderId?.toString?.() || msg.senderId) === uid;
  };

  const initials = (n) => (n || '?').split(' ').map((x) => x[0]).join('').toUpperCase().slice(0, 2);
  const RCOL = { ai: '#61C3B4', expert: '#ADA9D3', caregiver: '#5EBEB1', admin: '#f4a261' };
  const rcol = (r) => RCOL[r] || '#6c757d';

  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const allContacts = [AI_CONTACT, ...filtered];

  const grouped = [];
  let lastDate = null;
  messages.forEach((m) => {
    const d = fmtDate(m.createdAt);
    if (d !== lastDate) { grouped.push({ _id: `div-${d}-${Math.random()}`, isDivider: true, date: d }); lastDate = d; }
    grouped.push(m);
  });

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: '#f0f2f5', overflow: 'hidden' }}>

      {/* LEFT PANEL */}
      <div style={{ width: 340, minWidth: 270, background: '#fff', borderRight: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '15px 20px', background: 'linear-gradient(135deg,#61C3B4,#5EBEB0)', color: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="fw-bold" style={{ fontSize: '1.05rem' }}><i className="bi bi-chat-dots-fill me-2"></i>Messages</div>
          <button onClick={() => { setShowAddModal(true); setAddModalSearch(''); }} style={{ background: 'rgba(255,255,255,.25)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem' }} title="New conversation">
            <i className="bi bi-pencil-square"></i>
          </button>
        </div>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
          <div className="input-group input-group-sm">
            <span className="input-group-text border-0" style={{ background: '#f5f5f5' }}><i className="bi bi-search text-muted"></i></span>
            <input type="text" className="form-control border-0" placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ background: '#f5f5f5', boxShadow: 'none' }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {allContacts.map((c) => {
            const active = activeContact?._id === c._id;
            const unread = unreadCounts[c._id] || 0;
            const lm = c.lastMessage;
            return (
              <div key={c._id} onClick={() => handleSelectContact(c)} style={{ padding: '12px 16px', cursor: 'pointer', background: active ? '#e8f5f3' : 'transparent', borderLeft: `3px solid ${active ? '#61C3B4' : 'transparent'}`, borderBottom: '1px solid #f5f5f5', transition: 'background .15s' }}>
                <div className="d-flex align-items-center gap-2">
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: rcol(c.role), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: c.isAI ? '1.3rem' : '1rem', fontWeight: 700 }}>
                      {c.isAI ? <i className="bi bi-robot"></i> : initials(c.name)}
                    </div>
                    {c.isAI && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, background: '#25d366', borderRadius: '50%', border: '2px solid #fff' }} />}
                  </div>
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold" style={{ fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 155 }}>
                        {c.name}{c.isAI && <span className="badge ms-1" style={{ fontSize: '0.6rem', background: '#61C3B4', verticalAlign: 'middle' }}>AI</span>}
                      </span>
                      {lm && <span style={{ fontSize: '0.72rem', color: '#aaa', flexShrink: 0 }}>{fmtTime(lm.createdAt)}</span>}
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <span style={{ fontSize: '0.8rem', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 175 }}>
                        {c.isAI ? 'Your autism therapy AI assistant' : lm ? (lm.content || (lm.type === 'image' ? 'Image' : 'File')) : `${c.role} - Start a conversation`}
                      </span>
                      {unread > 0 && <span className="badge rounded-pill" style={{ background: '#61C3B4', fontSize: '0.7rem', flexShrink: 0 }}>{unread}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {loadingContacts && <div className="text-center py-4 text-muted"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>}
          {!loadingContacts && contacts.length === 0 && <div className="text-center py-5 text-muted px-3"><i className="bi bi-people fs-2 d-block mb-2"></i><small>No contacts found</small></div>}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeContact ? (
          <>
            {/* Header */}
            <div style={{ padding: '12px 20px', background: '#fff', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,.05)', flexShrink: 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: rcol(activeContact.role), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: activeContact.isAI ? '1.2rem' : '0.95rem', flexShrink: 0 }}>
                {activeContact.isAI ? <i className="bi bi-robot"></i> : initials(activeContact.name)}
              </div>
              <div>
                <div className="fw-semibold" style={{ fontSize: '0.98rem' }}>{activeContact.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#888' }}>
                  {activeContact.isAI ? (<><span style={{ color: '#25d366' }}>●</span> Always online · Autism therapy specialist</>) : (
                    <span className="badge" style={{ background: '#e8f5f3', color: '#61C3B4', fontSize: '0.73rem' }}>{activeContact.role}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', background: '#f0f2f5', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {loadingMessages ? (
                <div className="text-center py-5 text-muted"><div className="spinner-border spinner-border-sm me-2"></div>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-chat-square-dots fs-1 d-block mb-3 opacity-25"></i>
                  {activeContact.isAI ? <p>Ask AutiSmart AI anything about autism therapy and child development!</p> : <p>No messages yet. Start the conversation!</p>}
                </div>
              ) : (
                grouped.map((item) => {
                  if (item.isDivider) return (
                    <div key={item._id} className="text-center my-3" style={{ flexShrink: 0 }}>
                      <span style={{ background: 'rgba(255,255,255,.85)', padding: '3px 14px', borderRadius: 12, fontSize: '0.75rem', color: '#888' }}>{item.date}</span>
                    </div>
                  );
                  const own = isOwn(item);
                  return (
                    <div key={item._id} style={{ display: 'flex', justifyContent: own ? 'flex-end' : 'flex-start', marginBottom: 3 }}>
                      <div style={{ maxWidth: '65%', background: own ? '#61C3B4' : '#fff', color: own ? '#fff' : '#333', padding: '9px 13px', borderRadius: own ? '16px 4px 16px 16px' : '4px 16px 16px 16px', boxShadow: '0 1px 2px rgba(0,0,0,.08)', wordBreak: 'break-word' }}>
                        {item.type === 'image' && item.fileUrl ? (
                          <div>
                            <img src={`${API_BASE}${item.fileUrl}`} alt="Shared" style={{ maxWidth: 250, maxHeight: 220, borderRadius: 8, display: 'block' }} />
                            {item.content && item.content !== item.fileName && <p style={{ margin: '6px 0 0', fontSize: '0.88rem' }}>{item.content}</p>}
                          </div>
                        ) : item.type === 'file' && item.fileUrl ? (
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-file-earmark-fill fs-4 flex-shrink-0"></i>
                            <a href={`${API_BASE}${item.fileUrl}`} target="_blank" rel="noopener noreferrer" style={{ color: own ? '#fff' : '#61C3B4', textDecoration: 'underline', fontSize: '0.88rem', wordBreak: 'break-all' }}>
                              {item.fileName || 'Download file'}
                            </a>
                          </div>
                        ) : (
                          <p style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{item.content}</p>
                        )}
                        <div style={{ fontSize: '0.7rem', color: own ? 'rgba(255,255,255,.72)' : '#bbb', textAlign: 'right', marginTop: 4 }}>
                          {fmtTime(item.createdAt)}{own && <i className="bi bi-check2-all ms-1"></i>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {isTyping && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 4 }}>
                  <div style={{ background: '#fff', padding: '10px 16px', borderRadius: '4px 16px 16px 16px', boxShadow: '0 1px 2px rgba(0,0,0,.08)' }}>
                    <div className="d-flex gap-1 align-items-center">
                      {[0, 200, 400].map((d) => (
                        <div key={d} style={{ width: 7, height: 7, background: '#aaa', borderRadius: '50%', animation: `chatBounce 1.2s ease-in-out ${d}ms infinite alternate` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* File preview */}
            {attachedFile && (
              <div style={{ padding: '8px 16px', background: '#fff', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <i className="bi bi-paperclip text-muted"></i>
                <span style={{ fontSize: '0.85rem', color: '#555', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachedFile.name}</span>
                <button className="btn btn-sm btn-link text-danger p-0" onClick={() => setAttachedFile(null)}><i className="bi bi-x-circle-fill"></i></button>
              </div>
            )}

            {/* Input bar */}
            <div style={{ padding: '10px 16px', background: '#fff', borderTop: '1px solid #e9ecef', display: 'flex', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
              {!activeContact.isAI && (
                <>
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.txt" />
                  <button className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} onClick={() => fileInputRef.current?.click()} title="Attach file">
                    <i className="bi bi-paperclip"></i>
                  </button>
                </>
              )}
              <textarea className="form-control" placeholder={activeContact.isAI ? 'Ask AutiSmart AI a question...' : `Message ${activeContact.name}...`} value={inputText} onChange={handleInputChange} onKeyDown={handleKeyDown} rows={1} style={{ resize: 'none', borderRadius: 20, padding: '9px 16px', border: '1px solid #dee2e6', fontSize: '0.9rem', lineHeight: 1.5, overflow: 'hidden', boxShadow: 'none' }} />
              <button className="btn d-flex align-items-center justify-content-center" style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, border: 'none', background: (inputText.trim() || attachedFile) ? '#61C3B4' : '#ddd', color: (inputText.trim() || attachedFile) ? '#fff' : '#aaa', transition: 'background .2s' }} onClick={handleSendMessage} disabled={sendingMessage || (!inputText.trim() && !attachedFile)}>
                {sendingMessage ? <div className="spinner-border" style={{ width: 16, height: 16, borderWidth: 2 }}></div> : <i className="bi bi-send-fill" style={{ fontSize: '0.88rem' }}></i>}
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', color: '#aaa', userSelect: 'none' }}>
            <i className="bi bi-chat-dots-fill" style={{ fontSize: '5rem', opacity: .12 }}></i>
            <h5 className="mt-4 fw-normal">Select a conversation to start chatting</h5>
            <p style={{ fontSize: '0.88rem', textAlign: 'center', maxWidth: 320 }}>Or choose <strong>AutiSmart AI</strong> for instant autism therapy guidance and recommendations.</p>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showAddModal && (
        <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, maxHeight: '75vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,.18)', overflow: 'hidden', margin: '0 16px' }}>
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,#61C3B4,#5EBEB0)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span className="fw-bold" style={{ fontSize: '1rem' }}><i className="bi bi-person-plus me-2"></i>New Conversation</span>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'rgba(255,255,255,.25)', border: 'none', color: '#fff', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
              <div className="input-group input-group-sm">
                <span className="input-group-text border-0" style={{ background: '#f5f5f5' }}><i className="bi bi-search text-muted"></i></span>
                <input autoFocus type="text" className="form-control border-0" placeholder="Search by name…" value={addModalSearch} onChange={(e) => setAddModalSearch(e.target.value)} style={{ background: '#f5f5f5', boxShadow: 'none' }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {[AI_CONTACT, ...contacts].filter((c) => c.name.toLowerCase().includes(addModalSearch.toLowerCase())).map((c) => (
                <div key={c._id} onClick={() => { handleSelectContact(c); setShowAddModal(false); }} style={{ padding: '12px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #f5f5f5', transition: 'background .15s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f0faf9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: rcol(c.role), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: c.isAI ? '1.2rem' : '0.95rem', fontWeight: 700, flexShrink: 0 }}>
                    {c.isAI ? <i className="bi bi-robot"></i> : initials(c.name)}
                  </div>
                  <div>
                    <div className="fw-semibold" style={{ fontSize: '0.92rem' }}>{c.name}{c.isAI && <span className="badge ms-1" style={{ fontSize: '0.6rem', background: '#61C3B4', verticalAlign: 'middle' }}>AI</span>}</div>
                    <div style={{ fontSize: '0.78rem', color: '#888' }}>{c.isAI ? 'Autism therapy AI assistant' : c.role}</div>
                  </div>
                </div>
              ))}
              {contacts.length === 0 && !loadingContacts && <div className="text-center py-4 text-muted"><small>No contacts available</small></div>}
            </div>
          </div>
        </div>
      )}

      {/* Floating message notification */}
      {floatingNotif && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, animation: 'moveAround 4s ease-in-out forwards', cursor: 'pointer', maxWidth: 300 }} onClick={() => { handleSelectContact(floatingNotif.contact); setFloatingNotif(null); if (floatingTimerRef.current) clearTimeout(floatingTimerRef.current); }}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,.2)', border: '2px solid #61C3B4', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#61C3B4,#5EBEB0)', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div className="d-flex align-items-center gap-2">
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>
                  {initials(floatingNotif.contact.name)}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.2 }}>{floatingNotif.contact.name}</div>
                  <div style={{ color: 'rgba(255,255,255,.8)', fontSize: '0.7rem' }}>{floatingNotif.contact.role}</div>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFloatingNotif(null); if (floatingTimerRef.current) clearTimeout(floatingTimerRef.current); }} style={{ background: 'rgba(255,255,255,.25)', border: 'none', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.7rem', flexShrink: 0 }}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div style={{ padding: '8px 14px', fontSize: '0.85rem', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
              <i className="bi bi-chat-fill me-1" style={{ color: '#61C3B4' }}></i>
              {floatingNotif.message.content ? floatingNotif.message.content.slice(0, 60) + (floatingNotif.message.content.length > 60 ? '…' : '') : floatingNotif.message.type === 'image' ? '📷 Image' : '📎 File'}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes chatBounce{from{transform:translateY(0);opacity:.5}to{transform:translateY(-4px);opacity:1}}@keyframes moveAround{0%{transform:translate(0,0);}12%{transform:translate(-260px,-20px);}25%{transform:translate(-500px,-60px);}38%{transform:translate(-500px,-320px);}50%{transform:translate(-260px,-400px);}62%{transform:translate(-60px,-320px);}75%{transform:translate(-380px,-180px);}88%{transform:translate(-140px,-80px);}100%{transform:translate(0,0);}}`}</style>
    </div>
  );
};

export default Communication;