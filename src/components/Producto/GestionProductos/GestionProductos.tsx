import { useState, useEffect } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import VerLotes from "./VerLotes";
import "./GestionProductos.css";
import "./VerLotes.css";
const API_URL = import.meta.env.VITE_API_URL;
interface Producto {
  id: string;
  nombre: string;
  marca: string;
  costo_unit: number;
  estado: "Abastecido" | "Agotado" | "Inactivo";
  lotes: number;
  id_categoria: string;
  categoria?: { id: string; nombre: string };
  fecha_registro: string;
  ultimo_abastecimiento: string | null;
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

function formatPrice(v: number | string | undefined) {
  const n =
    typeof v === "number" ? v : Number(String(v ?? "0").replace(",", "."));
  return isNaN(n) ? "0.00" : n.toFixed(2);
}

export default function GestionProductos() {
  // Filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [searchInput, setSearchInput] = useState("");
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  // Modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Producto | null>(null);
  // Modals para mensajes de éxito/error
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // Datos de productos y categorías
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [categoriasLoaded, setCategoriasLoaded] = useState(false); // Control de carga en cola
  // Estado para mostrar lotes
  const [showLotes, setShowLotes] = useState(false);
  const [selectedProductoParaLotes, setSelectedProductoParaLotes] =
    useState<Producto | null>(null);
  const [refreshProductos, setRefreshProductos] = useState(false);
  // Estado para productos que pueden ser eliminados
  const [productosEliminables, setProductosEliminables] = useState<Set<string>>(
    new Set(),
  );

  // Obtener nombre de categoría por ID
  const getCategoryName = (idCategoria?: string) =>
    categorias.find((c) => c.id === idCategoria)?.nombre || idCategoria || "";

  // Verificar si un producto puede ser eliminado (sin lotes ni ventas)
  const verificarEliminabilidad = async (productoId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/productos/${productoId}/can-delete`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      if (data.can_delete) {
        setProductosEliminables((prev) => new Set([...prev, productoId]));
      }
    } catch (error) {
      console.error("Error verificando eliminabilidad:", error);
    }
  };

  // Fetch productos desde la API
  const fetchProductos = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();

    if (searchTerm) params.append("nombre", searchTerm);
    if (priceRange.min) params.append("precio_min", priceRange.min);
    if (priceRange.max) params.append("precio_max", priceRange.max);
    if (categoryFilter) params.append("categoria", categoryFilter);
    if (statusFilter) params.append("estado", statusFilter);

    try {
      const response = await fetch(
        `${API_URL}/api/productos?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        setProductos([]);
        return;
      }

      const data = await response.json();
      // Normalizar campos esperados en el frontend (NO solicitar lotes aquí)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized = (data || []).map((p: any) => ({
        ...p,
        // si el backend ya devuelve 'lotes' úsalo; si no, dejamos 0 por defecto
        lotes:
          typeof p.lotes !== "undefined"
            ? Number(p.lotes)
            : Number(p.lotes ?? 0),
        fecha_registro: p.fecha_registro ?? p.fechaRegistro ?? "",
        ultimo_abastecimiento:
          p.ultimo_abastecimiento ?? p.ultimoAbastecimiento ?? null,
      }));

      setProductos(normalized);
    } catch (error) {
      console.error("Error fetching productos:", error);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categorías desde la API
  const fetchCategorias = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/categorias`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setCategorias([]);
        return;
      }

      const data = await response.json();
      // Normalizar: convertir 'Id' a 'id' para consistencia
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const categoriasNormalizadas = data.map((cat: any) => ({
        id: cat.Id,
        nombre: cat.Nombre,
        descripcion: cat.Descripcion,
      }));

      setCategorias(categoriasNormalizadas);
    } catch (error) {
      console.error("Error fetching categorias:", error);
      setCategorias([]);
    }
  };

  // Aplicar filtros
  const applyFilters = () => {
    // Sólo aplicar si hay cambios (evita re-fetch innecesario)
    if (searchTerm !== searchInput.trim()) {
      setSearchTerm(searchInput.trim());
    }
    if (
      priceRange.min !== (minInput ?? "") ||
      priceRange.max !== (maxInput ?? "")
    ) {
      setPriceRange({ min: minInput ?? "", max: maxInput ?? "" });
    }
    // categoryFilter y statusFilter se mantienen como antes (si quieres, puedes hacerlos pendientes igual)
  };

  const clearFilters = () => {
    setSearchInput("");
    setMinInput("");
    setMaxInput("");
    setCategoryFilter("");
    setStatusFilter("");
    setSearchTerm("");
    setPriceRange({ min: "", max: "" });
  };

  // Aplicar filtros al presionar Enter en los inputs
  const handleKeyDownApply = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilters();
    }
  };

  // Handlers
  const handleEdit = (producto: Producto) => {
    setSelectedProduct(producto);
    setShowEditModal(true);
  };

  const handleViewLotes = (producto: Producto) => {
    setSelectedProductoParaLotes(producto);
    setShowLotes(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const nombre = String(formData.get("nombre") ?? "").trim();
    const marca = String(formData.get("marca") ?? "").trim();
    const precio = Number(String(formData.get("precio") ?? ""));
    const estado = String(formData.get("estado") ?? "");
    const id_categoria = String(formData.get("categoria") ?? "");

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${API_URL}/api/productos/${selectedProduct.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre,
            marca,
            costo_unit: precio,
            estado,
            id_categoria,
          }),
        },
      );

      const body = await res.json().catch(() => null);

      if (res.ok) {
        await fetchProductos();
        setShowEditModal(false);
        setSuccessMessage("Producto editado correctamente.");
        setShowSuccessModal(true);
      } else if (res.status === 422) {
        // Validación Laravel: mostrar los mensajes de error
        const validationMsg =
          body && typeof body === "object"
            ? Object.values(body).flat().join(" - ")
            : "Error de validación.";
        setErrorMessage(validationMsg);
        setShowErrorModal(true);
        console.error("Validation errors:", body);
      } else {
        setErrorMessage(body?.message || `Error ${res.status}`);
        setShowErrorModal(true);
        console.error("Update error:", res.status, body);
      }
      if (!res.ok) {
        const text = await res.text();
        console.error("Update error raw:", res.status, text);
        // luego intenta parsear JSON si aplica
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setErrorMessage("Error de conexión al actualizar el producto.");
      setShowErrorModal(true);
    }
  };

  // Eliminar producto (si no tiene lotes vinculados)
  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/productos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        await fetchProductos();
        setSuccessMessage("Producto eliminado correctamente.");
        setShowSuccessModal(true);
      } else if (res.status === 409) {
        // Según tu controlador: 409 cuando tiene lotes vinculados
        setErrorMessage(body?.message || "El producto tiene lotes vinculados.");
        setShowErrorModal(true);
      } else if (res.status === 404) {
        setErrorMessage(body?.message || "Producto no encontrado.");
        setShowErrorModal(true);
      } else {
        setErrorMessage(body?.message || `Error ${res.status}`);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setErrorMessage("Error de conexión al eliminar el producto.");
      setShowErrorModal(true);
    }
  };

  // Cargar categorías primero (solo una vez)
  useEffect(() => {
    const loadCategorias = async () => {
      await fetchCategorias();
      setCategoriasLoaded(true); // Marca que las categorías están cargadas
    };
    loadCategorias();
  }, []);

  // Cargar productos SOLO cuando las categorías estén listas
  useEffect(() => {
    if (categoriasLoaded) {
      fetchProductos();
    }
    // eslint-disable-next-line
  }, [
    categoriasLoaded, // Depende de que las categorías estén cargadas
    searchTerm,
    priceRange.min,
    priceRange.max,
    categoryFilter,
    statusFilter,
  ]);

  // Verificar eliminabilidad de cada producto cuando se cargan
  useEffect(() => {
    if (productos.length > 0) {
      setProductosEliminables(new Set()); // Limpiar estado anterior
      productos.forEach((p) => {
        verificarEliminabilidad(p.id);
      });
    }
  }, [productos]);

  useEffect(() => {
    if (refreshProductos) {
      fetchProductos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshProductos]);

  if (showLotes && selectedProductoParaLotes) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="main-area">
          <Nav />
          <div className="page-wrapper">
            <VerLotes
              productoId={selectedProductoParaLotes.id}
              productoNombre={selectedProductoParaLotes.nombre}
              onBack={() => {
                setShowLotes(false);
                setSelectedProductoParaLotes(null);
                // Disparar recarga de productos
                setRefreshProductos((prev) => !prev);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Recargar productos cuando cambia refreshProductos

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
              <div className="breadcrumb-title pe-3">Productos</div>
              <div className="ps-3">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0 p-0">
                    <li className="breadcrumb-item">
                      <i className="bx bx-home-alt"></i>
                    </li>
                    <li className="breadcrumb-item active">
                      Gestión de productos
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
                    <h6 className="mb-0">Gestion de Productos</h6>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <div className="filtros-productos d-flex flex-wrap gap-3 align-items-end mb-4">
                    {/* === FILTROS PRINCIPALES === */}
                    {/* Buscar */}
                    <div className="filtro-item flex-grow-1 position-relative">
                      <label className="form-label fw-semibold text-muted mb-1">
                        Buscar producto
                      </label>
                      <div className="input-icon-wrapper">
                        <i className="bx bx-search search-icon"></i>
                        <input
                          type="search"
                          className="form-control ps-5 radius-30"
                          placeholder="Presione 'Enter' para confirmar la búsqueda"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          onKeyDown={handleKeyDownApply}
                        />
                      </div>
                    </div>

                    {/* Precio mínimo */}
                    <div className="filtro-item">
                      <label className="form-label fw-semibold text-muted mb-1">
                        Precio mínimo
                      </label>
                      <input
                        type="number"
                        className="form-control radius-30"
                        placeholder="S/ mínimo"
                        value={minInput}
                        onChange={(e) => setMinInput(e.target.value)}
                        onKeyDown={handleKeyDownApply}
                      />
                    </div>

                    {/* Precio máximo */}
                    <div className="filtro-item">
                      <label className="form-label fw-semibold text-muted mb-1">
                        Precio máximo
                      </label>
                      <input
                        type="number"
                        className="form-control radius-30"
                        placeholder="S/ máximo"
                        value={maxInput}
                        onChange={(e) => setMaxInput(e.target.value)}
                        onKeyDown={handleKeyDownApply}
                      />
                    </div>

                    {/* Categoría */}
                    <div className="filtro-item">
                      <label className="form-label fw-semibold text-muted mb-1">
                        Categoría
                      </label>
                      <select
                        className="form-select radius-30"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                      >
                        <option value="">Todas</option>
                        {categorias.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Estado */}
                    <div className="filtro-item">
                      <label className="form-label fw-semibold text-muted mb-1">
                        Estado
                      </label>
                      <select
                        className="form-select radius-30"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">Todos</option>
                        <option value="Abastecido">Abastecido</option>
                        <option value="Agotado">Agotado</option>
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
                </div>

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
                      Cargando productos, por favor espera...
                    </div>
                  </div>
                )}

                {/* Tabla: sólo mostrar cuando NO está cargando */}
                {!loading && productos.length === 0 && (
                  <div
                    style={{
                      marginTop: "1em",
                      color: "#0d6efd",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    No hay productos que encajen con los filtros
                  </div>
                )}

                {!loading && (
                  /* Tabla */
                  <table className="table">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Marca</th>
                        <th>Precio</th>
                        <th>Estado</th>
                        <th>Lotes</th>
                        <th>Categoría</th>
                        <th>Último Abastecimiento</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.map((producto) => (
                        <tr key={producto.id}>
                          <td>{producto.id}</td>
                          <td>{producto.nombre}</td>
                          <td>{producto.marca}</td>
                          <td>S/ {formatPrice(producto.costo_unit)}</td>
                          <td>
                            <span
                              className={`badge badge-${producto.estado?.toLowerCase()}`}
                            >
                              {producto.estado}
                            </span>
                          </td>
                          <td>{producto.lotes ?? 0}</td>
                          <td>{getCategoryName(producto.id_categoria)}</td>
                          <td>
                            {formatFecha(
                              producto.ultimo_abastecimiento ??
                                producto.fecha_registro,
                            )}
                          </td>
                          <td>
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                className="btn-action-details"
                                onClick={() => handleViewLotes(producto)}
                                title="Ver lotes"
                              >
                                <i className="bx bx-list-ul"></i>
                              </button>
                              <button
                                className="btn-action-edit"
                                onClick={() => handleEdit(producto)}
                                title="Editar producto"
                              >
                                <i className="bx bx-edit"></i>
                              </button>

                              {/* Botón eliminar - Solo si puede ser eliminado */}
                              {productosEliminables.has(producto.id) ? (
                                <button
                                  className="btn-action-delete"
                                  onClick={() => {
                                    setDeleteTarget(producto);
                                    setShowDeleteModal(true);
                                  }}
                                  title="Eliminar producto"
                                >
                                  <i className="bx bx-trash"></i>
                                </button>
                              ) : (
                                <button
                                  className="btn-action-delete"
                                  disabled
                                  title="No se puede eliminar: producto vinculado a lotes o ventas"
                                  style={{
                                    opacity: 0.5,
                                    cursor: "not-allowed",
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
              </div>
            </div>

            {/* Modal Editar */}
            {showEditModal && selectedProduct && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-md">
                  <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                      <h5 className="modal-title">Editar Producto</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowEditModal(false)}
                      ></button>
                    </div>
                    <form onSubmit={handleUpdate}>
                      <div className="modal-body">
                        <div className="mb-3">
                          <label className="form-label">Nombre</label>
                          <input
                            name="nombre"
                            type="text"
                            className="form-control"
                            defaultValue={selectedProduct?.nombre || ""}
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Marca</label>
                          <input
                            name="marca"
                            type="text"
                            className="form-control"
                            defaultValue={selectedProduct?.marca || ""}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Precio</label>
                          <input
                            name="precio"
                            type="number"
                            step="0.01"
                            className="form-control"
                            defaultValue={selectedProduct?.costo_unit ?? ""}
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Estado</label>
                          <select
                            name="estado"
                            className="form-select"
                            defaultValue={
                              selectedProduct?.estado || "Abastecido"
                            }
                            required
                          >
                            <option>Abastecido</option>
                            <option>Agotado</option>
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Categoría</label>
                          <select
                            name="categoria"
                            className="form-select"
                            defaultValue={selectedProduct?.id_categoria}
                            onChange={(e) => {
                              setSelectedProduct({
                                ...selectedProduct!,
                                id_categoria: e.target.value,
                              });
                            }}
                          >
                            {categorias.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
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

            {/* Modal Confirmación Eliminar */}
            {showDeleteModal && deleteTarget && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-md">
                  <div className="modal-content">
                    <div className="modal-header bg-danger text-white">
                      <h5 className="modal-title">Confirmar eliminación</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => {
                          setShowDeleteModal(false);
                          setDeleteTarget(null);
                        }}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <p>
                        ¿Estás seguro de eliminar el producto{" "}
                        <strong>{deleteTarget.nombre}</strong>? Esta acción no
                        se puede deshacer.
                      </p>
                      <p className="text-muted small">
                        Si el producto tiene lotes vinculados, la eliminación
                        fallará.
                      </p>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowDeleteModal(false);
                          setDeleteTarget(null);
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={async () => {
                          if (!deleteTarget) return;
                          await handleDelete(deleteTarget.id);
                          setShowDeleteModal(false);
                          setDeleteTarget(null);
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
        </div>
      </div>
    </div>
  );
}
