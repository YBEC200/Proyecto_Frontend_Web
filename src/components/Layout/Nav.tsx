import "./Nav.css";

export default function Nav() {
  // Valores estáticos por ahora (sin backend)
  const notificationsCount = 3;
  const adminName = "Administrador";
  const adminRole = "Admin";

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
                <a className="nav-link" href="#">
                  <i className="bx bxl-reddit"></i>
                </a>
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
                  <div className="msg-header sticky-top bg-white">
                    <p className="msg-header-title">Notificaciones</p>
                    <p className="msg-header-badge">
                      {notificationsCount} Nuevas
                    </p>
                  </div>

                  <div
                    className="header-notifications-list"
                    style={{ maxHeight: 260, overflowY: "auto" }}
                  >
                    {/* notificaciones estáticas de ejemplo */}
                    <a className="dropdown-item" href="#">
                      <div className="d-flex align-items-center">
                        <div className="alert-image riesgo-medio">
                          <img src="/assets/images/default.png" alt="img" />
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="msg-name">
                            Pocos existencias{" "}
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

                  <div className="text-center msg-footer sticky-bottom bg-white">
                    <a href="#/notificaciones">
                      <button className="btn btn-primary w-100">
                        Ir a todas las notificaciones
                      </button>
                    </a>
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
                <a
                  className="dropdown-item d-flex align-items-center"
                  href="#/perfil"
                >
                  <i className="bx bx-user fs-5"></i>
                  <span>Perfil</span>
                </a>
              </li>
              <li>
                <div className="dropdown-divider mb-0"></div>
              </li>
              <li>
                <a
                  className="dropdown-item d-flex align-items-center"
                  href="#/logout"
                >
                  <i className="bx bx-log-out-circle"></i>
                  <span>Cerrar Sesión</span>
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
}
