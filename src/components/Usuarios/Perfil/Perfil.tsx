import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./Perfil.css";

interface UserData {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
}

export default function Perfil() {
  const [userData, setUserData] = useState<UserData>({
    id: 0,
    nombre: "Usuario",
    correo: "usuario@example.com",
    rol: "Administrador",
  });

  useEffect(() => {
    // Obtener datos del localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-area">
        <Nav />
        <div className="page-wrapper">
          <div className="page-content">
            {/* Breadcrumb */}
            <div className="page-breadcrumb d-none d-sm-flex align-items-center mb-3">
              <div className="breadcrumb-title pe-3">Perfil de Usuario</div>
              <div className="ps-3">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0 p-0">
                    <li className="breadcrumb-item">
                      <Link to="/dashboard">
                        <i className="bx bx-home-alt"></i>
                      </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      {userData.correo}
                    </li>
                  </ol>
                </nav>
              </div>
            </div>

            <div className="container">
              <div className="main-body">
                <div className="row">
                  {/* Tarjeta de Perfil */}
                  <div className="col-lg-4">
                    <div className="card">
                      <div className="card-body">
                        <div className="d-flex flex-column align-items-center text-center">
                          <img
                            src="/assets/images/avatars/avatar-1.png"
                            alt="Usuario"
                            className="rounded-circle p-1 bg-primary"
                            width="110"
                          />
                          <div className="mt-3">
                            <h4>{userData.nombre}</h4>
                            <p className="text-secondary mb-1">
                              {userData.rol}
                            </p>
                            <p className="text-muted font-size-sm">
                              ID: #{userData.id}
                            </p>
                          </div>
                        </div>
                        <hr className="my-4" />
                        <ul className="list-group list-group-flush">
                          <li className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                            <h6 className="mb-0">
                              <i className="bx bx-envelope me-2"></i>
                              Correo
                            </h6>
                            <span className="text-secondary">
                              {userData.correo}
                            </span>
                          </li>
                          <li className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                            <h6 className="mb-0">
                              <i className="bx bx-shield me-2"></i>
                              Rol
                            </h6>
                            <span className="text-secondary">
                              {userData.rol}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta de Información de la Aplicación */}
                  <div className="col-lg-8">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title mb-4">
                          <i className="bx bx-info-circle me-2"></i>Acerca de
                          esta Plataforma
                        </h5>

                        <p className="mb-3">
                          Bienvenido a nuestro{" "}
                          <strong>
                            Sistema de Gestión de Productos y Órdenes
                          </strong>
                          , una plataforma integral diseñada para optimizar la
                          administración de inventario, ventas y logística.
                        </p>

                        <h6 className="text-primary fw-bold mt-4 mb-2">
                          <i className="bx bx-star me-2"></i>Funcionalidades
                        </h6>

                        <ul className="list-unstyled">
                          <li className="mb-2">
                            <i className="bx bx-check text-success me-2"></i>
                            <strong>Gestión de Productos:</strong> Administra tu
                            catálogo completo con categorías, descripción,
                            imágenes (principal y secundarias) almacenadas en
                            Cloudinary, y estado de disponibilidad.
                          </li>
                          <li className="mb-2">
                            <i className="bx bx-check text-success me-2"></i>
                            <strong>Control de Lotes:</strong> Crea y gestiona
                            lotes de productos con fechas de vencimiento,
                            cantidades y registro automático de trazabilidad.
                          </li>
                          <li className="mb-2">
                            <i className="bx bx-check text-success me-2"></i>
                            <strong>Gestión de Ventas:</strong> Registra órdenes
                            de compra, detalles de venta, y monitorea el estado
                            de cada transacción en tiempo real.
                          </li>
                          <li className="mb-2">
                            <i className="bx bx-check text-success me-2"></i>
                            <strong>Gestión de Usuarios:</strong> Controla
                            accesos, roles y permisos para garantizar la
                            seguridad de tu información.
                          </li>
                          <li className="mb-2">
                            <i className="bx bx-check text-success me-2"></i>
                            <strong>Dashboard Analítico:</strong> Visualiza
                            métricas, estadísticas de ventas, inventario y
                            tendencias en un solo lugar.
                          </li>
                          <li className="mb-2">
                            <i className="bx bx-check text-success me-2"></i>
                            <strong>Notificaciones:</strong> Recibe alertas
                            sobre cambios en inventario, órdenes pendientes y
                            eventos importantes.
                          </li>
                        </ul>

                        <div className="alert alert-info mt-4 mb-0">
                          <i className="bx bx-bulb me-2"></i>
                          <strong>Tip:</strong> Utiliza los menús laterales para
                          acceder a cada sección.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
