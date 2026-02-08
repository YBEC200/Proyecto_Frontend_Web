import { useState, useEffect } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./Notificaciones.css";

const API_URL = import.meta.env.VITE_API_URL;

interface Producto {
  id: number;
  nombre: string;
  estado?: string;
}

interface Lote {
  Id: number;
  Lote: string;
  Cantidad: number;
  Estado: string;
  Id_Producto?: number;
}

interface Usuario {
  id: number;
  nombre: string;
  correo?: string;
}

interface Venta {
  Id: number;
  Id_Usuario: number;
  Fecha: string;
  Costo_Total: number | string;
  estado: string;
  user?: Usuario;
}

interface Alert {
  id: number;
  tipo: "PRODUCTO" | "VENTA";
  severidad: "baja" | "media" | "alta" | "critica";
  titulo: string;
  mensaje: string;
  leida: boolean;
  user_id?: number | null;
  venta_id?: number | null;
  producto_id?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  user?: Usuario;
  producto?: Producto | null;
  venta?: Venta | null;
  lote?: Lote | null;
}

function Notificaciones() {
  const [alertas, setAlertas] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTotal, setLoadingTotal] = useState(false);
  const [error, setError] = useState("");
  const [filterTipo, setFilterTipo] = useState<"" | "PRODUCTO" | "VENTA">(
    "PRODUCTO",
  );
  const [totalAlertas, setTotalAlertas] = useState(0);
  const [filterLeida, setFilterLeida] = useState<"" | "true" | "false">("");
  const [filterSeveridad, setFilterSeveridad] = useState<
    "" | "baja" | "media" | "alta" | "critica"
  >("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alertAEliminar, setAlertAEliminar] = useState<Alert | null>(null);
  const [deletingAlert, setDeletingAlert] = useState(false);

  // Función para obtener el total de alertas
  const fetchTotalAlertas = async () => {
    setLoadingTotal(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/alerts/total-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setTotalAlertas(data.total || 0);
    } catch (err) {
      console.error("Error fetching total alertas:", err);
    } finally {
      setLoadingTotal(false);
    }
  };

  // Función para obtener alertas desde la API
  const fetchAlertas = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (filterTipo) params.append("tipo", filterTipo);
      if (filterLeida)
        params.append("leida", filterLeida === "true" ? "true" : "false");
      if (filterSeveridad) params.append("severidad", filterSeveridad);

      const response = await fetch(
        `${API_URL}/api/alerts?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        setAlertas([]);
        setError("Error al cargar las alertas");
        return;
      }

      const data = await response.json();

      // Manejar respuesta paginada (si viene en data.data)
      const alertasArray = Array.isArray(data) ? data : data.data || [];
      setAlertas(alertasArray);
    } catch (err) {
      console.error("Error fetching alertas:", err);
      setError("Error de conexión al cargar las alertas");
      setAlertas([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para marcar una alerta como leída
  const handleMarkAsRead = async (alertId: number, currentLeida: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/alerts/${alertId}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Error al marcar como leído");
        return;
      }

      // Actualizar el estado local
      setAlertas((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, leida: !currentLeida } : a,
        ),
      );
    } catch (err) {
      console.error("Error al marcar como leído:", err);
    }
  };

  // Función para marcar todas las alertas como leídas
  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/alerts/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setError("Error al marcar todas como leídas");
        return;
      }

      setAlertas((prev) => prev.map((a) => ({ ...a, leida: true })));
    } catch (err) {
      console.error("Error al marcar todas como leídas:", err);
      setError("Error de conexión");
    }
  };

  // Función para abrir modal de eliminación
  const handleOpenDeleteModal = (alert: Alert) => {
    setAlertAEliminar(alert);
    setShowDeleteModal(true);
  };

  // Función para cerrar modal de eliminación
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setAlertAEliminar(null);
  };

  // Función para eliminar una alerta
  const handleDeleteAlert = async () => {
    if (!alertAEliminar) return;

    setDeletingAlert(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/alerts/${alertAEliminar.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        setError("Error al eliminar la alerta");
        return;
      }

      setAlertas((prev) => prev.filter((a) => a.id !== alertAEliminar.id));
      handleCloseDeleteModal();
    } catch (err) {
      console.error("Error al eliminar alerta:", err);
      setError("Error al eliminar la alerta");
    } finally {
      setDeletingAlert(false);
    }
  };

  // useEffect para cargar alertas y total al montar o cambiar filtros
  useEffect(() => {
    fetchAlertas();
    fetchTotalAlertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTipo, filterLeida, filterSeveridad]);

  // Aplicar filtros a las alertas (aunque el backend ya filtra, esto es para mayor control)
  const alertasFiltradas = alertas.filter((a) => {
    if (filterTipo && a.tipo !== filterTipo) return false;
    if (filterLeida === "true" && !a.leida) return false;
    if (filterLeida === "false" && a.leida) return false;
    if (filterSeveridad && a.severidad !== filterSeveridad) return false;
    return true;
  });

  // Separar alertas filtradas por tipo
  const alertasProducto = alertasFiltradas.filter((a) => a.tipo === "PRODUCTO");
  const alertasVenta = alertasFiltradas.filter((a) => a.tipo === "VENTA");

  // Función para obtener el color principal según severidad
  const getColorBySeveridad = (severidad: string) => {
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
        return "alert-baja";
    }
  };

  // Función para obtener el ícono según severidad
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

  // Función para obtener el label de severidad
  const getSeveridadLabel = (severidad: string): string => {
    switch (severidad) {
      case "critica":
        return "Crítica";
      case "alta":
        return "Alta";
      case "media":
        return "Media";
      case "baja":
        return "Baja";
      default:
        return "Normal";
    }
  };

  // Función para formatear fecha
  const formatFecha = (fecha: string): string => {
    if (!fecha) return "";
    const date = new Date(fecha);
    return (
      date.toLocaleDateString("es-PE") +
      " " +
      date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Componente para renderizar una alerta mejorado
  const AlertCard = ({ alert }: { alert: Alert }) => (
    <div className={`alert-card ${getColorBySeveridad(alert.severidad)}`}>
      {/* Header con ícono y titulo */}
      <div className="alert-card-header">
        <div className="alert-icon">
          <i className={getIconBySeveridad(alert.severidad)}></i>
        </div>
        <div className="alert-header-content">
          <h5 className="alert-titulo">{alert.titulo}</h5>
          <div className="alert-badges">
            <span className={`badge badge-severidad badge-${alert.severidad}`}>
              {getSeveridadLabel(alert.severidad)}
            </span>
            <span className="badge badge-tipo">
              {alert.tipo === "PRODUCTO" ? "📦 Producto" : "🛒 Venta"}
            </span>
            {alert.leida && <span className="badge badge-leido">Leído</span>}
          </div>
        </div>
      </div>

      {/* Contenido del mensaje */}
      <div className="alert-card-body">
        <p className="alert-mensaje">{alert.mensaje}</p>

        {/* Información adicional según tipo */}
        <div className="alert-info-row">
          {/* Si es PRODUCTO */}
          {alert.tipo === "PRODUCTO" && alert.producto && (
            <div className="info-box">
              <div className="info-label">
                <i className="bx bx-box"></i>
                Producto Afectado
              </div>
              <div className="info-content">
                <strong>{alert.producto.nombre}</strong>
                <span
                  className={`status-badge status-${alert.producto.estado?.toLowerCase()}`}
                >
                  {alert.producto.estado || "N/A"}
                </span>
              </div>
            </div>
          )}

          {/* Si hay LOTE asociado */}
          {alert.lote && (
            <div className="info-box">
              <div className="info-label">
                <i className="bx bx-package"></i>
                Lote Relacionado
              </div>
              <div className="info-content">
                <strong>{alert.lote.Lote}</strong>
                <div className="lote-details">
                  <small>
                    Cantidad: <strong>{alert.lote.Cantidad}</strong>
                  </small>
                  <span
                    className={`status-badge status-${alert.lote.Estado?.toLowerCase()}`}
                  >
                    {alert.lote.Estado}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Si es VENTA */}
          {alert.tipo === "VENTA" && alert.venta && (
            <div className="info-box">
              <div className="info-label">
                <i className="bx bx-cart"></i>
                Venta Relacionada
              </div>
              <div className="info-content">
                <strong>Venta #{alert.venta.Id}</strong>
                <div className="venta-details">
                  <small>
                    Cliente:{" "}
                    <strong>{alert.venta.user?.nombre || "N/A"}</strong>
                  </small>
                  <small>
                    Total:{" "}
                    <strong>
                      S/{" "}
                      {parseFloat(
                        alert.venta.Costo_Total as unknown as string,
                      ).toFixed(2)}
                    </strong>
                  </small>
                  <span
                    className={`status-badge status-${alert.venta.estado?.toLowerCase()}`}
                  >
                    {alert.venta.estado}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Usuario asignado */}
          {alert.user_id && alert.user && (
            <div className="info-box">
              <div className="info-label">
                <i className="bx bx-user"></i>
                Asignado a
              </div>
              <div className="info-content">
                <strong>{alert.user.nombre}</strong>
                <small>{alert.user.correo}</small>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer con fecha */}
      <div className="alert-card-footer">
        <div className="alert-fecha">
          <i className="bx bx-calendar"></i>
          {formatFecha(alert.created_at)}
        </div>
        <div className="alert-footer-actions">
          <button
            className={`btn-read-alert ${alert.leida ? "leido" : "no-leido"}`}
            onClick={() => handleMarkAsRead(alert.id, alert.leida)}
            title={alert.leida ? "Marcar como no leído" : "Marcar como leído"}
          >
            <i
              className={`bx ${alert.leida ? "bx-check-double" : "bx-check"}`}
            ></i>
            {alert.leida ? "Leído" : "No leído"}
          </button>
          <button
            className="btn-delete-alert"
            onClick={() => handleOpenDeleteModal(alert)}
            title="Eliminar alerta"
          >
            <i className="bx bx-trash"></i>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-area">
        <Nav />
        <div className="page-wrapper">
          <div className="page-content">
            {/* Breadcrumb */}
            <div className="page-breadcrumb d-none d-sm-flex align-items-center mb-3">
              <div className="breadcrumb-title pe-3">Dashboard</div>
              <div className="ps-3">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0 p-0">
                    <li className="breadcrumb-item">
                      <i className="bx bx-home-alt"></i>
                    </li>
                    <li className="breadcrumb-item active">
                      Notificaciones y alertas
                    </li>
                  </ol>
                </nav>
              </div>
            </div>

            {/* Card principal */}
            <div className="card radius-10">
              <div className="card-header">
                <div className="d-flex align-items-center justify-content-between w-100">
                  {/* Título: izquierda */}
                  <h6 className="mb-0">Notificaciones y alertas</h6>

                  {/* Contador: extremo derecho */}
                  {loadingTotal ? (
                    <span className="badge bg-primary rounded-pill px-3 py-2">
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Contando...
                    </span>
                  ) : (
                    <span className="badge bg-primary rounded-pill px-3 py-2">
                      Total: {totalAlertas === 0 ? "ninguna" : totalAlertas}
                    </span>
                  )}
                </div>
              </div>

              <div className="card-body">
                {/* FILTROS */}
                <div className="filtros-alertas d-flex flex-wrap gap-3 align-items-end mb-4 w-100">
                  {/* Filtro por tipo */}
                  <div className="filtro-item">
                    <label className="form-label fw-semibold text-muted">
                      Tipo de Alerta
                    </label>
                    <select
                      className="form-select radius-30"
                      value={filterTipo}
                      onChange={(e) =>
                        setFilterTipo(
                          e.target.value as "" | "PRODUCTO" | "VENTA",
                        )
                      }
                    >
                      <option value="">Todas</option>
                      <option value="PRODUCTO">📦 Productos</option>
                      <option value="VENTA">🛒 Ventas</option>
                    </select>
                  </div>

                  {/* Filtro por estado leída */}
                  <div className="filtro-item">
                    <label className="form-label fw-semibold text-muted">
                      Estado
                    </label>
                    <select
                      className="form-select radius-30"
                      value={filterLeida}
                      onChange={(e) =>
                        setFilterLeida(e.target.value as "" | "true" | "false")
                      }
                    >
                      <option value="">Todas</option>
                      <option value="false">No leídas</option>
                      <option value="true">Leídas</option>
                    </select>
                  </div>

                  {/* Filtro por severidad */}
                  <div className="filtro-item">
                    <label className="form-label fw-semibold text-muted">
                      Severidad
                    </label>
                    <select
                      className="form-select radius-30"
                      value={filterSeveridad}
                      onChange={(e) =>
                        setFilterSeveridad(
                          e.target.value as
                            | ""
                            | "baja"
                            | "media"
                            | "alta"
                            | "critica",
                        )
                      }
                    >
                      <option value="">Todas</option>
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                      <option value="critica">Crítica</option>
                    </select>
                  </div>

                  {/* Botón limpiar filtros */}
                  <div className="filtro-item">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setFilterTipo("PRODUCTO");
                        setFilterLeida("");
                        setFilterSeveridad("");
                      }}
                      title="Limpiar todos los filtros"
                    >
                      <i className="bx bx-x"></i> Limpiar
                    </button>
                  </div>

                  {/* Botón marcar todas como leídas */}
                  <div className="filtro-item filtro-item-spacer">
                    <button
                      className="btn btn-success btn-mark-all-read"
                      onClick={handleMarkAllAsRead}
                      title="Marcar todas las alertas como leídas"
                    >
                      <i className="bx bx-check-double"></i> Marcar todo leído
                    </button>
                  </div>
                </div>

                {/* Mensaje de error */}
                {error && (
                  <div
                    className="alert alert-danger alert-dismissible fade show"
                    role="alert"
                  >
                    {error}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setError("")}
                    ></button>
                  </div>
                )}

                {/* Spinner de carga */}
                {loading && (
                  <div style={{ textAlign: "center", padding: "3em" }}>
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <div
                      style={{
                        marginTop: "1em",
                        color: "#0d6efd",
                        fontWeight: "bold",
                      }}
                    >
                      Cargando alertas, por favor espera...
                    </div>
                  </div>
                )}

                {/* Sin datos */}
                {!loading && alertasFiltradas.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2em",
                      color: "#6c757d",
                    }}
                  >
                    <i className="bx bx-inbox" style={{ fontSize: "3em" }}></i>
                    <p className="mt-3">
                      {alertas.length === 0
                        ? "No hay alertas en este momento"
                        : "No hay alertas que coincidan con los filtros seleccionados"}
                    </p>
                  </div>
                )}

                {/* Alertas de PRODUCTO */}
                {!loading && alertasProducto.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-3">
                      <h5 className="text-muted">
                        <i className="bx bx-package me-2"></i>
                        Alertas de Producto ({alertasProducto.length})
                      </h5>
                      <hr />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                      }}
                    >
                      {alertasProducto.map((alert) => (
                        <AlertCard key={alert.id} alert={alert} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Alertas de VENTA */}
                {!loading && alertasVenta.length > 0 && (
                  <div>
                    <div className="mb-3">
                      <h5 className="text-muted">
                        <i className="bx bx-cart me-2"></i>
                        Alertas de Venta ({alertasVenta.length})
                      </h5>
                      <hr />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                      }}
                    >
                      {alertasVenta.map((alert) => (
                        <AlertCard key={alert.id} alert={alert} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE ELIMINACIÓN */}
      {showDeleteModal && alertAEliminar && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-danger shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bx bx-error-circle me-2"></i>
                  Confirmar eliminación
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCloseDeleteModal}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body">
                <div className="alert alert-danger-light mb-3">
                  <p className="text-danger fw-bold mb-2">
                    <i className="bx bx-warning me-1"></i>
                    ⚠️ Esta acción es irreversible
                  </p>
                  <p className="mb-0 text-danger small">
                    ¿Estás seguro de que deseas eliminar esta alerta? No se
                    puede deshacer esta acción.
                  </p>
                </div>

                <div className="card bg-light">
                  <div className="card-body">
                    <p className="mb-2">
                      <strong>Título:</strong> {alertAEliminar.titulo}
                    </p>
                    <p className="mb-2">
                      <strong>Tipo:</strong> {alertAEliminar.tipo}
                    </p>
                    <p className="mb-0">
                      <strong>Severidad:</strong>{" "}
                      <span
                        className={`badge badge-${alertAEliminar.severidad}`}
                      >
                        {alertAEliminar.severidad.charAt(0).toUpperCase() +
                          alertAEliminar.severidad.slice(1)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseDeleteModal}
                  disabled={deletingAlert}
                >
                  <i className="bx bx-x me-1"></i>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteAlert}
                  disabled={deletingAlert}
                >
                  {deletingAlert ? (
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
                      <i className="bx bx-trash me-1"></i>
                      Sí, eliminar alerta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop para modal de eliminación */}
      {showDeleteModal && (
        <div
          className="modal-backdrop fade show"
          onClick={handleCloseDeleteModal}
        ></div>
      )}
    </div>
  );
}

export default Notificaciones;
