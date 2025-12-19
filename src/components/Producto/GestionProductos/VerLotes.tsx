import { useState, useEffect } from "react";
import "./VerLotes.css";

interface Lote {
  Id: string;
  Lote: string;
  Id_Producto: string;
  Fecha_Registro: string;
  Cantidad: number;
  Estado: string;
}

interface VerLotesProps {
  productoId: string;
  productoNombre: string;
  onBack: () => void;
}

function formatFecha(fecha: string) {
  if (!fecha) return "";
  const date = new Date(fecha);
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

export default function VerLotes({
  productoId,
  productoNombre,
  onBack,
}: VerLotesProps) {
  // ...existing code...
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState<"success" | "error" | "">("");

  // inputs (controlados)
  const [searchInput, setSearchInput] = useState("");
  const [minCantidadInput, setMinCantidadInput] = useState("");
  const [maxCantidadInput, setMaxCantidadInput] = useState("");
  const [estadoFilterInput, setEstadoFilterInput] = useState("");

  // filtros aplicados (se usan para construir la query al backend)
  const [searchTerm, setSearchTerm] = useState("");
  const [cantidadRange, setCantidadRange] = useState({ min: "", max: "" });
  const [estadoFilter, setEstadoFilter] = useState("");

  // Modals y selección de lote
  const [showEditModalLote, setShowEditModalLote] = useState(false);
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [showDeleteModalLote, setShowDeleteModalLote] = useState(false);
  const [deleteTargetLote, setDeleteTargetLote] = useState<Lote | null>(null);

  // Abrir modal editar
  const handleEditLote = (lote: Lote) => {
    setSelectedLote(lote);
    setShowEditModalLote(true);
  };

  // Enviar actualización del lote
  const handleUpdateLote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLote) return;
    setMensaje("");
    setMensajeTipo("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const loteNombre = String(formData.get("Lote") ?? "").trim();
    const cantidad = Number(String(formData.get("Cantidad") ?? 0));
    const estado = String(formData.get("Estado") ?? "");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/lotes/${selectedLote.Id}`,
        {
          method: "PUT",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Lote: loteNombre,
            Cantidad: cantidad,
            Estado: estado,
          }),
        }
      );
      const body = await res.json().catch(() => null);
      if (res.ok) {
        await fetchLotes();
        setShowEditModalLote(false);
        setSelectedLote(null);
        setMensaje("Lote actualizado correctamente.");
        setMensajeTipo("success");
      } else {
        setMensaje(body?.message || `Error ${res.status}`);
        setMensajeTipo("error");
        console.error("Update lote error:", res.status, body);
      }
    } catch (error) {
      console.error("Fetch error update lote:", error);
      setMensaje("Error de conexión al actualizar el lote.");
      setMensajeTipo("error");
    }
  };

  // Abrir modal eliminar
  const handleConfirmDeleteLote = (lote: Lote) => {
    setDeleteTargetLote(lote);
    setShowDeleteModalLote(true);
  };

  // Eliminar lote
  const handleDeleteLote = async (Id: string) => {
    setMensaje("");
    setMensajeTipo("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/lotes/${Id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        await fetchLotes();
        setMensaje("Lote eliminado correctamente.");
        setMensajeTipo("success");
      } else {
        setMensaje(body?.message || `Error ${res.status}`);
        setMensajeTipo("error");
      }
    } catch (error) {
      console.error("Delete lote error:", error);
      setMensaje("Error de conexión al eliminar el lote.");
      setMensajeTipo("error");
    } finally {
      setShowDeleteModalLote(false);
      setDeleteTargetLote(null);
    }
  };

  const badgeClass = (estado?: string) => {
    if (!estado) return "badge";
    const key = estado.toLowerCase();
    if (key === "activo" || key === "abastecido")
      return "badge badge-abastecido";
    if (key === "agotado") return "badge badge-agotado";
    return "badge";
  };

  // Construir y ejecutar request al backend con parámetros
  const fetchLotes = async (signal?: AbortSignal) => {
    // no hacer nada si no hay producto seleccionado
    if (!productoId) {
      setLotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setMensaje(""); // limpiar mensaje anterior
    try {
      const params = new URLSearchParams();
      params.set("product_id", productoId);
      if (searchTerm) params.set("lote", searchTerm);
      if (cantidadRange.min) params.set("min_cantidad", cantidadRange.min);
      if (cantidadRange.max) params.set("max_cantidad", cantidadRange.max);
      if (estadoFilter) params.set("estado", estadoFilter);

      const token = localStorage.getItem("token");
      const url = `http://127.0.0.1:8000/api/lotes?${params.toString()}`;

      console.debug("fetchLotes ->", { productoId, url });

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal,
      });

      if (!response.ok) {
        if (response.status === 404) {
          setLotes([]);
          setMensaje("No se encontraron lotes.");
          setMensajeTipo("");
        } else {
          setMensaje("Error al cargar los lotes");
          setMensajeTipo("error");
          setLotes([]);
        }
        return; // retorna sin poner false aquí
      }

      const data = await response.json();
      console.debug("fetchLotes result:", data);
      setLotes(Array.isArray(data) ? data : []);
      setMensaje(""); // limpiar mensajes si fue exitoso
      setMensajeTipo("");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.log("Petición cancelada");
        return;
      }
      console.error("Error fetching lotes:", error);
      setMensaje("Error de conexión al cargar los lotes");
      setMensajeTipo("error");
      setLotes([]);
    } finally {
      setLoading(false); // ← AQUÍ siempre se pone false, una sola vez
    }
  };

  // UseEffect único: solo se ejecuta cuando hay productoId o cambian filtros
  useEffect(() => {
    if (!productoId) {
      setLotes([]);
      return;
    }
    const controller = new AbortController();
    fetchLotes(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    productoId,
    searchTerm,
    cantidadRange.min,
    cantidadRange.max,
    estadoFilter,
  ]);

  // Handler para Enter en inputs: aplica filtro correspondiente
  const handleKeyDownApply = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const name = (e.currentTarget as HTMLInputElement).name;
    if (name === "search") {
      setSearchTerm(searchInput.trim());
    } else if (name === "min") {
      setCantidadRange((prev) => ({ ...prev, min: minCantidadInput }));
    } else if (name === "max") {
      setCantidadRange((prev) => ({ ...prev, max: maxCantidadInput }));
    }
  };

  // Limpiar filtros: limpiar inputs y filtros aplicados luego recarga automática por useEffect
  const clearFilters = () => {
    setSearchInput("");
    setMinCantidadInput("");
    setMaxCantidadInput("");
    setEstadoFilterInput("");
    setSearchTerm("");
    setCantidadRange({ min: "", max: "" });
    setEstadoFilter("");
  };

  return (
    <div className="page-content">
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
        <div className="breadcrumb-title pe-3">Productos</div>
        <div className="ps-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 p-0">
              <li className="breadcrumb-item">
                <i className="bx bx-home-alt"></i>
              </li>
              <li className="breadcrumb-item">
                <button
                  className="btn btn-link p-0 text-decoration-none"
                  onClick={onBack}
                  style={{ color: "inherit" }}
                >
                  Gestión de productos
                </button>
              </li>
              <li className="breadcrumb-item active">Lotes</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Card principal (coherente con GestionProductos) */}
      <div className="card radius-10">
        <div className="card-header">
          <div className="d-flex align-items-center justify-content-between w-100">
            <div>
              <h6 className="mb-0">Lotes - {productoNombre}</h6>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={onBack}
                title="Volver"
              >
                <i className="bx bx-arrow-back"></i> Volver
              </button>
            </div>
          </div>
        </div>

        <div className="card-body">
          {/* Filtros */}
          <div className="filtros-productos d-flex flex-wrap gap-3 align-items-end mb-4">
            {/* Buscar por lote */}
            <div className="filtro-item flex-grow-1 position-relative">
              <label className="form-label fw-semibold text-muted mb-1">
                Buscar lote
              </label>
              <div className="input-icon-wrapper">
                <i className="bx bx-search search-icon"></i>
                <input
                  name="search"
                  type="search"
                  className="form-control ps-5 radius-30"
                  placeholder="Presione 'Enter' para buscar"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDownApply}
                />
              </div>
            </div>

            {/* Cantidad mínima */}
            <div className="filtro-item">
              <label className="form-label fw-semibold text-muted mb-1">
                Cantidad mín.
              </label>
              <input
                name="min"
                type="number"
                className="form-control radius-30"
                placeholder="Mínimo"
                value={minCantidadInput}
                onChange={(e) => setMinCantidadInput(e.target.value)}
                onKeyDown={handleKeyDownApply}
              />
            </div>

            {/* Cantidad máxima */}
            <div className="filtro-item">
              <label className="form-label fw-semibold text-muted mb-1">
                Cantidad máx.
              </label>
              <input
                name="max"
                type="number"
                className="form-control radius-30"
                placeholder="Máximo"
                value={maxCantidadInput}
                onChange={(e) => setMaxCantidadInput(e.target.value)}
                onKeyDown={handleKeyDownApply}
              />
            </div>

            {/* Estado */}
            <div className="filtro-item">
              <label className="form-label fw-semibold text-muted mb-1">
                Estado
              </label>
              <select
                className="form-select radius-30"
                value={estadoFilterInput}
                onChange={(e) => {
                  setEstadoFilterInput(e.target.value);
                  setEstadoFilter(e.target.value);
                }}
              >
                <option value="">Todos</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>

            {/* Botón limpiar filtros */}
            <div className="filtro-item">
              <button
                className="btn btn-outline-secondary"
                onClick={clearFilters}
                title="Limpiar filtros"
              >
                <i className="bx bx-x"></i> Limpiar
              </button>
            </div>
          </div>

          {/* SPINNER AQUÍ - FUERA de table-responsive */}
          {loading && (
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
                Cargando lotes, por favor espera...
              </div>
            </div>
          )}

          {/* TABLA SOLO SI NO ESTÁ CARGANDO */}
          {!loading && (
            <div className="table-responsive">
              <table className="table">
                <thead className="table-light">
                  <tr>
                    <th>Lote ID</th>
                    <th>Fecha Registro</th>
                    <th>Cantidad</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lotes.map((lote) => (
                    <tr key={lote.Id}>
                      <td>{lote.Lote}</td>
                      <td>{formatFecha(lote.Fecha_Registro)}</td>
                      <td>{lote.Cantidad}</td>
                      <td>
                        <span className={badgeClass(lote.Estado)}>
                          {lote.Estado}
                        </span>
                      </td>
                      <td>
                        <div className="acciones-lote">
                          <button
                            className="btn-action-edit"
                            title="Editar lote"
                            onClick={() => handleEditLote(lote)}
                          >
                            <i className="bx bx-edit"></i>
                          </button>
                          <button
                            className="btn-action-delete"
                            title="Eliminar lote"
                            onClick={() => handleConfirmDeleteLote(lote)}
                          >
                            <i className="bx bx-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {lotes.length === 0 && (
                <div
                  style={{
                    marginTop: "1em",
                    color: "#0d6efd",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  No hay lotes para este producto
                </div>
              )}

              {/* Modal Editar Lote */}
              {showEditModalLote && selectedLote && (
                <div className="modal show d-block" tabIndex={-1}>
                  <div className="modal-dialog modal-dialog-centered modal-md">
                    <div className="modal-content">
                      <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">Editar Lote</h5>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => setShowEditModalLote(false)}
                        ></button>
                      </div>
                      <form onSubmit={handleUpdateLote}>
                        <div className="modal-body">
                          <div className="mb-3">
                            <label className="form-label">Lote</label>
                            <input
                              name="Lote"
                              type="text"
                              className="form-control"
                              defaultValue={selectedLote.Lote}
                              required
                            />
                          </div>

                          <div className="mb-3">
                            <label className="form-label">Cantidad</label>
                            <input
                              name="Cantidad"
                              type="number"
                              className="form-control"
                              defaultValue={selectedLote.Cantidad}
                              required
                            />
                          </div>

                          <div className="mb-3">
                            <label className="form-label">Estado</label>
                            <select
                              name="Estado"
                              className="form-select"
                              defaultValue={selectedLote.Estado || "Activo"}
                              required
                            >
                              <option>Activo</option>
                              <option>Abastecido</option>
                              <option>Agotado</option>
                              <option>Inactivo</option>
                            </select>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowEditModalLote(false)}
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

              {/* Modal Confirmación Eliminar Lote */}
              {showDeleteModalLote && deleteTargetLote && (
                <div className="modal show d-block" tabIndex={-1}>
                  <div className="modal-dialog modal-dialog-centered modal-md">
                    <div className="modal-content">
                      <div className="modal-header bg-danger text-white">
                        <h5 className="modal-title">Confirmar eliminación</h5>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => {
                            setShowDeleteModalLote(false);
                            setDeleteTargetLote(null);
                          }}
                        ></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          ¿Estás seguro de eliminar el lote{" "}
                          <strong>{deleteTargetLote.Lote}</strong>? Esta acción
                          no se puede deshacer.
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowDeleteModalLote(false);
                            setDeleteTargetLote(null);
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={async () => {
                            if (!deleteTargetLote) return;
                            await handleDeleteLote(deleteTargetLote.Id);
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
