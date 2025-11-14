import { Link } from "react-router-dom";
import { useState } from "react";
import "./Nav.css";

export default function Nav() {
  const [showChatModal, setShowChatModal] = useState(false);
  // Valores estáticos por ahora (sin backend)
  const notificationsCount = 3;
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName = user.nombre || "Administrador";
  const adminRole = user.rol || "Admin";

  return (
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
                  className="nav-link btn p-0"
                  type="button"
                  onClick={() => setShowChatModal(true)}
                  style={{ background: "none", border: "none" }}
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
                  onClick={() => {
                    localStorage.setItem("isAuthenticated", "false");
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                  }}
                >
                  <i className="bx bx-log-out-circle"></i>
                  <span>Cerrar Sesión</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
      {showChatModal && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Chat de Soporte</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowChatModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div
                  className="chat-box"
                  style={{
                    minHeight: "200px",
                    background: "#f8f9fa",
                    borderRadius: "8px",
                    padding: "10px",
                  }}
                >
                  {/* Aquí irán los mensajes del chat */}
                  <div className="text-muted text-center">
                    ¡Bienvenido al chat de soporte!
                  </div>
                </div>
                <div className="mt-3 d-flex">
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Escribe tu mensaje..."
                    disabled
                  />
                  <button className="btn btn-primary" disabled>
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
