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
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataToSend: any = {};

      // Solo enviar campos modificados
      Object.keys(formData).forEach((key) => {
        if (
          formData[key as keyof UserData] !== userData[key as keyof UserData]
        ) {
          dataToSend[key] = formData[key as keyof UserData];
        }
      });

      if (password) {
        dataToSend.password = password;
        dataToSend.password_confirmation = confirmPassword;
      }

      if (Object.keys(dataToSend).length === 0) {
        alert("No hay cambios para actualizar.");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/usuarios/${userData.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al actualizar");
      }

      const updatedUser = { ...userData, ...dataToSend };

      setUserData(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setIsEditing(false);
      setPassword("");
      setConfirmPassword("");
      setFormData({});

      alert("Perfil actualizado correctamente");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    }
  };

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
                        <div className="text-center mb-3">
                          <img
                            src="/assets/images/avatars/avatar-1.png"
                            alt="Usuario"
                            className="rounded-circle p-1 bg-primary"
                            width="110"
                          />
                        </div>

                        {/* Nombre */}
                        <div className="mb-3">
                          <label className="form-label">Nombre</label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="nombre"
                              className="form-control"
                              defaultValue={userData.nombre}
                              onChange={handleChange}
                            />
                          ) : (
                            <p className="form-control-plaintext">
                              {userData.nombre}
                            </p>
                          )}
                        </div>

                        {/* Correo */}
                        <div className="mb-3">
                          <label className="form-label">Correo</label>
                          {isEditing ? (
                            <input
                              type="email"
                              name="correo"
                              className="form-control"
                              defaultValue={userData.correo}
                              onChange={handleChange}
                            />
                          ) : (
                            <p className="form-control-plaintext">
                              {userData.correo}
                            </p>
                          )}
                        </div>

                        {/* Rol (solo lectura) */}
                        <div className="mb-3">
                          <label className="form-label">Rol</label>
                          <p className="form-control-plaintext">
                            {userData.rol}
                          </p>
                        </div>

                        {/* Password */}
                        {isEditing && (
                          <>
                            <div className="mb-3">
                              <label className="form-label">
                                Nueva contraseña
                              </label>
                              <input
                                type="password"
                                className="form-control"
                                onChange={(e) => setPassword(e.target.value)}
                              />
                            </div>

                            <div className="mb-3">
                              <label className="form-label">
                                Confirmar contraseña
                              </label>
                              <input
                                type="password"
                                className="form-control"
                                onChange={(e) =>
                                  setConfirmPassword(e.target.value)
                                }
                              />
                            </div>
                          </>
                        )}

                        {/* Botones */}
                        <div className="d-flex justify-content-between">
                          {isEditing ? (
                            <>
                              <button
                                className="btn btn-success"
                                onClick={handleUpdate}
                              >
                                Guardar
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={() => setIsEditing(false)}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              className="btn btn-primary w-100"
                              onClick={() => setIsEditing(true)}
                            >
                              Editar Perfil
                            </button>
                          )}
                        </div>
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
