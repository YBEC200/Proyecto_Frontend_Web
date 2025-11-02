import { useState } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./GestionProductos.css";

interface Producto {
  id: string;
  nombre: string;
  marca: string;
  precio: number;
  estado: "Abastecido" | "Agotado";
  lotes: number;
  categoria: string;
  ultimoAbastecimiento: string;
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

  // Datos de ejemplo
  const productos: Producto[] = [
    {
      id: "001",
      nombre: "Laptop Dell XPS",
      marca: "Dell",
      precio: 4500.0,
      estado: "Abastecido",
      lotes: 3,
      categoria: "Laptops",
      ultimoAbastecimiento: "2023-11-01",
    },
    {
      id: "002",
      nombre: "Monitor LG 27'",
      marca: "LG",
      precio: 899.9,
      estado: "Agotado",
      lotes: 0,
      categoria: "Monitores",
      ultimoAbastecimiento: "2023-10-15",
    },
  ];

  const categorias = [
    { id: "1", nombre: "Laptops" },
    { id: "2", nombre: "Monitores" },
    { id: "3", nombre: "Accesorios" },
  ];

  // Filtros
  const filteredProducts = productos.filter((producto) => {
    const matchesSearch = producto.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !categoryFilter || producto.categoria === categoryFilter;
    const matchesStatus = !statusFilter || producto.estado === statusFilter;
    const matchesPrice =
      (!priceRange.min || producto.precio >= Number(priceRange.min)) &&
      (!priceRange.max || producto.precio <= Number(priceRange.max));
    return matchesSearch && matchesCategory && matchesStatus && matchesPrice;
  });

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
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4 gap-3 flex-wrap">
                  {/* Búsqueda y filtros */}
                  <div className="d-flex align-items-center gap-3 flex-grow-1 flex-wrap">
                    <div className="position-relative flex-grow-1">
                      <input
                        type="search"
                        className="form-control ps-5 radius-30"
                        placeholder="Buscar producto por nombre"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <span className="position-absolute top-50 product-show translate-middle-y">
                        <i className="bx bx-search"></i>
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Precio mínimo"
                        value={priceRange.min}
                        onChange={(e) =>
                          setPriceRange((prev) => ({
                            ...prev,
                            min: e.target.value,
                          }))
                        }
                      />
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Precio máximo"
                        value={priceRange.max}
                        onChange={(e) =>
                          setPriceRange((prev) => ({
                            ...prev,
                            max: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Filtros adicionales */}
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <select
                      className="form-select"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="">Todas las categorías</option>
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.nombre}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                    <select
                      className="form-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">Todos los estados</option>
                      <option value="Abastecido">Abastecido</option>
                      <option value="Agotado">Agotado</option>
                    </select>
                  </div>
                </div>

                {/* Tabla */}
                <div className="table-responsive">
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
                      {filteredProducts.map((producto) => (
                        <tr key={producto.id}>
                          <td>{producto.id}</td>
                          <td>{producto.nombre}</td>
                          <td>{producto.marca}</td>
                          <td>S/ {producto.precio.toFixed(2)}</td>
                          <td>
                            <span
                              className={`badge badge-${producto.estado.toLowerCase()}`}
                            >
                              {producto.estado}
                            </span>
                          </td>
                          <td>{producto.lotes}</td>
                          <td>{producto.categoria}</td>
                          <td>{producto.ultimoAbastecimiento}</td>
                          <td>
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleEdit(producto)}
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                            defaultValue={selectedProduct.precio}
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
                            defaultValue={selectedProduct.categoria}
                          >
                            {categorias.map((cat) => (
                              <option key={cat.id} value={cat.nombre}>
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
