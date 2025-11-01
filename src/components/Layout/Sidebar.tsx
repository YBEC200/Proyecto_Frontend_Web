import "./Sidebar.css";
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar-wrapper" data-simplebar>
      <div className="sidebar-header">
        <div>
          <img
            src="/assets/images/CD_IMAGEN.png"
            className="logo-icon"
            alt="logo icon"
          />
        </div>
        <div>
          <h4 className="logo-text">
            <span className="cd">CD</span>
            <span className="tech">TECH</span>
          </h4>
        </div>
        <div className="toggle-icon ms-auto">
          <i className="bx bx-menu"></i>
        </div>
      </div>

      <ul className="metismenu" id="menu">
        <li>
          <a
            data-bs-toggle="collapse"
            href="#submenuDashboard"
            role="button"
            aria-expanded="false"
            className="d-flex align-items-center"
          >
            <div className="parent-icon">
              <i className="bx bx-home"></i>
            </div>
            <div className="menu-title flex-grow-1">Dashboard</div>
            <i className="bx bx-chevron-down ms-auto arrow-menu"></i>
          </a>
          <ul className="collapse" id="submenuDashboard">
            <li>
              <Link to="/dashboard" className="d-flex align-items-center">
                <i className="bx bx-bar-chart"></i>
                <span>Analisis de Ventas</span>
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/historial"
                className="d-flex align-items-center"
              >
                <i className="bx bx-list-ul"></i>
                <span>Lista de Pendientes</span>
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/notificaciones"
                className="d-flex align-items-center"
              >
                <i className="bx bx-bell"></i>
                <span>Notificaciones y alertas</span>
              </Link>
            </li>
          </ul>
        </li>

        <li className="menu-label">Gestión de Ventas</li>

        <li>
          <a
            data-bs-toggle="collapse"
            href="#submenuPedidos"
            role="button"
            aria-expanded="false"
            className="d-flex align-items-center"
          >
            <div className="parent-icon">
              <i className="bx bx-cart"></i>
            </div>
            <div className="menu-title flex-grow-1">Pedidos</div>
            <i className="bx bx-chevron-down ms-auto arrow-menu"></i>
          </a>
          <ul className="collapse" id="submenuPedidos">
            <li>
              <a href="#/gestion-pedidos">
                <i className="bx bx-task"></i>Gestión de Pedidos
              </a>
            </li>
            <li>
              <a href="#/asignar-pedidos">
                <i className="bx bx-bell"></i>Asignar Pedido
              </a>
            </li>
          </ul>
        </li>

        <li className="menu-label">Gestión de Productos</li>
        <li>
          <a
            data-bs-toggle="collapse"
            href="#submenuProductos"
            role="button"
            aria-expanded="false"
            className="d-flex align-items-center"
          >
            <div className="parent-icon">
              <i className="bx bx-package"></i>
            </div>
            <div className="menu-title flex-grow-1">Producto</div>
            <i className="bx bx-chevron-down ms-auto arrow-menu"></i>
          </a>
          <ul className="collapse" id="submenuProductos">
            <li>
              <a href="#/gestion-productos">
                <i className="bx bx-box"></i>Gestión de Productos
              </a>
            </li>
            <li>
              <a href="#/agregar-categoria">
                <i className="bx bx-plus-circle"></i>Agregar Categoria
              </a>
            </li>
            <li>
              <a href="#/agregar-productos">
                <i className="bx bx-layer-plus"></i>Agregar Producto
              </a>
            </li>
          </ul>
        </li>

        <li className="menu-label">Usuarios</li>
        <li>
          <a href="#/usuarios" className="d-flex align-items-center">
            <div className="parent-icon">
              <i className="bx bx-user"></i>
            </div>
            <div className="menu-title">Lista de Usuarios</div>
          </a>
        </li>
      </ul>
    </aside>
  );
}
