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
}

export default function GestionProductos() {
  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
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
      console.log(data); // <-- Agrega esto
      setProductos(data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setProductos([]);
    }
    setLoading(false);
  };

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setCategorias([]);
    }
  };
  useEffect(() => {
    fetchCategorias();
  }, []);

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

  // Handlers
  const handleEdit = (producto: Producto) => {
    setSelectedProduct(producto);
    setShowEditModal(true);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Simulación de actualización exitosa
    setShowEditModal(false);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
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
                          placeholder="Ej. Laptop Dell XPS"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
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
                        value={priceRange.min}
                        onChange={(e) =>
                          setPriceRange({
                            ...priceRange,
                            min: e.target.value,
                          })
                        }
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
                        value={priceRange.max}
                        onChange={(e) =>
                          setPriceRange({
                            ...priceRange,
                            max: e.target.value,
                          })
                        }
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
                        <td>S/ {producto.costo_unit?.toFixed(2)}</td>
                        <td>
                          <span
                            className={`badge badge-${producto.estado?.toLowerCase()}`}
                          >
                            {producto.estado}
                          </span>
                        </td>
                        <td>{producto.lotes ?? 0}</td>
                        <td>{producto.id_categoria}</td>
                        <td>{producto.fecha_registro}</td>
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
                              onClick={() =>
                                alert(
                                  "Funcionalidad de eliminar aún no implementada"
                                )
                              }
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
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
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
                            type="text"
                            className="form-control"
                            defaultValue={selectedProduct.nombre}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Marca</label>
                          <input
                            type="text"
                            className="form-control"
                            defaultValue={selectedProduct.marca}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Precio</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            defaultValue={selectedProduct.costo_unit}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Estado</label>
                          <select
                            className="form-select"
                            defaultValue={selectedProduct.estado}
                          >
                            <option value="Abastecido">Abastecido</option>
                            <option value="Agotado">Agotado</option>
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Categoría</label>
                          <select
                            className="form-select"
                            defaultValue={selectedProduct?.id_categoria}
                            onChange={(e) => {
                              // Actualiza el estado del producto editado
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

            {/* Modal Éxito */}
            {showSuccessModal && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header bg-success text-white">
                      <h5 className="modal-title">✅ Éxito</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowSuccessModal(false)}
                      ></button>
                    </div>
                    <div className="modal-body">
                      ¡El producto se actualizó correctamente!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Error */}
            {showErrorModal && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header bg-danger text-white">
                      <h5 className="modal-title">❌ Error</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowErrorModal(false)}
                      ></button>
                    </div>
                    <div className="modal-body">
                      Hubo un error al actualizar el producto.
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
