import { useEffect, useState } from "react";
import "./Sidebar.css";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();
  const [open, setOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    // iniciar colapsado en pantallas pequeñas
    if (typeof window !== "undefined") return window.innerWidth < 768;
    return false;
  });

  useEffect(() => {
    const p = location.pathname;
    if (p.startsWith("/dashboard")) setOpen("submenuDashboard");
    else if (p.startsWith("/pedidos")) setOpen("submenuPedidos");
    else if (p.startsWith("/productos")) setOpen("submenuProductos");
    else setOpen(null);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setCollapsed(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggle = (id: string) => setOpen((prev) => (prev === id ? null : id));
  const toggleCollapse = () => {
    setCollapsed((prev) => !prev);
    // Asegúrate de que el estado se actualice correctamente
    console.log("Sidebar collapsed state:", !collapsed);
  };

  const isActive = (base: string) => location.pathname.startsWith(base);

  return (
    <aside
      className={`sidebar-wrapper ${collapsed ? "collapsed" : ""}`}
      data-simplebar
    >
      <div className="sidebar-header">
        <div>
          <img
            src="/assets/images/CD_IMAGEN.png"
            className="logo-icon"
            alt="logo icon"
          />
        </div>
        <div className="logo-block">
          <h4 className="logo-text">
            <span className="cd">CD</span>
            <span className="tech">TECH</span>
          </h4>
        </div>

        {/* botón para colapsar/expandir */}
        <div
          className="toggle-icon ms-auto"
          role="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={toggleCollapse}
        >
          <i
            className={`bx ${collapsed ? "bx-menu-alt-right" : "bx-menu"}`}
          ></i>
        </div>
      </div>

      <ul className="metismenu" id="menu">
        <li className={open === "submenuDashboard" ? "active" : ""}>
          <a
            role="button"
            aria-expanded={open === "submenuDashboard"}
            className="d-flex align-items-center toggle-link"
            onClick={() => toggle("submenuDashboard")}
          >
            <div className="parent-icon">
              <i className="bx bx-home"></i>
            </div>
            <div className="menu-title flex-grow-1">Dashboard</div>
            <i className="bx bx-chevron-down ms-auto arrow-menu"></i>
          </a>
          <ul
            className={`collapse ${open === "submenuDashboard" ? "show" : ""}`}
            id="submenuDashboard"
          >
            <li>
              <Link
                to="/dashboard"
                className={`d-flex align-items-center ${
                  isActive("/dashboard") && location.pathname === "/dashboard"
                    ? "active-menu"
                    : ""
                }`}
              >
                <i className="bx bx-bar-chart"></i>
                <span>Analisis de Ventas</span>
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/historial"
                className={`d-flex align-items-center ${
                  isActive("/dashboard/historial") ? "active-menu" : ""
                }`}
              >
                <i className="bx bx-list-ul"></i>
                <span>Lista de Pendientes</span>
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/notificaciones"
                className={`d-flex align-items-center ${
                  isActive("/dashboard/notificaciones") ? "active-menu" : ""
                }`}
              >
                <i className="bx bx-bell"></i>
                <span>Notificaciones y alertas</span>
              </Link>
            </li>
          </ul>
        </li>

        <li className="menu-label">Gestión de Ventas</li>

        <li className={open === "submenuPedidos" ? "active" : ""}>
          <a
            role="button"
            aria-expanded={open === "submenuPedidos"}
            className="d-flex align-items-center toggle-link"
            onClick={() => toggle("submenuPedidos")}
          >
            <div className="parent-icon">
              <i className="bx bx-cart"></i>
            </div>
            <div className="menu-title flex-grow-1">Pedidos</div>
            <i className="bx bx-chevron-down ms-auto arrow-menu"></i>
          </a>
          <ul
            className={`collapse ${open === "submenuPedidos" ? "show" : ""}`}
            id="submenuPedidos"
          >
            <li>
              <Link
                to="/pedidos"
                className={`d-flex align-items-center ${
                  isActive("/pedidos") && location.pathname === "/pedidos"
                    ? "active-menu"
                    : ""
                }`}
              >
                <i className="bx bx-task"></i>
                <span>Gestión de Pedidos</span>
              </Link>
            </li>
            <li>
              <Link
                to="/pedidos/asignar"
                className={`d-flex align-items-center ${
                  isActive("/pedidos/asignar") ? "active-menu" : ""
                }`}
              >
                <i className="bx bx-bell"></i>
                <span>Asignar Pedido</span>
              </Link>
            </li>
          </ul>
        </li>

        <li className="menu-label">Gestión de Productos</li>
        <li className={open === "submenuProductos" ? "active" : ""}>
          <a
            role="button"
            aria-expanded={open === "submenuProductos"}
            className="d-flex align-items-center toggle-link"
            onClick={() => toggle("submenuProductos")}
          >
            <div className="parent-icon">
              <i className="bx bx-package"></i>
            </div>
            <div className="menu-title flex-grow-1">Producto</div>
            <i className="bx bx-chevron-down ms-auto arrow-menu"></i>
          </a>
          <ul
            className={`collapse ${open === "submenuProductos" ? "show" : ""}`}
            id="submenuProductos"
          >
            <li>
              <Link
                to="/productos"
                className={`d-flex align-items-center ${
                  isActive("/productos") && location.pathname === "/productos"
                    ? "active-menu"
                    : ""
                }`}
              >
                <i className="bx bx-box"></i>
                <span>Gestión de Productos</span>
              </Link>
            </li>
            <li>
              <Link
                to="/productos/lotes"
                className={`d-flex align-items-center ${
                  isActive("/productos/lotes") ? "active-menu" : ""
                }`}
              >
                <i className="bx bx-plus-circle"></i>
                <span>Gestion de Lotes</span>
              </Link>
            </li>
            <li>
              <Link
                to="/productos/agregarproductos"
                className={`d-flex align-items-center ${
                  isActive("/productos/agregarproductos") ? "active-menu" : ""
                }`}
              >
                <i className="bx bx-layer-plus"></i>
                <span>Agregar Producto</span>
              </Link>
            </li>
          </ul>
        </li>

        <li className="menu-label">Usuarios</li>
        <li>
          <Link
            to="/usuarios"
            className={`d-flex align-items-center ${
              isActive("/usuarios") ? "active-menu" : ""
            }`}
          >
            <div className="parent-icon">
              <i className="bx bx-user"></i>
            </div>
            <div className="menu-title">Lista de Usuarios</div>
          </Link>
        </li>
      </ul>
    </aside>
  );
}
