import { useState, useRef, useEffect } from "react";

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const handleAsk = async () => {
    if (!question.trim()) return;

    const currentQuestion = question;
    setQuestion("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", text: currentQuestion }
    ]);

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: data.answer,
          sources: data.sources || []
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Server error", sources: [] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div style={styles.page}>
      <div style={styles.appCard}>
        <div style={styles.header}>
          <div style={styles.logo}>JatinDocAI</div>
          <div style={styles.tagline}>Document Intelligence System</div>
        </div>

        <div style={styles.chatBox}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.bubble,
                ...(msg.role === "user"
                  ? styles.userBubble
                  : styles.botBubble),
              }}
            >
              {msg.text}

              {msg.role === "bot" && (
                <div style={styles.sources}>
                  {msg.sources.length > 0 ? (
                    msg.sources.map((s, idx) => (
                      <span key={idx} style={styles.sourceChip}>
                        {s}
                      </span>
                    ))
                  ) : (
                    <span style={styles.noSource}>No sources found</span>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.bubble, ...styles.botBubble }}>
              Thinking...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div style={styles.inputWrapper}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question from your knowledge base..."
            style={styles.input}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          />
          <button
            onClick={handleAsk}
            disabled={loading}
            style={styles.sendBtn}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #0f172a 0%, #020617 60%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#fff",
  },

  appCard: {
    width: "100%",
    maxWidth: "900px",
    height: "88vh",
    display: "flex",
    flexDirection: "column",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,0.05), 0 30px 80px rgba(0,0,0,0.7)",
    backdropFilter: "blur(20px)",
    overflow: "hidden",
  },

  header: {
    padding: "20px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  logo: {
    fontSize: "20px",
    fontWeight: "600",
    letterSpacing: "0.5px",
  },

  tagline: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "2px",
  },

  chatBox: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  bubble: {
    maxWidth: "68%",
    padding: "14px 18px",
    borderRadius: "14px",
    lineHeight: "1.55",
    fontSize: "14.5px",
    whiteSpace: "pre-wrap",
  },

  userBubble: {
    alignSelf: "flex-end",
    background:
      "linear-gradient(135deg, #2563eb, #7c3aed)",
    boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
  },

  botBubble: {
    alignSelf: "flex-start",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  sources: {
    marginTop: "10px",
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },

  sourceChip: {
    fontSize: "11px",
    padding: "4px 10px",
    borderRadius: "999px",
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#a5b4fc",
  },

  noSource: {
    fontSize: "11px",
    color: "#94a3b8",
  },

  inputWrapper: {
    padding: "18px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    gap: "10px",
    background: "rgba(2,6,23,0.9)",
  },

  input: {
    flex: 1,
    padding: "14px 18px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#020617",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
  },

  sendBtn: {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    border: "none",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontSize: "20px",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(124,58,237,0.4)",
  },
};

export default App;
