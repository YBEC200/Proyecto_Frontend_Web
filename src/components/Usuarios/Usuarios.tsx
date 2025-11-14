import { useState, useEffect } from "react";
import Nav from "../Layout/Nav";
import Sidebar from "../Layout/Sidebar";
import "./Usuarios.css";

interface Compra {
  id: number;
  total: number;
  fecha: string;
  estado: string;
}

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  fecha_registro: string;
  estado: string;
  created_at: string;
  updated_at: string;
  compras: Compra[];
}

function formatFecha(fecha: string) {
  if (!fecha) return "";
  const date = new Date(fecha);
  // Ejemplo: 2025-11-13 07:00:42
  return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;
}
function Usuarios() {
  // States de filtros y datos
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [fechaRegistroFiltro, setFechaRegistroFiltro] = useState("");
  const [fechaActualizacionFiltro, setFechaActualizacionFiltro] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  // Edit user state
  const [editNombre, setEditNombre] = useState("");
  const [editCorreo, setEditCorreo] = useState("");
  const [editRol, setEditRol] = useState("");
  const [editEstado, setEditEstado] = useState("");
  const [editError, setEditError] = useState("");
  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  // Modals message state
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState<"success" | "error" | "">("");

  const fetchUsuarios = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();

    if (searchTerm) params.append("nombre", searchTerm);
    if (roleFilter) params.append("rol", roleFilter);
    if (fechaRegistroFiltro)
      params.append("fecha_creacion", fechaRegistroFiltro);
    if (fechaActualizacionFiltro)
      params.append("fecha_actualizacion", fechaActualizacionFiltro);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/usuarios?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setUsuarios(data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setUsuarios([]);
    }
    setLoading(false);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setMensaje("");
    setMensajeTipo("");
    // Validaciones
    if (!editNombre.trim()) {
      setEditError("El nombre es obligatorio.");
      return;
    }
    if (!editCorreo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editCorreo)) {
      setEditError("Correo electrónico inválido.");
      return;
    }
    if (!["Administrador", "Empleado", "Cliente"].includes(editRol)) {
      setEditError("Rol inválido.");
      return;
    }
    if (!["Activo", "Inactivo"].includes(editEstado)) {
      setEditError("Estado inválido.");
      return;
    }
    if (!selectedUser) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/usuarios/${selectedUser.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: editNombre,
            correo: editCorreo,
            rol: editRol,
            estado: editEstado,
          }),
        }
      );
      if (response.ok) {
        fetchUsuarios();
        setShowEditModal(false);
        setMensaje("Usuario editado correctamente.");
        setMensajeTipo("success");
      } else {
        setEditError("Error al actualizar el usuario.");
        setMensaje("Error al editar el usuario.");
        setMensajeTipo("error");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setEditError("Error de conexión.");
      setMensaje("Error de conexión al editar.");
      setMensajeTipo("error");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setMensaje("");
    setMensajeTipo("");
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/usuarios/${selectedUser.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        setShowDeleteModal(false);
        fetchUsuarios();
        setMensaje("Usuario eliminado correctamente.");
        setMensajeTipo("success");
      } else {
        setShowDeleteModal(false);
        setMensaje("Error al eliminar el usuario.");
        setMensajeTipo("error");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setShowDeleteModal(false);
      setMensaje("Error de conexión al eliminar.");
      setMensajeTipo("error");
    }
  };

  useEffect(() => {
    fetchUsuarios();
    // eslint-disable-next-line
  }, [searchTerm, roleFilter, fechaRegistroFiltro, fechaActualizacionFiltro]);

  useEffect(() => {
    if (showEditModal && selectedUser) {
      setEditNombre(selectedUser.nombre);
      setEditCorreo(selectedUser.correo);
      setEditRol(selectedUser.rol);
      setEditEstado(selectedUser.estado);
    }
  }, [showEditModal, selectedUser]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-area">
        <Nav />
        <div className="page-wrapper">
          <div className="page-content">
            {/* Alert messages */}
            {mensaje && (
              <div
                className={`alert alert-${
                  mensajeTipo === "success" ? "success" : "danger"
                } alert-dismissible fade show`}
                role="alert"
              >
                {mensaje}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setMensaje("")}
                ></button>
              </div>
            )}
            {/* Breadcrumb */}
            <div className="page-breadcrumb d-none d-sm-flex align-items-center mb-3">
              <div className="breadcrumb-title pe-3">Usuarios</div>
              <div className="ps-3">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0 p-0">
                    <li className="breadcrumb-item">
                      <i className="bx bx-home-alt"></i>
                    </li>
                    <li className="breadcrumb-item active">
                      Lista de usuarios
                    </li>
                  </ol>
                </nav>
              </div>
            </div>

            {/* Card principal */}
            <div className="card radius-10">
              <div className="card-header">
                <div className="d-flex align-items-center">
                  <div>
                    <h6 className="mb-0">Lista de usuarios</h6>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div className="table-responsive">
                  <div className="filtros-usuarios d-flex flex-wrap gap-3 align-items-end mb-4">
                    {/* === FILTROS PRINCIPALES === */}
                    {/* Buscar */}
                    <div className="filtro-item flex-grow-1 position-relative">
                      <label className="form-label fw-semibold text-muted mb-1">
                        Buscar según nombre
                      </label>
                      <div className="input-icon-wrapper">
                        <i className="bx bx-search search-icon"></i>
                        <input
                          type="search"
                          className="form-control ps-5 radius-30"
                          placeholder="Ej. Juan Pérez"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Rol */}
                    <div className="filtro-item">
                      <label className="form-label fw-semibold text-muted mb-1">
                        Rol
                      </label>
                      <select
                        className="form-select"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                      >
                        <option value="">Todos</option>
                        <option value="Administrador">Administrador</option>
                        <option value="Empleado">Empleado</option>
                        <option value="Cliente">Cliente</option>
                      </select>
                    </div>

                    {/* Fecha de registro */}
                    <div className="filtro-item">
                      <label className="form-label fw-semibold text-muted mb-1">
                        Fecha de registro
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={fechaRegistroFiltro}
                        onChange={(e) => setFechaRegistroFiltro(e.target.value)}
                      />
                    </div>

                    {/* Última actualización */}
                    <div className="filtro-item">
                      <label className="form-label fw-semibold text-muted mb-1">
                        Última actualización
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={fechaActualizacionFiltro}
                        onChange={(e) =>
                          setFechaActualizacionFiltro(e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Nombre Completo</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Fecha de Registro</th>
                        <th>Fecha de Actualizacion</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((user) => (
                        <tr key={user.id} className="client-row">
                          <td>{user.id}</td>
                          <td className="client-name">{user.nombre}</td>
                          <td>{user.correo}</td>
                          <td className="client-role">{user.rol}</td>
                          <td className="client-estado">{user.estado}</td>
                          <td>{formatFecha(user.created_at)}</td>
                          <td>{formatFecha(user.updated_at)}</td>
                          <td>
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                className="btn-action-details"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowOrdersModal(true);
                                }}
                              >
                                <i className="bx bx-receipt"></i>
                              </button>
                              <button
                                className="btn-action-edit"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowEditModal(true);
                                }}
                              >
                                <i className="bx bx-edit"></i>
                              </button>
                              <button
                                className="btn-action-delete"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <i className="bx bx-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loading && (
                    <div style={{ textAlign: "center", padding: "2em" }}>
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                      <div
                        style={{
                          marginTop: "1em",
                          color: "#0d6efd",
                          fontWeight: "bold",
                        }}
                      >
                        Cargando usuarios, por favor espera...
                      </div>
                    </div>
                  )}
                  {!loading && usuarios.length === 0 && (
                    <div
                      style={{
                        marginTop: "1em",
                        color: "#0d6efd",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      No hay usuarios que encajen con los filtros
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Modal de Edición */}
            {showEditModal && selectedUser && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                      <h5 className="modal-title">Editar Usuario</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowEditModal(false)}
                      ></button>
                    </div>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setShowEditModal(false);
                        await handleEditUser(e);
                      }}
                    >
                      <div className="modal-body">
                        <div className="mb-3">
                          <label className="form-label">Nombre</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editNombre}
                            onChange={(e) => setEditNombre(e.target.value)}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Correo</label>
                          <input
                            type="email"
                            className="form-control"
                            value={editCorreo}
                            onChange={(e) => setEditCorreo(e.target.value)}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Rol</label>
                          <select
                            className="form-select"
                            value={editRol}
                            onChange={(e) => setEditRol(e.target.value)}
                            required
                          >
                            <option value="Administrador">Administrador</option>
                            <option value="Empleado">Empleado</option>
                            <option value="Cliente">Cliente</option>
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Estado</label>
                          <select
                            className="form-select"
                            value={editEstado}
                            onChange={(e) => setEditEstado(e.target.value)}
                            required
                          >
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                          </select>
                        </div>
                      </div>
                      {editError && (
                        <div className="alert alert-danger">{editError}</div>
                      )}
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setShowEditModal(false)}
                        >
                          Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary">
                          Guardar cambios
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
            {/* Modal de Órdenes */}
            {showOrdersModal && selectedUser && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">
                        Compras de {selectedUser.nombre}
                      </h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowOrdersModal(false)}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>ID Pedido</th>
                            <th>Total</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedUser.compras.map((compra) => (
                            <tr key={compra.id}>
                              <td>{compra.id}</td>
                              <td>S/ {compra.total.toFixed(2)}</td>
                              <td>{compra.fecha}</td>
                              <td>
                                <span
                                  className={`badge badge-${compra.estado.toLowerCase()}`}
                                >
                                  {compra.estado}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowOrdersModal(false)}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Eliminación */}
            {showDeleteModal && selectedUser && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header bg-danger text-white">
                      <h5 className="modal-title">Confirmar Eliminación</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowDeleteModal(false)}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <p>
                        ¿Estás seguro de que deseas eliminar a{" "}
                        {selectedUser.nombre}?
                      </p>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowDeleteModal(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={handleDeleteUser}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Usuarios;
