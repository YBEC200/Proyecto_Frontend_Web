import { useState, useEffect } from "react";
import Nav from "../Layout/Nav";
import Sidebar from "../Layout/Sidebar";
import {
  getCurrentUserId,
  updateCurrentUserLoggedIn,
} from "./useUpdateCurrentUser";
import "./Usuarios.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
const API_URL = import.meta.env.VITE_API_URL;

interface Compra {
  id: number;
  total: number;
  fecha: string;
  estado: string;
}

interface Venta {
  id: number;
  total: number;
  fecha: string;
  estado: string;
  tipo_entrega: string;
}

interface UsuarioDetalle {
  id: number;
  nombre: string;
  correo: string;
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
  const currentUserId = getCurrentUserId();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [fechaRegistroFiltro, setFechaRegistroFiltro] = useState("");
  const [fechaActualizacionFiltro, setFechaActualizacionFiltro] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [appliedRoleFilter, setAppliedRoleFilter] = useState("");
  const [appliedFechaRegistroFiltro, setAppliedFechaRegistroFiltro] =
    useState("");
  const [appliedFechaActualizacionFiltro, setAppliedFechaActualizacionFiltro] =
    useState("");

  // Users data state
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  // Edit user state
  const [editNombre, setEditNombre] = useState("");
  const [editCorreo, setEditCorreo] = useState("");
  const [editRol, setEditRol] = useState("");
  const [editEstado, setEditEstado] = useState("");
  const [editError, setEditError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [ordenesLoading, setOrdenesLoading] = useState(false);
  const [usuarioDetalle, setUsuarioDetalle] = useState<UsuarioDetalle | null>(
    null,
  );
  const [ventasUsuario, setVentasUsuario] = useState<Venta[]>([]);
  // Modals para mensajes de éxito/error
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // Estado para usuarios que pueden ser eliminados (sin ventas asociadas)
  const [usuariosEliminables, setUsuariosEliminables] = useState<Set<number>>(
    new Set(),
  );
  const [createNombre, setCreateNombre] = useState("");
  const [createCorreo, setCreateCorreo] = useState("");
  const [createRol, setCreateRol] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Función para obtener usuarios desde la API con filtros
  const fetchUsuarios = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();

    if (searchTerm) params.append("nombre", searchTerm);
    if (appliedRoleFilter) params.append("rol", appliedRoleFilter);
    if (appliedFechaRegistroFiltro)
      params.append("fecha_creacion", appliedFechaRegistroFiltro);
    if (appliedFechaActualizacionFiltro)
      params.append("fecha_actualizacion", appliedFechaActualizacionFiltro);

    try {
      const response = await fetch(
        `${API_URL}/api/usuarios?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      setUsuarios(data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setUsuarios([]);
    }
    setLoading(false);
  };

  // Función para obtener las ventas de un usuario específico
  const fetchUserVentas = async (usuarioId: number) => {
    setOrdenesLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/usuarios/${usuarioId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setVentasUsuario([]);
        setUsuarioDetalle(null);
        setOrdenesLoading(false);
        return;
      }

      const data = await response.json();
      // Normalizar datos desde la API
      setUsuarioDetalle({
        id: data.usuario.id,
        nombre: data.usuario.nombre,
        correo: data.usuario.correo,
      });

      // Normalizr ventas - asegurar que total sea number
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ventasNormalizadas = (data.ventas || []).map((venta: any) => ({
        id: venta.id || venta.Id,
        total:
          typeof venta.total === "string"
            ? parseFloat(venta.total)
            : venta.total || 0,
        fecha: venta.fecha || venta.Fecha,
        estado: venta.estado || venta.Estado,
        tipo_entrega: venta.tipo_entrega || venta.Tipo_Entrega || "",
      }));
      setVentasUsuario(ventasNormalizadas);
    } catch (error) {
      console.error("Error fetching user ventas:", error);
      setVentasUsuario([]);
      setUsuarioDetalle(null);
    } finally {
      setOrdenesLoading(false);
    }
  };

  // Verificar si un usuario puede ser eliminado (sin ventas asociadas)
  const verificarEliminabilidadUsuario = async (usuarioId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/usuarios/${usuarioId}/can-delete`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      if (data.can_delete) {
        setUsuariosEliminables((prev) => new Set(prev).add(usuarioId));
      }
    } catch (error) {
      console.error("Error verificando eliminabilidad del usuario:", error);
    }
  };

  // Función para manejar la edición de usuario
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
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
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${API_URL}/api/usuarios/${selectedUser.id}/update-admin`,
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
        },
      );
      if (response.ok) {
        // Actualizar localStorage si el usuario actualizado es el usuario logueado
        updateCurrentUserLoggedIn(selectedUser.id, {
          nombre: editNombre,
          correo: editCorreo,
          rol: editRol,
          estado: editEstado,
        });

        await fetchUsuarios();
        setShowEditModal(false);
        setSuccessMessage("Usuario editado correctamente.");
        setShowSuccessModal(true);
      } else {
        setEditError("Error al actualizar el usuario.");
        setErrorMessage("Error al editar el usuario.");
        setShowErrorModal(true);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setEditError("Error de conexión.");
      setErrorMessage("Error de conexión al editar.");
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para manejar la eliminación de usuario
  const handleDeleteUser = async () => {
    if (!selectedUser || selectedUser.id === getCurrentUserId()) {
      return;
    }

    // Validación: verificar que el usuario puede ser eliminado
    if (!usuariosEliminables.has(selectedUser.id)) {
      setErrorMessage(
        "No se puede eliminar este usuario porque tiene ventas asociadas.",
      );
      setShowErrorModal(true);
      setShowDeleteModal(false);
      return;
    }

    const token = localStorage.getItem("token");
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${API_URL}/api/usuarios/${selectedUser.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (response.ok) {
        setShowDeleteModal(false);
        await fetchUsuarios();
        setSuccessMessage("Usuario eliminado correctamente.");
        setShowSuccessModal(true);
      } else {
        setShowDeleteModal(false);
        setErrorMessage("Error al eliminar el usuario.");
        setShowErrorModal(true);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setShowDeleteModal(false);
      setErrorMessage("Error de conexión al eliminar.");
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para aplicar filtros
  const applyFilters = () => {
    setSearchTerm(searchInput.trim());
    setAppliedRoleFilter(roleFilter);
    setAppliedFechaRegistroFiltro(fechaRegistroFiltro);
    setAppliedFechaActualizacionFiltro(fechaActualizacionFiltro);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setRoleFilter("");
    setAppliedRoleFilter("");
    setFechaRegistroFiltro("");
    setAppliedFechaRegistroFiltro("");
    setFechaActualizacionFiltro("");
    setAppliedFechaActualizacionFiltro("");
  };

  const handleDownloadPDF = () => {
    if (usuarios.length === 0) {
      alert("No hay usuarios para descargar");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Reporte de Usuarios", 14, 15);
    autoTable(doc, {
      head: [
        [
          "ID",
          "Nombre",
          "Correo",
          "Rol",
          "Estado",
          "Registro",
          "Actualización",
        ],
      ],
      body: usuarios.map((user) => [
        user.id,
        user.nombre,
        user.correo,
        user.rol,
        user.estado,
        formatFecha(user.created_at),
        formatFecha(user.updated_at),
      ]),
      startY: 22,
      styles: { font: "helvetica", fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [63, 81, 181], textColor: [255, 255, 255] },
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
    });
    doc.save(`usuarios_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handleDownloadExcel = () => {
    if (usuarios.length === 0) {
      alert("No hay usuarios para descargar");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      usuarios.map((user) => ({
        ID: user.id,
        Nombre: user.nombre,
        Correo: user.correo,
        Rol: user.rol,
        Estado: user.estado,
        "Fecha de Registro": formatFecha(user.created_at),
        "Fecha de Actualización": formatFecha(user.updated_at),
      })),
    );
    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 25 },
      { wch: 30 },
      { wch: 18 },
      { wch: 14 },
      { wch: 22 },
      { wch: 22 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");
    XLSX.writeFile(
      workbook,
      `usuarios_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const handleCreateUser = async () => {
    if (isCreating) return;

    if (!createNombre.trim() || !createCorreo.trim() || !createRol) {
      setErrorMessage("Completa todos los campos obligatorios.");
      setShowErrorModal(true);
      return;
    }

    setIsCreating(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/usuarios/adminstore`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          nombre: createNombre.trim(),
          correo: createCorreo.trim(),
          rol: createRol,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(result?.message || "No se pudo crear el usuario.");
        setShowErrorModal(true);
        return;
      }

      await fetchUsuarios();

      setShowCreateModal(false);
      setCreateNombre("");
      setCreateCorreo("");
      setCreateRol("");

      setSuccessMessage(
        "Usuario creado correctamente. Se le asignó una contraseña temporal y deberá cambiarla después de iniciar sesión.",
      );
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error creando usuario:", error);
      setErrorMessage("Error de conexión al crear el usuario.");
      setShowErrorModal(true);
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    // eslint-disable-next-line
  }, [
    searchTerm,
    appliedRoleFilter,
    appliedFechaRegistroFiltro,
    appliedFechaActualizacionFiltro,
  ]);

  // Verificar eliminabilidad de usuarios después de cargarlos
  useEffect(() => {
    if (usuarios.length > 0) {
      setUsuariosEliminables(new Set());
      usuarios.forEach((usuario) => {
        verificarEliminabilidadUsuario(usuario.id);
      });
    }
  }, [usuarios]);

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
            {/* Modal de Éxito */}
            {showSuccessModal && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-md">
                  <div className="modal-content">
                    <div className="modal-header bg-success text-white">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bx bx-check-circle fs-5"></i>
                        <h5 className="modal-title mb-0">Éxito</h5>
                      </div>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => setShowSuccessModal(false)}
                      ></button>
                    </div>
                    <div className="modal-body">{successMessage}</div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => setShowSuccessModal(false)}
                      >
                        <i className="bx bx-check"></i> Aceptar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Error */}
            {showErrorModal && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-md">
                  <div className="modal-content">
                    <div className="modal-header bg-danger text-white">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bx bx-x-circle fs-5"></i>
                        <h5 className="modal-title mb-0">Error</h5>
                      </div>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => setShowErrorModal(false)}
                      ></button>
                    </div>
                    <div className="modal-body">{errorMessage}</div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => setShowErrorModal(false)}
                      >
                        <i className="bx bx-x"></i> Cerrar
                      </button>
                    </div>
                  </div>
                </div>
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
                <div
                  className="d-flex align-items-center"
                  style={{
                    width: "100%",
                    justifyContent: "space-between",
                  }}
                >
                  <h6 className="mb-0">Lista de usuarios</h6>

                  <button
                    type="button"
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <i className="bx bx-user-plus"></i>
                    Crear usuario
                  </button>
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
                          placeholder="Escriba el nombre del usuario"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
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
                    <div className="col-12 d-flex justify-content-end">
                      <div className="filtro-acciones">
                        <button
                          className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                          onClick={applyFilters}
                          title="Aplicar filtros seleccionados"
                          disabled={loading}
                        >
                          <i className="bx bx-search"></i> Buscar
                        </button>
                        <button
                          className="btn btn-secondary d-flex align-items-center justify-content-center gap-2"
                          title="Limpiar filtros"
                          onClick={handleClearFilters}
                        >
                          <i className="bx bx-x"></i> Limpiar
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          title="Descargar tabla en PDF"
                          onClick={handleDownloadPDF}
                        >
                          <i className="bx bx-download"></i> PDF
                        </button>
                        <button
                          className="btn btn-outline-success"
                          title="Descargar tabla en Excel"
                          onClick={handleDownloadExcel}
                        >
                          <i className="bx bx-download"></i> Excel
                        </button>
                      </div>
                    </div>
                  </div>

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
                  {!loading && usuarios.length > 0 && (
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
                                    fetchUserVentas(user.id);
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
                                {user.id !== currentUserId && (
                                  <button
                                    className="btn-action-delete"
                                    title={
                                      usuariosEliminables.has(user.id)
                                        ? "Eliminar usuario"
                                        : "No se puede eliminar: usuario con ventas asociadas"
                                    }
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowDeleteModal(true);
                                    }}
                                    disabled={!usuariosEliminables.has(user.id)}
                                    style={{
                                      opacity: usuariosEliminables.has(user.id)
                                        ? "1"
                                        : "0.5",
                                      cursor: usuariosEliminables.has(user.id)
                                        ? "pointer"
                                        : "not-allowed",
                                    }}
                                  >
                                    <i className="bx bx-trash"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                <div className="modal-dialog modal-dialog-centered modal-md">
                  <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bx bx-edit fs-5"></i>
                        <h5 className="modal-title mb-0">Editar Usuario</h5>
                      </div>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => setShowEditModal(false)}
                      ></button>
                    </div>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
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
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Guardando...
                            </>
                          ) : (
                            "Guardar cambios"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
            {/* Modal de Crear Usuario */}
            {showCreateModal && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-md">
                  <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bx bx-user-plus fs-5"></i>
                        <h5 className="modal-title mb-0">Crear usuario</h5>
                      </div>

                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => setShowCreateModal(false)}
                        disabled={isCreating}
                      ></button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleCreateUser();
                      }}
                    >
                      <div className="modal-body">
                        <div className="mb-3">
                          <label className="form-label">Nombre</label>
                          <input
                            type="text"
                            className="form-control"
                            value={createNombre}
                            onChange={(e) => setCreateNombre(e.target.value)}
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Correo</label>
                          <input
                            type="email"
                            className="form-control"
                            value={createCorreo}
                            onChange={(e) => setCreateCorreo(e.target.value)}
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Rol</label>
                          <select
                            className="form-select"
                            value={createRol}
                            onChange={(e) => setCreateRol(e.target.value)}
                            required
                          >
                            <option value="">Seleccione un rol</option>
                            <option value="Administrador">Administrador</option>
                            <option value="Empleado">Empleado</option>
                            <option value="Cliente">Cliente</option>
                          </select>
                        </div>

                        <div className="alert alert-info d-flex align-items-start gap-2">
                          <i className="bx bx-info-circle fs-5 me-2"></i>
                          <div>
                            <strong>Estado</strong>
                            <p className="mb-0">
                              Por defecto, el usuario se creará con estado
                              "Inactivo". Podrá cambiarlo después de crear el
                              usuario.
                            </p>
                          </div>
                        </div>

                        <div className="alert alert-warning d-flex align-items-start gap-2">
                          <i className="bx bx-info-circle fs-5"></i>
                          <div>
                            <strong>Contraseña temporal</strong>
                            <p className="mb-0">
                              Se asignará una contraseña temporal por defecto.
                              El usuario deberá cambiarla después de iniciar
                              sesión.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setShowCreateModal(false)}
                          disabled={isCreating}
                        >
                          Cancelar
                        </button>

                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={isCreating}
                        >
                          {isCreating ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Creando...
                            </>
                          ) : (
                            <>
                              <i className="bx bx-user-plus me-1"></i>
                              Crear usuario
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
            {/* Modal de Órdenes */}
            {showOrdersModal && usuarioDetalle && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-lg">
                  <div className="modal-content">
                    <div className="modal-header bg-info text-white">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bx bx-receipt fs-5"></i>
                        <div>
                          <h5 className="modal-title mb-0">
                            Ventas de {usuarioDetalle.nombre}
                          </h5>
                          <small className="text-white-50">
                            {usuarioDetalle.correo}
                          </small>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => {
                          setShowOrdersModal(false);
                          setVentasUsuario([]);
                          setUsuarioDetalle(null);
                        }}
                      ></button>
                    </div>
                    <div className="modal-body">
                      {ordenesLoading ? (
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
                            Cargando ventas...
                          </div>
                        </div>
                      ) : ventasUsuario.length === 0 ? (
                        <div
                          className="alert alert-info d-flex align-items-center gap-2"
                          role="alert"
                        >
                          <i className="bx bx-info-circle fs-5"></i>
                          <div>
                            <strong>Sin ventas registradas</strong>
                            <p className="mb-0 small">
                              Este usuario aún no ha realizado ninguna compra.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>ID Venta</th>
                                <th>Total (S/)</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th>Tipo Entrega</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ventasUsuario.map((venta) => (
                                <tr key={venta.id}>
                                  <td className="fw-bold">#{venta.id}</td>
                                  <td>S/ {venta.total.toFixed(2)}</td>
                                  <td>{formatFecha(venta.fecha)}</td>
                                  <td>
                                    <span
                                      className={`badge ${
                                        venta.estado === "Entregado"
                                          ? "bg-success"
                                          : venta.estado === "Pendiente"
                                            ? "bg-warning"
                                            : "bg-danger"
                                      }`}
                                    >
                                      {venta.estado}
                                    </span>
                                  </td>
                                  <td>
                                    <small>
                                      {venta.tipo_entrega ===
                                      "Envío a Domicilio"
                                        ? "📦 Envío"
                                        : "🏪 Recojo"}
                                    </small>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowOrdersModal(false);
                          setVentasUsuario([]);
                          setUsuarioDetalle(null);
                        }}
                      >
                        <i className="bx bx-x"></i> Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Eliminación */}
            {showDeleteModal && selectedUser && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-md">
                  <div className="modal-content">
                    <div className="modal-header bg-danger text-white">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bx bx-trash fs-5"></i>
                        <h5 className="modal-title mb-0">
                          Confirmar Eliminación
                        </h5>
                      </div>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
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
                        <i className="bx bx-x"></i> Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={handleDeleteUser}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Eliminando...
                          </>
                        ) : (
                          <>
                            <i className="bx bx-trash"></i> Eliminar
                          </>
                        )}
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
