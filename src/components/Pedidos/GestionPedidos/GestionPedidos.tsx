import { useState, useEffect } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./GestionPedidos.css";

interface Usuario {
  id: number;
  nombre: string;
  correo?: string;
  rol?: string;
  estado?: string;
}

interface Producto {
  id: number;
  nombre: string;
  costo_unit?: number;
  descripcion?: string;
}

interface Lote {
  Id: number;
  Fecha_Registro?: string;
  Cantidad?: number;
  Estado?: string;
}

interface DetailLote {
  id: number;
  id_detalle_venta: number;
  id_lote: number;
  cantidad: number;
  lote?: Lote;
}

interface Direccion {
  id: number;
  ciudad?: string;
  calle?: string;
  referencia?: string;
}

interface DetailVenta {
  id: number;
  id_venta: number;
  id_producto: number;
  cantidad: number;
  costo: number;
  product?: Producto;
  detailLotes?: DetailLote[];
}

interface Venta {
  id: number;
  id_usuario: number;
  metodo_pago: string;
  comprobante: string;
  id_direccion: number | null;
  fecha: string;
  costo_total: number;
  estado: "Cancelado" | "Entregado" | "Pendiente";
  user?: Usuario;
  direction?: Direccion | null;
  details?: DetailVenta[];
}

function GestionPedidos() {
  // Estados de filtros
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState({ start: "", end: "" });
  const [filterStatus, setFilterStatus] = useState("");

  // Estados de datos
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estados del modal de detalles
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Función para obtener ventas desde la API
  const fetchVentas = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (searchTerm) params.append("nombre_cliente", searchTerm);
      if (filterStatus) params.append("estado", filterStatus);
      if (filterDate.start) params.append("fecha_inicio", filterDate.start);
      if (filterDate.end) params.append("fecha_fin", filterDate.end);

      const response = await fetch(
        `http://127.0.0.1:8000/api/ventas?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        setVentas([]);
        setError("Error al cargar las ventas");
        return;
      }

      const data = await response.json();
      setVentas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching ventas:", err);
      setError("Error de conexión al cargar las ventas");
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener detalles de una venta específica
  const fetchVentaDetail = async (ventaId: number) => {
    setLoadingDetail(true);
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://127.0.0.1:8000/api/sells/${ventaId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        setError("Error al cargar los detalles de la venta");
        return;
      }

      const data = await response.json();
      // Normalizar estructura de la API
      const normalized = {
        ...data,
        id: data.Id,
        id_usuario: data.Id_Usuario,
        metodo_pago: data.Metodo_Pago,
        comprobante: data.Comprobante,
        id_direccion: data.Id_Direccion,
        fecha: data.Fecha,
        costo_total:
          typeof data.Costo_total === "string"
            ? parseFloat(data.Costo_total)
            : data.Costo_total,
      };
      setSelectedVenta(normalized);
    } catch (err) {
      console.error("Error fetching venta detail:", err);
      setError("Error de conexión al cargar los detalles");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Función para abrir modal de detalles
  const handleShowDetail = (venta: Venta) => {
    setShowDetailModal(true);
    fetchVentaDetail(venta.id);
  };

  // Función para cerrar modal
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedVenta(null);
  };

  // Funciones de filtrado
  const applyFilters = () => {
    setSearchTerm(searchInput.trim());
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setFilterDate({ start: "", end: "" });
    setFilterStatus("");
  };

  const handleKeyDownApply = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilters();
    }
  };

  // useEffect para cargar ventas al cambiar filtros
  useEffect(() => {
    fetchVentas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterStatus, filterDate.start, filterDate.end]);

  // Estadísticas
  const stats = {
    total: ventas.length,
    pendientes: ventas.filter((v) => v.estado === "Pendiente").length,
    entregados: ventas.filter((v) => v.estado === "Entregado").length,
    cancelados: ventas.filter((v) => v.estado === "Cancelado").length,
  };

  // Función para formatear fecha
  const formatFecha = (fecha: string) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    return (
      date.toLocaleDateString("es-PE") +
      " " +
      date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Función para formatear precio
  const formatPrice = (price: number | undefined) => {
    return (price ?? 0).toFixed(2);
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
              <div className="breadcrumb-title pe-3">Pedidos</div>
              <div className="ps-3">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0 p-0">
                    <li className="breadcrumb-item">
                      <i className="bx bx-home-alt"></i>
                    </li>
                    <li className="breadcrumb-item active">
                      Gestión de pedidos
                    </li>
                  </ol>
                </nav>
              </div>
            </div>

            {/* Cards estadísticas */}
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4">
              <div className="col">
                <div className="card radius-10 bg-gradient-cosmic">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="me-auto">
                        <p className="mb-0 text-white">Total Pedidos</p>
                        <h4 className="my-1 text-white">{stats.total}</h4>
                      </div>
                      <div>
                        <i className="bx bx-cart text-white fs-3"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="card radius-10 bg-gradient-kyoto">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="me-auto">
                        <p className="mb-0 text-white">Pendientes</p>
                        <h4 className="my-1 text-white">{stats.pendientes}</h4>
                      </div>
                      <div>
                        <i className="bx bx-time text-white fs-3"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="card radius-10 bg-gradient-ohhappiness">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="me-auto">
                        <p className="mb-0 text-white">Entregados</p>
                        <h4 className="my-1 text-white">{stats.entregados}</h4>
                      </div>
                      <div>
                        <i className="bx bx-check-circle text-white fs-3"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="card radius-10 bg-gradient-ibiza">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="me-auto">
                        <p className="mb-0 text-white">Cancelados</p>
                        <h4 className="my-1 text-white">{stats.cancelados}</h4>
                      </div>
                      <div>
                        <i className="bx bx-x-circle text-white fs-3"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla principal */}
            <div className="card radius-10">
              <div className="card-header">
                <div className="d-flex align-items-center">
                  <div>
                    <h6 className="mb-0">Gestión de Pedidos</h6>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div className="table-responsive">
                  {/* FILTROS */}
                  <div className="filtros-pedidos d-flex flex-wrap gap-3 align-items-end mb-4">
                    {/* Buscar por cliente */}
                    <div className="filtro-item flex-grow-1">
                      <label className="form-label fw-semibold text-muted mb-1">
                        Buscar cliente
                      </label>
                      <div className="input-icon-wrapper">
                        <i className="bx bx-search search-icon"></i>
                        <input
                          type="search"
                          className="form-control ps-5 radius-30"
                          placeholder="Presione 'Enter' para confirmar"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          onKeyDown={handleKeyDownApply}
                        />
                      </div>
                    </div>

                    {/* Filtrar por estado */}
                    <div className="filtro-item">
                      <label className="form-label fw-semibold text-muted mb-1">
                        Estado
                      </label>
                      <select
                        className="form-select radius-30"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="">Todos</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Entregado">Entregado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>

                    {/* Filtrar por fecha */}
                    <div className="filtro-item">
                      <label className="form-label fw-semibold text-muted mb-1">
                        Desde
                      </label>
                      <input
                        type="date"
                        className="form-control radius-30"
                        value={filterDate.start}
                        onChange={(e) =>
                          setFilterDate((prev) => ({
                            ...prev,
                            start: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="filtro-item">
                      <label className="form-label fw-semibold text-muted mb-1">
                        Hasta
                      </label>
                      <input
                        type="date"
                        className="form-control radius-30"
                        value={filterDate.end}
                        onChange={(e) =>
                          setFilterDate((prev) => ({
                            ...prev,
                            end: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Botón limpiar filtros */}
                    <div className="filtro-item">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={clearFilters}
                        title="Limpiar todos los filtros"
                      >
                        <i className="bx bx-x"></i> Limpiar
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

                  {/* Loading */}
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
                        Cargando ventas, por favor espera...
                      </div>
                    </div>
                  )}

                  {/* Sin datos */}
                  {!loading && ventas.length === 0 && (
                    <div
                      style={{
                        marginTop: "1em",
                        color: "#0d6efd",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      No hay ventas que encajen con los filtros
                    </div>
                  )}

                  {!loading && (
                    <table className="table align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>ID Venta</th>
                          <th>Cliente</th>
                          <th>Fecha</th>
                          <th>Método Pago</th>
                          <th>Total (S/)</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ventas.map((venta) => (
                          <tr key={venta.id}>
                            <td>
                              <strong>#{venta.id}</strong>
                            </td>
                            <td>
                              <span className="badge cliente-nombre">
                                {venta.user?.nombre || "Sin cliente"}
                              </span>
                            </td>
                            <td>{formatFecha(venta.fecha)}</td>
                            <td>{venta.metodo_pago}</td>
                            <td>
                              <strong>
                                S/ {formatPrice(venta.costo_total)}
                              </strong>
                            </td>
                            <td>
                              <span
                                className={`badge badge-${venta.estado.toLowerCase()}`}
                              >
                                {venta.estado}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleShowDetail(venta)}
                                title="Ver detalles"
                              >
                                <i className="bx bx-show"></i> Detalle
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE DETALLES */}
      <div
        className={`modal fade ${showDetailModal ? "show" : ""}`}
        style={{ display: showDetailModal ? "block" : "none" }}
        tabIndex={-1}
        aria-labelledby="detalleVentaModal"
        aria-hidden={!showDetailModal}
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="detalleVentaModal">
                Detalle de Venta #{selectedVenta?.id}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleCloseDetailModal}
              ></button>
            </div>

            <div className="modal-body">
              {loadingDetail ? (
                <div style={{ textAlign: "center", padding: "2em" }}>
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
                    Cargando detalles...
                  </div>
                </div>
              ) : selectedVenta ? (
                <>
                  {/* INFORMACIÓN GENERAL */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h6 className="fw-bold text-muted mb-2">
                        Información General
                      </h6>
                      <p className="mb-1">
                        <strong>ID Venta:</strong> #{selectedVenta.id}
                      </p>
                      <p className="mb-1">
                        <strong>Cliente:</strong>{" "}
                        {selectedVenta.user?.nombre || "Sin cliente"}
                      </p>
                      <p className="mb-1">
                        <strong>Email:</strong>{" "}
                        {selectedVenta.user?.correo || "N/A"}
                      </p>
                      <p className="mb-1">
                        <strong>Fecha:</strong>{" "}
                        {formatFecha(selectedVenta.fecha)}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <h6 className="fw-bold text-muted mb-2">
                        Información de Pago
                      </h6>
                      <p className="mb-1">
                        <strong>Método de Pago:</strong>{" "}
                        {selectedVenta.metodo_pago}
                      </p>
                      <p className="mb-1">
                        <strong>Comprobante:</strong>{" "}
                        {selectedVenta.comprobante}
                      </p>
                      <p className="mb-1">
                        <strong>Estado:</strong>{" "}
                        <span
                          className={`badge badge-${selectedVenta.estado.toLowerCase()}`}
                        >
                          {selectedVenta.estado}
                        </span>
                      </p>
                      <p className="mb-1">
                        <strong>Total:</strong> S/{" "}
                        {formatPrice(selectedVenta.costo_total)}
                      </p>
                    </div>
                  </div>

                  {/* DIRECCIÓN DE ENTREGA */}
                  {selectedVenta.direction && (
                    <div className="row mb-4">
                      <div className="col-md-12">
                        <h6 className="fw-bold text-muted mb-2">
                          Dirección de Entrega
                        </h6>
                        <p className="mb-1">
                          <strong>Ciudad:</strong>{" "}
                          {selectedVenta.direction.ciudad || "N/A"}
                        </p>
                        <p className="mb-1">
                          <strong>Calle:</strong>{" "}
                          {selectedVenta.direction.calle || "N/A"}
                        </p>
                        <p className="mb-1">
                          <strong>Referencia:</strong>{" "}
                          {selectedVenta.direction.referencia || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* PRODUCTOS */}
                  <div className="row">
                    <div className="col-md-12">
                      <h6 className="fw-bold text-muted mb-3">
                        Productos Comprados
                      </h6>
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered">
                          <thead className="table-light">
                            <tr>
                              <th>Producto</th>
                              <th className="text-center">Cantidad</th>
                              <th className="text-end">Costo Unit.</th>
                              <th className="text-end">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedVenta.details &&
                            selectedVenta.details.length > 0 ? (
                              selectedVenta.details.map((detail, idx) => (
                                <tr key={`${detail.id}-${idx}`}>
                                  <td>
                                    {detail.product?.nombre || "Producto"}
                                  </td>
                                  <td className="text-center">
                                    {detail.cantidad}
                                  </td>
                                  <td className="text-end">
                                    S/ {formatPrice(detail.costo)}
                                  </td>
                                  <td className="text-end fw-bold">
                                    S/{" "}
                                    {formatPrice(
                                      detail.costo * detail.cantidad,
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr key="sin-productos">
                                <td colSpan={4} className="text-center">
                                  Sin productos
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="alert alert-warning">
                  No se pudieron cargar los detalles
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseDetailModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop para el modal */}
      {showDetailModal && (
        <div
          className="modal-backdrop fade show"
          onClick={handleCloseDetailModal}
        ></div>
      )}
    </div>
  );
}

export default GestionPedidos;
