import { useEffect, useMemo, useRef, useState } from 'react';
import '../css/SupportChatbot.css';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hello! I can help with delivery, returns, cancellation, and product FAQs based on Amudhootru FAQ and Policy documents.',
  sources: [],
};

export default function SupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const messagesEndRef = useRef(null);

  const canSend = useMemo(() => {
    return !isLoading && message.trim().length > 0;
  }, [isLoading, message]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isOpen, isLoading]);

  async function sendMessage() {
    const nextMessage = message.trim();
    if (!nextMessage || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: nextMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: nextMessage }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to fetch chatbot response.');
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: data.answer || 'The information is not available in the FAQ or Policy documents.',
        sources: Array.isArray(data.sources) ? data.sources : [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="supportChatRoot" aria-live="polite">
      {isOpen && (
        <section className="supportChatPanel" role="dialog" aria-label="Customer support chatbot">
          <header className="supportChatHeader">
            <div>
              <h3>Support Assistant</h3>
              <p>Powered by FAQ and Policy knowledge</p>
            </div>
            <button className="supportChatClose" onClick={() => setIsOpen(false)} aria-label="Close chatbot">×</button>
          </header>

          <div className="supportChatMessages">
            {messages.map((chatMessage) => (
              <article key={chatMessage.id} className={`chatMessage chatMessage_${chatMessage.role}`}>
                <p>{chatMessage.text}</p>
                {chatMessage.role === 'assistant' && Array.isArray(chatMessage.sources) && chatMessage.sources.length > 0 && (
                  <div className="chatMessageSources">
                    <span>Sources:</span>
                    <ul>
                      {[...new Set(chatMessage.sources.map((src) => src?.source).filter(Boolean))].map((sourceLabel) => (
                        <li key={`${chatMessage.id}-${sourceLabel}`}>{sourceLabel}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))}

            {isLoading && (
              <article className="chatMessage chatMessage_assistant chatMessage_loading">
                <p>Checking FAQ and Policy...</p>
              </article>
            )}

            {error && <p className="chatErrorText">{error}</p>}
            <div ref={messagesEndRef}></div>
          </div>

          <footer className="supportChatInputArea">
            <textarea
              rows="2"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about delivery, cancellation, refund, products..."
              maxLength={600}
              aria-label="Type your message"
            ></textarea>
            <button onClick={sendMessage} disabled={!canSend}>
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </footer>
        </section>
      )}

      <button
        className="supportChatLauncher"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
      >
        {isOpen ? 'Close Chat' : 'Need Help?'}
      </button>
    </div>
  );
}
