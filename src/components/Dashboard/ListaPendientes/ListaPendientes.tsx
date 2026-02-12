import { useEffect, useState, useRef } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./ListaPendientes.css";

const API_URL = import.meta.env.VITE_API_URL;

interface Usuario {
  id: number;
  nombre: string;
}

interface DetailVenta {
  id: number;
  id_producto: number;
  cantidad: number;
  costo: number;
  product?: { id: number; nombre?: string };
}

interface VentaRevision {
  id: number;
  id_usuario?: number;
  user?: Usuario;
  fecha?: string;
  costo_total?: number;
  estado?: string;
  voucher_url?: string | null;
}

function ListaPendientes() {
  const [ventas, setVentas] = useState<VentaRevision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modales y estados
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherUrl, setVoucherUrl] = useState<string | null>(null);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [ventaToApprove, setVentaToApprove] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [ventaToCancel, setVentaToCancel] = useState<number | null>(null);
  const [canceling, setCanceling] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<DetailVenta[] | null>(
    null,
  );
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  // Fetch ventas en revisión
  const fetchVentasRevision = async () => {
    setLoading(true);
    setError("");
    // Abort previous request if any
    try {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      const controller = new AbortController();
      controllerRef.current = controller;

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/ventas/revision`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
      if (!res.ok) {
        setError("Error al cargar ventas en revisión");
        setVentas([]);
        return;
      }
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized = (Array.isArray(data) ? data : []).map((it: any) => ({
        id: it.id || it.Id,
        id_usuario: it.id_usuario || it.Id_Usuario,
        user: it.user
          ? {
              id: it.user.id || it.user.Id,
              nombre: it.user.nombre || it.user.Nombre,
            }
          : undefined,
        fecha: it.Fecha || it.fecha,
        costo_total:
          typeof (it.Costo_Total || it.costo_total) === "string"
            ? parseFloat(it.Costo_Total || it.costo_total || "0")
            : Number(it.Costo_Total || it.costo_total || 0),
        estado: it.estado || it.Estado,
        voucher_url: it.voucher_url || it.Voucher_Url || null,
      }));
      setVentas(normalized);
    } catch (err) {
      // If aborted, ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any)?.name === "AbortError") return;
      console.error(err);
      setError("Error de conexión cargando ventas en revisión");
      setVentas([]);
    } finally {
      controllerRef.current = null;
      setLoading(false);
    }
  };

  // Abort controller ref to cancel inflight requests on unmount
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchVentasRevision();
  }, []);

  // Mostrar voucher
  const handleShowVoucher = (url: string | null | undefined) => {
    setVoucherUrl(url ?? null);
    setShowVoucherModal(true);
  };

  const handleCloseVoucher = () => {
    setVoucherUrl(null);
    setShowVoucherModal(false);
  };

  // Placeholder image (SVG) for broken/absent vouchers
  const IMAGE_PLACEHOLDER =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'><rect width='100%' height='100%' fill='%23f8f9fa'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23888' font-size='20'>Imagen no disponible</text></svg>";

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    const img = e.currentTarget;
    if (img && img.src !== IMAGE_PLACEHOLDER) img.src = IMAGE_PLACEHOLDER;
  };

  // Aprobar venta
  const handleOpenApprove = (id: number) => {
    setVentaToApprove(id);
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!ventaToApprove) return;
    setApproving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/ventas/${ventaToApprove}/aprobar`,
        {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        },
      );
      const result = await res.json().catch(() => null);
      if (!res.ok || !result || result.success === false) {
        alert((result && result.message) || "Error al aprobar la venta");
        setApproving(false);
        return;
      }
      // Al aprobar la venta pasa a Pendiente — quitarla de la lista
      setVentas((prev) => prev.filter((v) => v.id !== ventaToApprove));
      setShowApproveModal(false);
      setVentaToApprove(null);
    } catch (err) {
      console.error(err);
      alert("Error de conexión al aprobar la venta");
    } finally {
      setApproving(false);
    }
  };

  // Eliminar venta
  const handleOpenCancel = (id: number) => {
    setVentaToCancel(id);
    setMotivoCancelacion("");
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!ventaToCancel) return;

    if (!motivoCancelacion.trim()) {
      alert("Debes ingresar un motivo de cancelación");
      return;
    }

    setCanceling(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_URL}/api/ventas/${ventaToCancel}/cancelar`,
        {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            motivo: motivoCancelacion,
          }),
        },
      );

      const result = await res.json().catch(() => null);

      if (!res.ok || !result || result.success === false) {
        alert((result && result.message) || "Error al cancelar la venta");
        setCanceling(false);
        return;
      }

      // Remover de lista (ya no está en revisión)
      setVentas((prev) => prev.filter((v) => v.id !== ventaToCancel));

      setShowCancelModal(false);
      setVentaToCancel(null);
      setMotivoCancelacion("");
    } catch (err) {
      console.error(err);
      alert("Error de conexión al cancelar la venta");
    } finally {
      setCanceling(false);
    }
  };

  // Detalle de venta (similar a GestionPedidos mínimo)
  const handleShowDetail = async (id: number) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/ventas/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        setSelectedDetail(null);
        return;
      }
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized = (data.details || data.Details || []).map((d: any) => ({
        id: d.id || d.Id,
        id_producto: d.id_producto || d.Id_Producto,
        cantidad: d.cantidad || d.Cantidad,
        costo:
          typeof (d.costo || d.Costo) === "string"
            ? parseFloat(d.costo || d.Costo)
            : Number(d.costo || d.Costo || 0),
        product: d.product
          ? {
              id: d.product.id || d.product.Id,
              nombre: d.product.nombre || d.product.Nombre,
            }
          : undefined,
      }));
      setSelectedDetail(normalized);
    } catch (err) {
      console.error(err);
      setSelectedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedDetail(null);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-area">
        <Nav />
        <div className="page-wrapper">
          <div className="page-content">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Ventas en Revisión</h6>
                <div>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={fetchVentasRevision}
                  >
                    <i className="bx bx-refresh"></i> Refrescar
                  </button>
                </div>
              </div>
              <div className="card-body">
                {error && <div className="alert alert-danger">{error}</div>}
                {loading ? (
                  <div className="text-center py-4">
                    <div
                      className="spinner-border text-primary"
                      role="status"
                    ></div>
                    <div className="mt-2">Cargando ventas en revisión...</div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Cliente</th>
                          <th>Fecha</th>
                          <th>Total (S/)</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ventas.map((v) => (
                          <tr key={v.id}>
                            <td>#{v.id}</td>
                            <td>{v.user?.nombre || "Sin cliente"}</td>
                            <td>
                              {v.fecha
                                ? new Date(v.fecha).toLocaleString("es-PE")
                                : ""}
                            </td>
                            <td>
                              <strong>
                                S/ {(v.costo_total ?? 0).toFixed(2)}
                              </strong>
                            </td>
                            <td>
                              <span className="badge bg-warning text-dark">
                                {v.estado}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleShowDetail(v.id)}
                              >
                                <i className="bx bx-show"></i> Detalle
                              </button>
                              <button
                                className="btn btn-sm btn-success ms-2"
                                onClick={() => handleOpenApprove(v.id)}
                              >
                                <i className="bx bx-check"></i> Aprobar
                              </button>
                              <button
                                className="btn btn-sm btn-danger ms-2"
                                onClick={() => handleOpenCancel(v.id)}
                              >
                                <i className="bx bx-x-circle"></i> Cancelar
                              </button>
                              <button
                                className="btn btn-sm btn-info ms-2"
                                onClick={() => handleShowVoucher(v.voucher_url)}
                              >
                                <i className="bx bx-image"></i> Voucher
                              </button>
                            </td>
                          </tr>
                        ))}
                        {ventas.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center text-muted">
                              No hay ventas en revisión
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Voucher */}
      {showVoucherModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">Voucher enviado por el usuario</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCloseVoucher}
                ></button>
              </div>
              <div className="modal-body text-center">
                {voucherUrl ? (
                  <img
                    src={voucherUrl}
                    alt="Voucher"
                    style={{ maxWidth: "100%", height: "auto" }}
                    loading="lazy"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="alert alert-warning">
                    No hay voucher disponible
                  </div>
                )}
              </div>
              <div className="modal-footer">
                {voucherUrl && (
                  <a
                    href={voucherUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    Abrir imagen
                  </a>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={handleCloseVoucher}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aprobar */}
      {showApproveModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">Aprobar Venta</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowApproveModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  ¿Confirmas aprobar esta venta y generar su comprobante (la
                  venta pasará a estado <strong>Pendiente</strong>)?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowApproveModal(false)}
                  disabled={approving}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleConfirmApprove}
                  disabled={approving}
                >
                  {approving ? "Procesando..." : "Sí, aprobar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancelar */}
      {showCancelModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Cancelar Venta</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCancelModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  La venta pasará a estado <strong>Cancelado</strong>. El stock
                  será devuelto.
                </p>

                <div className="mb-3">
                  <label className="form-label">Motivo de cancelación</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={motivoCancelacion}
                    onChange={(e) => setMotivoCancelacion(e.target.value)}
                    placeholder="Ej: Voucher no válido, pago no verificado, etc."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCancelModal(false)}
                  disabled={canceling}
                >
                  Volver
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleConfirmCancel}
                  disabled={canceling}
                >
                  {canceling ? "Cancelando..." : "Confirmar Cancelación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {showDetailModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Detalle de Venta</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCloseDetail}
                ></button>
              </div>
              <div className="modal-body">
                {detailLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border text-primary"></div>
                  </div>
                ) : selectedDetail && selectedDetail.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Cantidad</th>
                          <th>Precio</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDetail.map((d) => (
                          <tr key={d.id}>
                            <td>
                              {d.product?.nombre || `ID ${d.id_producto}`}
                            </td>
                            <td>{d.cantidad}</td>
                            <td>S/ {Number(d.costo).toFixed(2)}</td>
                            <td>
                              S/ {(d.cantidad * Number(d.costo)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    No hay detalles disponibles
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={handleCloseDetail}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrops */}
      {(showVoucherModal ||
        showApproveModal ||
        showCancelModal ||
        showDetailModal) && (
        <div
          className="modal-backdrop fade show"
          onClick={() => {
            setShowVoucherModal(false);
            setShowApproveModal(false);
            setShowCancelModal(false);
            setShowDetailModal(false);
          }}
        ></div>
      )}
    </div>
  );
}

export default ListaPendientes;
