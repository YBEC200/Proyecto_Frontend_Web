import { useState, useEffect } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./GestionPedidos.css";
import { QRCodeCanvas } from "qrcode.react";
const API_URL = import.meta.env.VITE_API_URL;
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
  id?: number;
  Id?: number;
  nombre?: string;
  Lote?: string;
  fecha_registro?: string;
  Fecha_Registro?: string;
  cantidad?: number;
  Cantidad?: number;
  estado?: string;
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
  tipo_entrega?: string;
  qr_token?: string;
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

  // Estados para modal de cancelación
  const [showModalCancelar, setShowModalCancelar] = useState(false);
  const [ventaACancelar, setVentaACancelar] = useState<Venta | null>(null);
  const [textoCancelacion, setTextoCancelacion] = useState("");
  const [cancelacionEnProceso, setCancelacionEnProceso] = useState(false);
  const [errorCancelacion, setErrorCancelacion] = useState("");

  // Función para obtener usuarios y crear un mapa de lookup
  const fetchUsuarios = async (): Promise<Map<number, string>> => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/usuarios`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return new Map();
      }

      const data = await response.json();

      // Crear mapa de id -> nombre
      const usuariosMap = new Map<number, string>();
      (Array.isArray(data) ? data : []).forEach((user: Usuario) => {
        usuariosMap.set(user.id, user.nombre);
      });
      return usuariosMap;
    } catch (err) {
      console.error("Error fetching usuarios:", err);
      return new Map();
    }
  };

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

      // Obtener usuarios primero para mapping
      const usuariosMap = await fetchUsuarios();

      const response = await fetch(
        `${API_URL}/api/ventas?${params.toString()}`,
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

      // Normalizar estructura de datos desde el backend
      const normalizedData = (Array.isArray(data) ? data : []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => {
          const userId = item.id_usuario || item.Id_Usuario;
          const userName = usuariosMap.get(userId) || "Sin cliente";

          return {
            id: item.id || item.Id,
            id_usuario: userId,
            metodo_pago: item.metodo_pago || item.Metodo_Pago,
            comprobante: item.comprobante || item.Comprobante,
            id_direccion: item.id_direccion || item.Id_Direccion,
            fecha: item.fecha || item.Fecha,
            costo_total:
              typeof (item.costo_total || item.Costo_total) === "string"
                ? parseFloat(item.costo_total || item.Costo_total)
                : item.costo_total || item.Costo_total,
            estado: item.estado || item.Estado,
            tipo_entrega: item.tipo_entrega || item.Tipo_Entrega,
            // Relaciones
            user: {
              id: userId,
              nombre: userName,
              correo: item.user?.correo,
            },
            direction: item.direction || null,
            details: item.details || [],
          };
        },
      );

      setVentas(normalizedData);
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

      const response = await fetch(`${API_URL}/api/ventas/${ventaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setError("Error al cargar los detalles de la venta");
        return;
      }

      const data = await response.json();

      // Normalizar estructura de la API con detalles de venta y lotes
      const normalizedDetails = (data.details || data.Details || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (detail: any) => ({
          id: detail.id || detail.Id,
          id_venta: detail.id_venta || detail.Id_Venta,
          id_producto: detail.id_producto || detail.Id_Producto,
          cantidad: detail.cantidad || detail.Cantidad,
          costo:
            typeof (detail.costo || detail.Costo) === "string"
              ? parseFloat(detail.costo || detail.Costo)
              : detail.costo || detail.Costo,
          product: detail.product
            ? {
                id: detail.product.id || detail.product.Id,
                nombre:
                  detail.product.nombre ||
                  detail.product.Nombre ||
                  detail.product.name,
                costo_unit:
                  detail.product.costo_unit ||
                  detail.product.Costo_Unit ||
                  detail.product.precio_unit,
                descripcion:
                  detail.product.descripcion ||
                  detail.product.Descripcion ||
                  detail.product.description,
              }
            : undefined,
          detailLotes: (
            detail.detailLotes ||
            detail.Detail_Lotes ||
            detail.detail_lotes ||
            []
          )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((dl: any) => ({
              id: dl.id || dl.Id,
              id_detalle_venta: dl.id_detalle_venta || dl.Id_Detalle_Venta,
              id_lote: dl.id_lote || dl.Id_Lote,
              cantidad: dl.cantidad || dl.Cantidad,
              lote: dl.lote
                ? {
                    id: dl.lote.id || dl.lote.Id,
                    nombre: dl.lote.nombre || dl.lote.Lote,
                    fecha_registro:
                      dl.lote.fecha_registro || dl.lote.Fecha_Registro,
                    cantidad: dl.lote.cantidad || dl.lote.Cantidad,
                    estado: dl.lote.estado || dl.lote.Estado,
                  }
                : undefined,
            })),
        }),
      );

      const normalized = {
        ...data,
        id: data.id || data.Id,
        id_usuario: data.id_usuario || data.Id_Usuario,
        metodo_pago: data.metodo_pago || data.Metodo_Pago,
        comprobante: data.comprobante || data.Comprobante,
        id_direccion: data.id_direccion || data.Id_Direccion,
        fecha: data.fecha || data.Fecha,
        costo_total:
          typeof (data.costo_total || data.Costo_total) === "string"
            ? parseFloat(data.costo_total || data.Costo_total)
            : data.costo_total || data.Costo_total,
        estado: data.estado || data.Estado,
        tipo_entrega: data.tipo_entrega || data.Tipo_Entrega,
        qr_token: data.qr_token || data.QR_Token,
        user: data.user
          ? {
              id: data.user.id || data.user.Id,
              nombre: data.user.nombre || data.user.Nombre || data.user.name,
              correo: data.user.correo || data.user.Correo || data.user.email,
              rol: data.user.estado || data.user.Rol,
            }
          : undefined,
        direction: data.direction
          ? {
              id: data.direction.id || data.direction.Id,
              ciudad:
                data.direction.ciudad ||
                data.direction.Ciudad ||
                data.direction.city,
              calle:
                data.direction.calle ||
                data.direction.Calle ||
                data.direction.street,
              referencia:
                data.direction.referencia ||
                data.direction.Referencia ||
                data.direction.reference,
            }
          : null,
        details: normalizedDetails,
      };
      setSelectedVenta(normalized);
      console.log("Selected Venta Details:", normalizedDetails);
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

  // Función para abrir modal de cancelación
  const handleAbrirModalCancelar = (venta: Venta) => {
    setVentaACancelar(venta);
    setTextoCancelacion("");
    setErrorCancelacion("");
    setShowModalCancelar(true);
  };

  // Función para cerrar modal de cancelación
  const handleCerrarModalCancelar = () => {
    setShowModalCancelar(false);
    setVentaACancelar(null);
    setTextoCancelacion("");
    setErrorCancelacion("");
    setCancelacionEnProceso(false);
  };

  // Función para cancelar la venta
  const handleConfirmarCancelacion = async () => {
    const textoRequerido =
      "Soy conciente que al cancelar una venta puedo comprometer datos de la empresa";

    if (textoCancelacion.trim() !== textoRequerido) {
      setErrorCancelacion(
        "El texto ingresado no coincide. Por favor verifica y vuelve a intentar.",
      );
      return;
    }

    if (!ventaACancelar) return;

    setCancelacionEnProceso(true);
    setErrorCancelacion("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/ventas/${ventaACancelar.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estado: "Cancelado",
          }),
        },
      );

      if (!response.ok) {
        setErrorCancelacion("Error al cancelar la venta. Intenta de nuevo.");
        setCancelacionEnProceso(false);
        return;
      }

      // Actualizar la lista de ventas
      setVentas((prev) =>
        prev.map((v) =>
          v.id === ventaACancelar.id ? { ...v, estado: "Cancelado" } : v,
        ),
      );

      handleCerrarModalCancelar();
    } catch (err) {
      console.error("Error cancelando venta:", err);
      setErrorCancelacion("Error de conexión. Intenta de nuevo.");
      setCancelacionEnProceso(false);
    }
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
                          <th>Tipo Entrega</th>
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
                            <td>
                              <span
                                className={`badge ${venta.tipo_entrega === "Envío a Domicilio" ? "bg-info text-dark" : "bg-secondary text-white"}`}
                              >
                                {venta.tipo_entrega === "Envío a Domicilio"
                                  ? "Envío a Domicilio"
                                  : "Recojo en Tienda"}
                              </span>
                            </td>
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
                              {venta.estado !== "Cancelado" && (
                                <button
                                  className="btn btn-sm btn-danger ms-2"
                                  onClick={() =>
                                    handleAbrirModalCancelar(venta)
                                  }
                                  title="Cancelar venta"
                                >
                                  <i className="bx bx-x-circle"></i> Cancelar
                                </button>
                              )}
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
      {showDetailModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title" id="detalleVentaModal">
                  Detalle de Venta #{selectedVenta?.id}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCloseDetailModal}
                  aria-label="Close"
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
                    {/* INFORMACIÓN GENERAL + QR LADO A LADO */}
                    <div className="row mb-4 align-items-center">
                      {/* COLUMNA IZQUIERDA: Datos */}
                      <div className="col-md-7">
                        <div className="row mb-3">
                          <div className="col-12">
                            <h6 className="fw-bold text-muted mb-2">
                              Información General
                            </h6>
                            <p className="mb-1">
                              <strong>ID Venta:</strong> #{selectedVenta.id}
                            </p>
                            <p className="mb-1">
                              <strong>Cliente:</strong>{" "}
                              {selectedVenta.user?.nombre
                                ? selectedVenta.user.nombre
                                : `Usuario ID: ${selectedVenta.id_usuario}`}
                            </p>
                            <p className="mb-1">
                              <strong>Email:</strong>{" "}
                              {selectedVenta.user?.correo || "N/A"}
                            </p>
                            <p className="mb-1">
                              <strong>Rol:</strong>{" "}
                              {selectedVenta.user?.rol || "N/A"}
                            </p>
                            <p className="mb-1">
                              <strong>Fecha:</strong>{" "}
                              {formatFecha(selectedVenta.fecha)}
                            </p>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-12">
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
                      </div>

                      {/* COLUMNA DERECHA: QR CENTRADO */}
                      {selectedVenta.estado === "Pendiente" &&
                        selectedVenta.qr_token &&
                        selectedVenta.tipo_entrega === "Envío a Domicilio" && (
                          <div className="col-md-5 d-flex flex-column align-items-center justify-content-center">
                            <div className="text-center">
                              <h6 className="fw-bold text-muted mb-3">
                                📦 QR de Validación
                              </h6>
                              <div className="p-3 bg-light rounded border">
                                <QRCodeCanvas
                                  value={selectedVenta.qr_token}
                                  size={180}
                                  bgColor="#ffffff"
                                  fgColor="#000000"
                                  level="H"
                                  includeMargin={true}
                                />
                              </div>
                              <p className="text-muted small mt-2">
                                Escanear al entregar
                              </p>
                            </div>
                          </div>
                        )}
                    </div>

                    {/* DIRECCIÓN DE ENTREGA */}
                    {selectedVenta.direction && (
                      <div className="row mb-4">
                        <div className="col-md-12">
                          <h6 className="fw-bold text-muted mb-2">
                            📍 Dirección de Entrega
                          </h6>
                          <div className="card bg-light">
                            <div className="card-body">
                              <p className="mb-2">
                                <strong>Ciudad:</strong>{" "}
                                {selectedVenta.direction.ciudad || "N/A"}
                              </p>
                              <p className="mb-2">
                                <strong>Calle:</strong>{" "}
                                {selectedVenta.direction.calle || "N/A"}
                              </p>
                              <p className="mb-0">
                                <strong>Referencia:</strong>{" "}
                                {selectedVenta.direction.referencia || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="row mt-3">
                      <div className="col-md-12">
                        <h6 className="fw-bold text-muted mb-3">
                          Detalle de Productos y Lotes
                        </h6>

                        <div className="table-responsive">
                          <table className="table table-sm table-bordered">
                            <thead className="table-light">
                              <tr>
                                <th>Producto</th>
                                <th className="text-center">Cant. Venta</th>
                                <th className="text-end">Costo Unit.</th>
                                <th className="text-end">Subtotal</th>
                                <th>Lote</th>
                                <th className="text-center">Cant. Lote</th>
                              </tr>
                            </thead>

                            <tbody>
                              {selectedVenta.details &&
                              selectedVenta.details.length > 0 ? (
                                selectedVenta.details.map((detail, idx) => {
                                  // Si el producto NO tiene lotes asociados
                                  if (
                                    !detail.detailLotes ||
                                    detail.detailLotes.length === 0
                                  ) {
                                    return (
                                      <tr key={`detalle-${idx}`}>
                                        <td>
                                          {detail.product?.nombre ||
                                            `Producto ID: ${detail.id_producto}`}
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
                                        <td
                                          colSpan={4}
                                          className="text-center text-muted"
                                        >
                                          Sin lotes asociados
                                        </td>
                                      </tr>
                                    );
                                  }

                                  // Si el producto TIENE uno o varios lotes
                                  return detail.detailLotes.map(
                                    (lote, lotIdx) => (
                                      <tr key={`detalle-${idx}-lote-${lotIdx}`}>
                                        <td>
                                          {detail.product?.nombre ||
                                            `Producto ID: ${detail.id_producto}`}
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

                                        <td>
                                          <span className="badge bg-info">
                                            {lote.lote?.nombre ||
                                              lote.lote?.Lote ||
                                              "N/A"}
                                          </span>
                                        </td>

                                        <td className="text-center">
                                          {lote.cantidad} Unid.
                                        </td>
                                      </tr>
                                    ),
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={8} className="text-center">
                                    Sin productos registrados
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
      )}

      {/* Backdrop para el modal */}
      {showDetailModal && (
        <div
          className="modal-backdrop fade show"
          onClick={handleCloseDetailModal}
        ></div>
      )}

      {/* MODAL DE CANCELACIÓN DE VENTA */}
      {showModalCancelar && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content border-danger shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i
                    className="bx bx-error-circle me-2"
                    style={{ fontSize: "1.5rem" }}
                  ></i>
                  Cancelar Venta #{ventaACancelar?.id}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCerrarModalCancelar}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body">
                <div className="alert alert-danger-light mb-4">
                  <p className="text-danger fw-bold mb-2">
                    <i className="bx bx-warning me-1"></i>
                    ⚠️ Acción irreversible
                  </p>
                  <p className="mb-0 text-danger small">
                    Al cancelar esta venta, se marcará como cancelada y se
                    comprenderán datos importantes de la empresa. Esta acción no
                    se puede deshacer.
                  </p>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold text-muted mb-2">
                    Información de la venta:
                  </h6>
                  <div className="card bg-light">
                    <div className="card-body">
                      <p className="mb-2">
                        <strong>ID Venta:</strong> #{ventaACancelar?.id}
                      </p>
                      <p className="mb-2">
                        <strong>Cliente:</strong>{" "}
                        {ventaACancelar?.user?.nombre || "Sin cliente"}
                      </p>
                      <p className="mb-2">
                        <strong>Total:</strong> S/{" "}
                        {(ventaACancelar?.costo_total ?? 0).toFixed(2)}
                      </p>
                      <p className="mb-0">
                        <strong>Estado actual:</strong>{" "}
                        <span className="badge bg-warning text-dark">
                          {ventaACancelar?.estado}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold text-danger">
                    Confirmación de cancelación:
                  </label>
                  <p className="small text-muted mb-2">
                    Escribe el siguiente texto para confirmar que entiendes las
                    implicaciones:
                  </p>
                  <div className="card border-danger bg-white mb-2">
                    <div className="card-body p-2">
                      <code
                        className="text-danger"
                        style={{ wordBreak: "break-word" }}
                      >
                        Soy conciente que al cancelar una venta puedo
                        comprometer datos de la empresa
                      </code>
                    </div>
                  </div>
                  <textarea
                    className={`form-control ${errorCancelacion ? "is-invalid" : ""}`}
                    rows={2}
                    placeholder="Pega el texto aquí para confirmar..."
                    value={textoCancelacion}
                    onChange={(e) => {
                      setTextoCancelacion(e.target.value);
                      setErrorCancelacion("");
                    }}
                    disabled={cancelacionEnProceso}
                  ></textarea>
                  {errorCancelacion && (
                    <div className="invalid-feedback d-block mt-2">
                      <i className="bx bx-x-circle me-1"></i>
                      {errorCancelacion}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCerrarModalCancelar}
                  disabled={cancelacionEnProceso}
                >
                  <i className="bx bx-x me-1"></i>
                  No, mantener venta
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmarCancelacion}
                  disabled={cancelacionEnProceso}
                >
                  {cancelacionEnProceso ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-check me-1"></i>
                      Sí, cancelar venta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop para modal de cancelación */}
      {showModalCancelar && (
        <div
          className="modal-backdrop fade show"
          onClick={handleCerrarModalCancelar}
        ></div>
      )}
    </div>
  );
}

export default GestionPedidos;
