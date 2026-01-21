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
        { role: "bot", text: "❌ Error contacting server", sources: [] }
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
      <div style={styles.container}>
        <h1 style={styles.title}>📚 JatinDocAI — Document-Based AI Chatbot</h1>

        <div style={styles.chatBox}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.bubble,
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                background:
                  msg.role === "user" ? "#2563eb" : "#e5e7eb",
                color: msg.role === "user" ? "#fff" : "#111",
              }}
            >
              {msg.text}

              {msg.sources && msg.sources.length > 0 && (
                <div style={styles.sources}>
                  {msg.sources.map((s, idx) => (
                    <div key={idx}>• {s}</div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.bubble, background: "#e5e7eb" }}>
              Thinking...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div style={styles.inputBox}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            style={styles.input}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          />
          <button
            style={{
              ...styles.primaryBtn,
              opacity: loading ? 0.6 : 1,
            }}
            onClick={handleAsk}
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Inter, Arial, sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: "800px",
    height: "90vh",
    display: "flex",
    flexDirection: "column",
  },
  title: {
    textAlign: "center",
    marginBottom: "10px",
  },
  chatBox: {
    flex: 1,
    background: "#ffffff",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  bubble: {
    maxWidth: "70%",
    padding: "10px 14px",
    borderRadius: "16px",
    lineHeight: "1.4",
    fontSize: "15px",
  },
  sources: {
    marginTop: "6px",
    fontSize: "12px",
    color: "#374151",
  },
  inputBox: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "20px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
  },
  primaryBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "20px",
    cursor: "pointer",
  },
};

export default App;
