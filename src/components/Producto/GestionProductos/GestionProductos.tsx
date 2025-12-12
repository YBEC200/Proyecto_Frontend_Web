import { useState, useEffect } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./GestionProductos.css";

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
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState<"success" | "error" | "">("");
  // Datos de productos y categorías
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Obtener nombre de categoría por ID
  const getCategoryName = (idCategoria?: string) =>
    categorias.find((c) => c.id === idCategoria)?.nombre || idCategoria || "";

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
        `http://127.0.0.1:8000/api/productos?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();

      // Normalizar campos esperados en el frontend
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized = (data || []).map((p: any) => ({
        ...p,
        lotes: Number(p.lotes ?? 0),
        fecha_registro: p.fecha_registro ?? p.fechaRegistro ?? "",
        ultimo_abastecimiento:
          p.ultimo_abastecimiento ?? p.ultimoAbastecimiento ?? null,
      }));

      setProductos(normalized);
      /* eslint-disable @typescript-eslint/no-unused-vars */
    } catch (error) {
      setProductos([]);
    }
    setLoading(false);
  };

  // Fetch categorías desde la API
  const fetchCategorias = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/categorias`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setCategorias(data);
      /* eslint-disable @typescript-eslint/no-unused-vars */
    } catch (error) {
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

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setMensaje("");
    setMensajeTipo("");

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
        `http://127.0.0.1:8000/api/productos/${selectedProduct.id}`,
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
        }
      );

      const body = await res.json().catch(() => null);

      if (res.ok) {
        await fetchProductos();
        setShowEditModal(false);
        setMensaje("Producto editado correctamente.");
        setMensajeTipo("success");
      } else if (res.status === 422) {
        // Validación Laravel: mostrar los mensajes de error
        const validationMsg =
          body && typeof body === "object"
            ? Object.values(body).flat().join(" - ")
            : "Error de validación.";
        setMensaje(validationMsg);
        setMensajeTipo("error");
        console.error("Validation errors:", body);
      } else {
        setMensaje(body?.message || `Error ${res.status}`);
        setMensajeTipo("error");
        console.error("Update error:", res.status, body);
      }
      if (!res.ok) {
        const text = await res.text();
        console.error("Update error raw:", res.status, text);
        // luego intenta parsear JSON si aplica
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMensaje("Error de conexión al actualizar el producto.");
      setMensajeTipo("error");
    }
  };

  // Eliminar producto (si no tiene lotes vinculados)
  const handleDelete = async (id: string) => {
    setMensaje("");
    setMensajeTipo("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/productos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        await fetchProductos();
        setMensaje("Producto eliminado correctamente.");
        setMensajeTipo("success");
      } else if (res.status === 409) {
        // Según tu controlador: 409 cuando tiene lotes vinculados
        setMensaje(body?.message || "El producto tiene lotes vinculados.");
        setMensajeTipo("error");
      } else if (res.status === 404) {
        setMensaje(body?.message || "Producto no encontrado.");
        setMensajeTipo("error");
      } else {
        setMensaje(body?.message || `Error ${res.status}`);
        setMensajeTipo("error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setMensaje("Error de conexión al eliminar el producto.");
      setMensajeTipo("error");
    } finally {
      setTimeout(() => {
        setMensaje("");
        setMensajeTipo("");
      }, 4000);
    }
  };

  useEffect(() => {
    fetchProductos();
    // eslint-disable-next-line
  }, [
    searchTerm,
    priceRange.min,
    priceRange.max,
    categoryFilter,
    statusFilter,
  ]);

  useEffect(() => {
    fetchCategorias();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-area">
        <Nav />
        <div className="page-wrapper">
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
                  </div>
                </div>

                {/* Tabla */}

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
                              producto.fecha_registro
                          )}
                        </td>
                        <td>
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              className="btn-action-edit"
                              onClick={() => handleEdit(producto)}
                            >
                              <i className="bx bx-edit"></i>
                            </button>
                            <button
                              className="btn-action-delete"
                              onClick={() => {
                                setDeleteTarget(producto);
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
                            name="nombre" // <-- AQUI: name
                            type="text"
                            className="form-control"
                            defaultValue={selectedProduct?.nombre || ""}
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Marca</label>
                          <input
                            name="marca" // <-- AQUI
                            type="text"
                            className="form-control"
                            defaultValue={selectedProduct?.marca || ""}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Precio</label>
                          <input
                            name="precio" // <-- AQUI
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
                            name="estado" // <-- AQUI
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
