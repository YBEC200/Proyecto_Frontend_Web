import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Nav.css";

const API_URL = import.meta.env.VITE_API_URL;

interface Alert {
  id: number;
  tipo: "PRODUCTO" | "VENTA";
  severidad: "baja" | "media" | "alta" | "critica";
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

export default function Nav() {
  const [showChatModal, setShowChatModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadAlerts, setUnreadAlerts] = useState<Alert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName = user.nombre || "Administrador";
  const adminRole = user.rol || "Admin";

  // Función para obtener el conteo de alertas no leídas
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/alerts/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // Función para obtener alertas no leídas
  const fetchUnreadAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/alerts/unread-index`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const alertsArray = Array.isArray(data) ? data : data.data || [];
        setUnreadAlerts(alertsArray);
      }
    } catch (error) {
      console.error("Error fetching unread alerts:", error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  // Cargar alertas no leídas cuando se abre el dropdown (simulado con useEffect)
  useEffect(() => {
    fetchUnreadCount();
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAlertsBellClick = () => {
    fetchUnreadAlerts();
  };

  // Función para obtener icono según severidad
  const getIconBySeveridad = (severidad: string): string => {
    switch (severidad) {
      case "critica":
        return "bx bx-error-circle";
      case "alta":
        return "bx bx-error";
      case "media":
        return "bx bx-info-circle";
      case "baja":
        return "bx bx-meh";
      default:
        return "bx bx-bell";
    }
  };

  // Función para formatear fecha
  const formatFecha = (fecha: string): string => {
    if (!fecha) return "";
    const date = new Date(fecha);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Ahora";
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString("es-PE");
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch(`${API_URL}/api/admin/logout`, {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
        });
        /* eslint-disable @typescript-eslint/no-unused-vars */
      } catch (error) {
        // Puedes mostrar un mensaje de error si lo deseas
      }
    }
    localStorage.setItem("isAuthenticated", "false");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Redirige si es necesario, por ejemplo:
    // window.location.href = "/";
  };

  const getSeveridadColor = (severidad: string): string => {
    switch (severidad) {
      case "critica":
        return "alert-critica";
      case "alta":
        return "alert-alta";
      case "media":
        return "alert-media";
      case "baja":
        return "alert-baja";
      default:
        return "alert-default";
    }
  };
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
                  onClick={(e) => {
                    e.preventDefault();
                    handleAlertsBellClick();
                  }}
                >
                  {unreadCount > 0 && (
                    <span className="alert-count">{unreadCount}</span>
                  )}
                  <i className="bx bx-bell"></i>
                </a>

                <div className="dropdown-menu dropdown-menu-end alerts-dropdown">
                  <div className="msg-header">
                    <p className="msg-header-title">Alertas pendientes</p>
                    <p className="msg-header-badge">
                      {unreadCount} {unreadCount === 1 ? "Nueva" : "Nuevas"}
                    </p>
                  </div>

                  <div className="header-notifications-list">
                    {loadingAlerts ? (
                      <div className="text-center py-3">
                        <div
                          className="spinner-border spinner-border-sm text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                      </div>
                    ) : unreadAlerts.length === 0 ? (
                      <div className="text-center py-3 text-muted">
                        <i
                          className="bx bx-mail-open d-block mb-2"
                          style={{ fontSize: "2rem" }}
                        ></i>
                        <p className="mb-0">No hay alertas nuevas</p>
                      </div>
                    ) : (
                      unreadAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`alert-item ${getSeveridadColor(alert.severidad)}`}
                        >
                          <div className="alert-icon-wrapper">
                            <i
                              className={`${getIconBySeveridad(alert.severidad)} alert-icon`}
                            ></i>
                          </div>
                          <div className="alert-content">
                            <h6 className="alert-title">{alert.titulo}</h6>
                            <p className="alert-message">{alert.mensaje}</p>
                            <small className="alert-time">
                              {formatFecha(alert.created_at)}
                            </small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="text-center msg-footer p-2">
                    <Link to="/dashboard/notificaciones" className="w-100">
                      <button className="btn btn-primary w-100">
                        <i className="bx bx-chevron-right"></i>
                        Ver todas las alertas
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
                  onClick={handleLogout}
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
