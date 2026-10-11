import React, { useState, useEffect, useRef } from 'react';
import { apiAskModuleDoubt } from '../services/api';
import { speechSynthesisService } from '../services/speechSynthesisService';
import { 
  Bot, Send, Sparkles, Volume2, Trash2, HelpCircle, 
  AlertCircle, RefreshCw, MessageSquare 
} from 'lucide-react';

export const DoubtChatbot = ({ moduleId, moduleTitle, subjectName }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatBottomRef = useRef(null);

  // Initialize or reset conversation when module/lesson changes
  useEffect(() => {
    if (moduleId) {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Hello! I am your AI Doubt Assistant for "${moduleTitle || 'this lesson'}". Ask me anything you'd like to clarify about this material!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setError('');
      setInput('');
    }
  }, [moduleId, moduleTitle]);

  // Auto-scroll to bottom of chat on message change
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async (questionText) => {
    const textToSend = (questionText || input).trim();
    if (!textToSend || loading) return;

    if (textToSend.length > 2000) {
      setError('Your question is too long. Please keep it under 2000 characters.');
      return;
    }

    setError('');

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'student',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Send up to last 10 messages for conversation context
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-10)
        .map((m) => ({ sender: m.sender, text: m.text }));

      const res = await apiAskModuleDoubt(moduleId, textToSend, history);

      if (res.ok && res.data && res.data.success) {
        const aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: res.data.answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFallback: res.data.is_fallback
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg = res.error || res.data?.error || "Sorry, I couldn't process your question right now. Please try again.";
        setError(errorMsg);
        const aiErrorMsg = {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: "I ran into a temporary issue answering your question. Please try asking again in a moment.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        };
        setMessages((prev) => [...prev, aiErrorMsg]);
      }
    } catch (err) {
      setError("Network connection issue. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSpeakText = (text) => {
    if (speechSynthesisService.isSupported()) {
      speechSynthesisService.speak(text, { interrupt: true });
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: `Chat reset. Ask me any question about "${moduleTitle || 'this lesson'}".`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setError('');
  };

  return (
    <div className="card" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '560px', 
      padding: 0, 
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-md)'
    }}>
      
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--primary-600)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={20} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              AI Doubt Assistant <Sparkles size={14} color="var(--warning-300)" />
            </h3>
            <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
              Lesson Assistant • {subjectName || 'Current Subject'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearChat}
          title="Clear Conversation"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            padding: '0.35rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem'
          }}
        >
          <Trash2 size={15} /> Clear
        </button>
      </div>

      {/* Quick Questions Row */}
      <div style={{
        padding: '0.6rem 0.85rem',
        backgroundColor: 'var(--bg-surface-elevated)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        gap: '0.35rem',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        <button
          type="button"
          onClick={() => handleSend("Can you explain this lesson in simple terms?")}
          disabled={loading}
          style={{
            padding: '0.3rem 0.65rem',
            borderRadius: '12px',
            border: '1px solid var(--primary-200)',
            backgroundColor: 'var(--primary-50)',
            color: 'var(--primary-700)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          💡 Explain simply
        </button>
        <button
          type="button"
          onClick={() => handleSend("Can you give me a practical real-world example?")}
          disabled={loading}
          style={{
            padding: '0.3rem 0.65rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-main)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          📝 Real example
        </button>
        <button
          type="button"
          onClick={() => handleSend("Break down the main steps of this concept.")}
          disabled={loading}
          style={{
            padding: '0.3rem 0.65rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-main)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          🗺️ Step-by-step
        </button>
        <button
          type="button"
          onClick={() => handleSend("What are the key points I should remember?")}
          disabled={loading}
          style={{
            padding: '0.3rem 0.65rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-main)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          ⭐ Key takeaways
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          padding: '0.5rem 0.85rem',
          backgroundColor: 'var(--danger-50)',
          borderBottom: '1px solid var(--danger-200)',
          color: 'var(--danger-700)',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Chat Messages Body */}
      <div style={{
        flex: 1,
        padding: '1rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        backgroundColor: 'var(--bg-surface)'
      }}>
        {messages.map((msg) => {
          const isStudent = msg.sender === 'student';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isStudent ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '0.75rem 0.95rem',
                  borderRadius: isStudent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: isStudent ? 'var(--primary-600)' : 'var(--bg-surface-elevated)',
                  color: isStudent ? '#ffffff' : 'var(--text-main)',
                  border: isStudent ? 'none' : '1px solid var(--border-color)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                {msg.text}
              </div>

              {/* Message Footer: Timestamp + TTS Read Option */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.25rem',
                fontSize: '0.7rem',
                color: 'var(--text-muted)'
              }}>
                <span>{msg.time}</span>
                {!isStudent && (
                  <button
                    type="button"
                    onClick={() => handleSpeakText(msg.text)}
                    title="Read this answer out loud"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary-600)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      fontWeight: 600,
                      fontSize: '0.7rem'
                    }}
                  >
                    <Volume2 size={12} /> Read Answer
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '16px 16px 16px 4px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <RefreshCw size={14} className="spin" />
              <span>AI Doubt Assistant thinking...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Chat Input Bar */}
      <div style={{
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--bg-surface-elevated)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a doubt about this lesson..."
          disabled={loading}
          maxLength={2000}
          style={{
            flex: 1,
            padding: '0.65rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-main)',
            fontSize: '0.875rem'
          }}
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="btn btn-primary"
          style={{
            padding: '0.65rem 1.1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          {loading ? 'Asking...' : 'Ask'} <Send size={14} />
        </button>
      </div>

    </div>
  );
};

export default DoubtChatbot;
