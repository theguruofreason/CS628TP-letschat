import { useContext, useEffect, useRef, useState } from "react";
import { UnameContext } from "./unameContext";
import { fetchChatHistory, getWebSocketUrl } from "./api";

export default function Chat({ preview = true }) {
  const { uname, accessToken } = useContext(UnameContext);

  const messageInput = useRef(null);
  const socketRef = useRef(null);
  const historyRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  // Initial snapshot of the shared room. While logged out (no websocket)
  // keep it lightly polled so the preview stays roughly current.
  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const history = await fetchChatHistory();
        if (!cancelled) setMessages(history);
      } catch {
        if (!cancelled) setError("Couldn't load chat history.");
      }
    }

    loadHistory();
    if (accessToken) return undefined;

    const intervalId = setInterval(loadHistory, 8000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [accessToken]);

  // Live connection once logged in: the server also echoes our own
  // messages back, so we only ever append from here, never optimistically.
  useEffect(() => {
    if (!accessToken) return undefined;

    // React StrictMode intentionally mounts effects twice in development,
    // which opens and immediately tears down a first socket before the
    // "real" one connects. Closing a socket mid-handshake fires a browser
    // error event on it - `torndown` lets us ignore that expected noise
    // without swallowing an error from the socket actually in use.
    let torndown = false;
    const socket = new WebSocket(getWebSocketUrl(accessToken));
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const incoming = JSON.parse(event.data);
        setMessages((prev) => [...prev, incoming]);
      } catch {
        // ignore malformed frames
      }
    };
    socket.onerror = () => {
      if (!torndown) setError("Chat connection error.");
    };

    return () => {
      torndown = true;
      socket.close();
      socketRef.current = null;
    };
  }, [accessToken]);

  // Keep the log scrolled to the newest message.
  useEffect(() => {
    const el = historyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function sendMessage() {
    const text = messageInput.current?.value.trim();
    const socket = socketRef.current;
    if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(text);
    messageInput.current.value = "";
  }

  return (
    <div className="chat-container">
      <div className="chat-history" ref={historyRef}>
        {messages.length === 0 ? (
          <p className="chat-empty">No messages yet — say hello!</p>
        ) : (
          messages.map((m, i) => (
            <div
              key={m._id ?? i}
              className={
                "chat-message" + (m.user === uname ? " chat-message-own" : "")
              }
            >
              <span className="chat-message-user">{m.user}</span>
              <span className="chat-message-text">{m.message}</span>
            </div>
          ))
        )}
      </div>
      {!preview && (
        <div className="chat-entry">
          <input
            type="text"
            placeholder="Type a message…"
            disabled={uname === null}
            ref={messageInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />
          <button onClick={sendMessage} disabled={uname === null}>
            Send
          </button>
        </div>
      )}
      {error && <p className="chat-error">{error}</p>}
    </div>
  );
}
