import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./Perfil.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface UserData {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
}

export default function Perfil() {
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    id: 0,
    nombre: "Usuario",
    correo: "usuario@example.com",
    rol: "Administrador",
  });
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  // Prefill formData when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setFormData({
        nombre: userData.nombre,
        correo: userData.correo,
      });
    } else {
      setFormData({});
    }
  }, [isEditing, userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async () => {
    // Solo enviar nombre y correo (no password desde aquí)
    try {
      // Validación mínima en cliente
      const nombre = String(formData.nombre ?? "").trim();
      const correo = String(formData.correo ?? "").trim();

      if (!nombre) {
        setErrorMessage("El nombre es obligatorio.");
        setShowErrorModal(true);
        return;
      }

      if (!correo) {
        setErrorMessage("El correo es obligatorio.");
        setShowErrorModal(true);
        return;
      }

      // Construir payload con solo campos cambiados respecto a userData
      const dataToSend = {
        nombre,
        correo,
      };

      if (Object.keys(dataToSend).length === 0) {
        alert("No hay cambios para actualizar.");
        return;
      }

      const token = localStorage.getItem("token") || "";

      setSaving(true);

      const response = await fetch(`${API_URL}/api/usuarios/${userData.id}`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      // Intentar leer JSON (si hay body)
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 422 && result?.errors) {
          const firstErrorField = Object.keys(result.errors)[0];
          const firstErrorMsg = result.errors[firstErrorField][0];

          setErrorMessage(firstErrorMsg);
        } else {
          setErrorMessage(
            result?.message || `Error al actualizar (${response.status}).`,
          );
        }

        setShowErrorModal(true);
        return;
      }
      // Si el backend devuelve el usuario actualizado en result.usuario o result.data, úsalo
      const updatedFromServer = result?.usuario ?? result?.data ?? result;
      const updatedUser = {
        ...userData,
        ...dataToSend,
        ...(typeof updatedFromServer === "object" ? updatedFromServer : {}),
      };

      setUserData(updatedUser as UserData);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setIsEditing(false);
      setFormData({});
      setUserData(updatedUser as UserData);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setIsEditing(false);
      setFormData({});
      setShowSuccessModal(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error actualizando usuario:", error);

      if (error?.message?.includes("Failed to fetch")) {
        setErrorMessage(
          "Error de conexión. Revisa que el backend esté funcionando.",
        );
        setShowErrorModal(true);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-area">
        <Nav />
        <div className="page-wrapper">
          <div className="page-content">
            {/* Modal de actualización exitosa */}
            {showSuccessModal && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-md">
                  <div className="modal-content">
                    <div className="modal-header bg-success text-white">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bx bx-check-circle fs-5"></i>
                        <h5 className="modal-title mb-0">Datos actualizados</h5>
                      </div>

                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => setShowSuccessModal(false)}
                      ></button>
                    </div>

                    <div className="modal-body">
                      <p className="mb-3">
                        Tus datos fueron actualizados correctamente.
                      </p>

                      <div className="alert alert-success mb-0">
                        <p className="mb-2">
                          <strong>Nuevo nombre:</strong> {userData.nombre}
                        </p>
                        <p className="mb-0">
                          <strong>Nuevo correo:</strong> {userData.correo}
                        </p>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => setShowSuccessModal(false)}
                      >
                        <i className="bx bx-check me-1"></i>
                        Aceptar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de error */}
            {showErrorModal && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-md">
                  <div className="modal-content">
                    <div className="modal-header bg-danger text-white">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bx bx-error-circle fs-5"></i>
                        <h5 className="modal-title mb-0">
                          No se pudieron actualizar los datos
                        </h5>
                      </div>

                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => setShowErrorModal(false)}
                      ></button>
                    </div>

                    <div className="modal-body">
                      <p className="mb-0">{errorMessage}</p>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => setShowErrorModal(false)}
                      >
                        <i className="bx bx-x me-1"></i>
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                              value={String(formData.nombre ?? "")}
                              onChange={handleChange}
                              disabled={saving}
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
                              value={String(formData.correo ?? "")}
                              onChange={handleChange}
                              disabled={saving}
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

                        {/* Botones */}
                        <div className="d-flex justify-content-between">
                          {isEditing ? (
                            <>
                              <button
                                className="btn btn-success"
                                onClick={handleUpdate}
                                disabled={saving}
                              >
                                {saving ? "Guardando..." : "Guardar"}
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={() => {
                                  setIsEditing(false);
                                  setFormData({});
                                }}
                                disabled={saving}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <div style={{ width: "100%" }}>
                              <button
                                className="btn btn-primary w-100"
                                onClick={() => setIsEditing(true)}
                              >
                                Editar Perfil
                              </button>

                              {/* Botón para cambio de contraseña — abrir modal/route aparte */}
                              <button
                                className="btn btn-outline-secondary w-100 mt-2"
                                onClick={() =>
                                  alert(
                                    "Para cambiar la contraseña usa la opción 'Cambiar contraseña' (implementa modal o página separada).",
                                  )
                                }
                              >
                                Cambiar contraseña
                              </button>
                            </div>
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
