import { useState } from "react";
import { Link } from "react-router-dom";
import "./Nav.css";

function ChatbotModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<
    { sender: "user" | "bot"; text: string }[]
  >([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { sender: "user", text: input }]);
    setInput("");
    try {
      // Cambia la URL por la de tu API real
      const res = await fetch("https://api.chatbot.com/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: data.reply || "Sin respuesta" },
      ]);
    } catch {
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "Error al conectar con el chatbot." },
      ]);
    }
  };

  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.3)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          width: 350,
          maxWidth: "90vw",
          boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "#007bff",
            color: "#fff",
            padding: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Chatbot</span>
          <button
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 20,
              cursor: "pointer",
            }}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div
          style={{
            flex: 1,
            padding: 12,
            overflowY: "auto",
            background: "#f7f7f7",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: 8,
                padding: "8px 12px",
                borderRadius: 16,
                maxWidth: "80%",
                background: msg.sender === "user" ? "#e3f2fd" : "#fff",
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                textAlign: msg.sender === "user" ? "right" : "left",
                border: msg.sender === "bot" ? "1px solid #eee" : undefined,
              }}
            >
              {msg.text}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            padding: 8,
            borderTop: "1px solid #eee",
            background: "#fafafa",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            style={{
              flex: 1,
              border: "1px solid #ccc",
              borderRadius: 16,
              padding: "6px 12px",
              marginRight: 8,
            }}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            style={{
              background: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: 16,
              padding: "6px 16px",
              cursor: "pointer",
            }}
            onClick={sendMessage}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Nav() {
  const notificationsCount = 3;
  const adminName = "Administrador";
  const adminRole = "Admin";
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <header>
        <div className="topbar d-flex align-items-center">
          <nav className="navbar navbar-expand gap-3 w-100">
            <div className="mobile-toggle-menu">
              <i className="bx bx-menu"></i>
            </div>

            <div className="top-menu ms-auto">
              <ul className="navbar-nav align-items-center gap-1">
                <li className="nav-item">
                  <button
                    className="nav-link"
                    style={{ background: "none", border: "none", padding: 0 }}
                    onClick={() => setChatOpen(true)}
                  >
                    <i className="bx bxl-reddit"></i>
                  </button>
                </li>

                <li className="nav-item dropdown dropdown-large">
                  <a
                    className="nav-link position-relative"
                    href="#"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <span className="alert-count">{notificationsCount}</span>
                    <i className="bx bx-bell"></i>
                  </a>

                  <div className="dropdown-menu dropdown-menu-end">
                    <div className="msg-header">
                      <p className="msg-header-title">Notificaciones</p>
                      <p className="msg-header-badge">
                        {notificationsCount} Nuevas
                      </p>
                    </div>

                    <div className="header-notifications-list">
                      <a className="dropdown-item" href="#">
                        <div className="d-flex align-items-start">
                          <div className="alert-image riesgo-medio">
                            <img src="/assets/images/default.png" alt="img" />
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="msg-name">
                              Pocos existencias
                              <span className="msg-time float-end">
                                Hace poco
                              </span>
                            </h6>
                            <p className="msg-info">
                              Quedan menos de 50 existencias del producto
                              "Ejemplo".
                            </p>
                          </div>
                        </div>
                      </a>

                      <a className="dropdown-item" href="#">
                        <div className="d-flex align-items-center">
                          <div className="alert-image riesgo-alto">
                            <img src="/assets/images/default.png" alt="img" />
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="msg-name">
                              Stock agotado{" "}
                              <span className="msg-time float-end">
                                Hace poco
                              </span>
                            </h6>
                            <p className="msg-info">
                              Se necesita reponer el stock del producto "Ejemplo
                              2".
                            </p>
                          </div>
                        </div>
                      </a>
                    </div>

                    <div className="text-center msg-footer p-2">
                      <Link to="/dashboard/notificaciones" className="w-100">
                        <button className="btn btn-primary w-100">
                          Ir a todas las notificaciones
                        </button>
                      </Link>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="user-box dropdown px-3">
              <a
                className="d-flex align-items-center nav-link dropdown-toggle gap-3"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <img
                  src="/assets/images/avatars/avatar-1.png"
                  className="user-img"
                  alt="user avatar"
                />
                <div className="user-info">
                  <p className="user-name mb-0">{adminName}</p>
                  <p className="user-role mb-0">{adminRole}</p>
                </div>
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <Link
                    to="/tu_perfil"
                    className="dropdown-item d-flex align-items-center"
                  >
                    <i className="bx bx-user fs-5"></i>
                    <span>Perfil</span>
                  </Link>
                </li>
                <li>
                  <div className="dropdown-divider mb-0"></div>
                </li>
                <li>
                  <Link
                    to="/"
                    className="dropdown-item d-flex align-items-center"
                  >
                    <i className="bx bx-log-out-circle"></i>
                    <span>Cerrar Sesión</span>
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </header>
      <ChatbotModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
