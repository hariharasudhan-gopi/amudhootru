import { useEffect, useMemo, useRef, useState } from 'react';
import '../css/AIAssistant.css';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hi! I can search products, add items to your cart, place Cash on Delivery orders, and check your order status. What would you like to do?',
};

async function refreshCartCount() {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/products/getcart`, {
      credentials: 'include',
    });

    if (response.status === 404) {
      window.dispatchEvent(new CustomEvent('cart-count-changed', { detail: { count: 0 } }));
      return;
    }

    if (!response.ok) return;

    const data = await response.json();
    window.dispatchEvent(new CustomEvent('cart-count-changed', {
      detail: { count: (data.products || []).length },
    }));
  } catch (error) {
    console.error('Failed to refresh cart count:', error);
  }
}

export default function AIAssistant({ isLoggedIn }) {
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

  if (!isLoggedIn) {
    return null;
  }

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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: nextMessage }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to reach the AI assistant.');
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: data.answer || 'Sorry, I could not process that.',
      };

      setMessages((prev) => [...prev, assistantMessage]);
      refreshCartCount();
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
    <div className="aiAssistantRoot" aria-live="polite">
      {isOpen && (
        <section className="aiAssistantPanel" role="dialog" aria-label="AI shopping assistant">
          <header className="aiAssistantHeader">
            <div>
              <h3>AI Shopping Assistant</h3>
              <p>Search products, manage cart & orders</p>
            </div>
            <button className="aiAssistantClose" onClick={() => setIsOpen(false)} aria-label="Close assistant">×</button>
          </header>

          <div className="aiAssistantMessages">
            {messages.map((chatMessage) => (
              <article key={chatMessage.id} className={`aiAssistantMessage aiAssistantMessage_${chatMessage.role}`}>
                <p>{chatMessage.text}</p>
              </article>
            ))}

            {isLoading && (
              <article className="aiAssistantMessage aiAssistantMessage_assistant aiAssistantMessage_loading">
                <p>Thinking...</p>
              </article>
            )}

            {error && <p className="aiAssistantErrorText">{error}</p>}
            <div ref={messagesEndRef}></div>
          </div>

          <footer className="aiAssistantInputArea">
            <textarea
              rows="2"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Add 2 packs of ghee to my cart"
              maxLength={500}
              aria-label="Type your message"
            ></textarea>
            <button onClick={sendMessage} disabled={!canSend}>
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </footer>
        </section>
      )}

      <button
        className="aiAssistantLauncher"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      >
        {isOpen ? 'Close Assistant' : 'AI Assistant'}
      </button>
    </div>
  );
}
