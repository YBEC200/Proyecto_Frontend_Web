import React, { useState } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./GestionLotes.css";

interface Categoria {
  id: string;
  nombre: string;
  descripcion: string;
}

interface Lote {
  id: string;
  nombre: string;
  productoId: string;
  cantidad: number;
  fechaRegistro: string;
}

interface Producto {
  id: string;
  nombre: string;
}

/* Tipado mínimo para lo que usamos de Bootstrap (evita `any` y el import de tipos) */
interface BsModalInstance {
  show(): void;
  hide(): void;
}
interface BootstrapLike {
  Modal: {
    new (el: Element): BsModalInstance;
    getInstance(el: Element): BsModalInstance | null;
  };
}

export default function GestionLotes() {
  // Estados
  const [categoriaSearch, setCategoriaSearch] = useState("");
  const [loteSearch, setLoteSearch] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(
    null
  );
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);

  // Datos de ejemplo
  const categorias: Categoria[] = [
    { id: "1", nombre: "Laptops", descripcion: "Computadoras portátiles" },
    { id: "2", nombre: "Monitores", descripcion: "Pantallas de computadora" },
  ];

  const productos: Producto[] = [
    { id: "1", nombre: "Laptop Dell XPS" },
    { id: "2", nombre: "Monitor LG 27'" },
    { id: "3", nombre: "Laptop HP Pavilion" },
  ];

  const lotes: Lote[] = [
    {
      id: "1",
      nombre: "LOTE001",
      productoId: "1",
      cantidad: 10,
      fechaRegistro: "2023-11-01",
    },
    {
      id: "2",
      nombre: "LOTE002",
      productoId: "2",
      cantidad: 15,
      fechaRegistro: "2023-11-01",
    },
  ];

  // Helper tipado seguro para acceder a window.bootstrap (evita 'any')
  const getBootstrap = (): BootstrapLike | undefined => {
    const w = window as unknown as { bootstrap?: unknown };
    return w.bootstrap as BootstrapLike | undefined;
  };

  // Handlers para abrir modal en modo edición (rellena selected*)
  const handleEditCategoria = (categoria: Categoria) => {
    setIsEditing(true);
    setSelectedCategoria(categoria);
    const bs = getBootstrap();
    const modalEl = document.getElementById("categoriaModal");
    if (bs && modalEl) {
      const modal = new bs.Modal(modalEl);
      modal.show();
    } else if (modalEl) {
      // fallback: add 'show' class (very basic) if bootstrap not loaded
      modalEl.classList.add("show", "d-block");
    }
  };

  const handleEditLote = (lote: Lote) => {
    setIsEditing(true);
    setSelectedLote(lote);
    const bs = getBootstrap();
    const modalEl = document.getElementById("loteModal");
    if (bs && modalEl) {
      const modal = new bs.Modal(modalEl);
      modal.show();
    } else if (modalEl) {
      modalEl.classList.add("show", "d-block");
    }
  };

  // Handlers de submit (simulados)
  const handleAddCategoria = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      setIsEditing(false);
      setSelectedCategoria(null);
      const bs = getBootstrap();
      const el = document.getElementById("categoriaModal");
      if (bs && el) {
        const instance = bs.Modal.getInstance(el);
        instance?.hide();
      } else if (el) {
        el.classList.remove("show", "d-block");
      }
    }, 1000);
  };

  const handleAddLote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      setIsEditing(false);
      setSelectedLote(null);
      const bs = getBootstrap();
      const el = document.getElementById("loteModal");
      if (bs && el) {
        const instance = bs.Modal.getInstance(el);
        instance?.hide();
      } else if (el) {
        el.classList.remove("show", "d-block");
      }
    }, 1000);
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
              <div className="breadcrumb-title pe-3">
                Agregar Categoría o Lote
              </div>
              <div className="ps-3">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0 p-0">
                    <li className="breadcrumb-item">
                      <i className="bx bx-home-alt"></i>
                    </li>
                    <li className="breadcrumb-item active">
                      Gestión de Categorías y Lotes
                    </li>
                  </ol>
                </nav>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between mb-4 flex-wrap">
                  {/* Sección Categorías */}
                  <div className="flex-fill me-3 mb-3">
                    <div className="d-flex justify-content-between mb-3">
                      <div>
                        <label className="fw-bold">Buscar Categoría</label>
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Buscar categoría"
                          value={categoriaSearch}
                          onChange={(e) => setCategoriaSearch(e.target.value)}
                        />
                      </div>
                      <button
                        className="btn btn-primary"
                        data-bs-toggle="modal"
                        data-bs-target="#categoriaModal"
                        onClick={() => {
                          setIsEditing(false);
                          setSelectedCategoria(null);
                        }}
                      >
                        Agregar Nueva Categoría
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table className="table">
                        <thead className="table-light">
                          <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categorias
                            .filter((cat) =>
                              cat.nombre
                                .toLowerCase()
                                .includes(categoriaSearch.toLowerCase())
                            )
                            .map((categoria) => (
                              <tr key={categoria.id}>
                                <td>{categoria.id}</td>
                                <td>{categoria.nombre}</td>
                                <td>
                                  <div className="d-flex justify-content-center gap-2">
                                    <button
                                      className="btn btn-warning btn-sm"
                                      onClick={() =>
                                        handleEditCategoria(categoria)
                                      }
                                    >
                                      Editar
                                    </button>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => {
                                        setErrorMessage(
                                          "No se puede eliminar una categoría con productos asociados"
                                        );
                                        setShowErrorModal(true);
                                      }}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="custom-divider"></div>

                  {/* Sección Lotes */}
                  <div className="flex-fill ms-3 mb-3">
                    <div className="d-flex justify-content-between mb-3">
                      <div>
                        <label className="fw-bold">Buscar Lote</label>
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Buscar lote o producto"
                          value={loteSearch}
                          onChange={(e) => setLoteSearch(e.target.value)}
                        />
                      </div>
                      <button
                        className="btn btn-primary"
                        data-bs-toggle="modal"
                        data-bs-target="#loteModal"
                        onClick={() => {
                          setIsEditing(false);
                          setSelectedLote(null);
                        }}
                      >
                        Agregar Nuevo Lote
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table className="table">
                        <thead className="table-light">
                          <tr>
                            <th>ID</th>
                            <th>Lote</th>
                            <th>Producto</th>
                            <th>Fecha Registro</th>
                            <th>Cantidad</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lotes
                            .filter(
                              (lote) =>
                                lote.nombre
                                  .toLowerCase()
                                  .includes(loteSearch.toLowerCase()) ||
                                productos
                                  .find((p) => p.id === lote.productoId)
                                  ?.nombre.toLowerCase()
                                  .includes(loteSearch.toLowerCase())
                            )
                            .map((lote) => (
                              <tr key={lote.id}>
                                <td>{lote.id}</td>
                                <td>{lote.nombre}</td>
                                <td>
                                  {
                                    productos.find(
                                      (p) => p.id === lote.productoId
                                    )?.nombre
                                  }
                                </td>
                                <td>{lote.fechaRegistro}</td>
                                <td>{lote.cantidad}</td>
                                <td>
                                  <div className="d-flex justify-content-center gap-2">
                                    <button
                                      className="btn btn-warning btn-sm"
                                      onClick={() => handleEditLote(lote)}
                                    >
                                      Editar
                                    </button>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => {
                                        setShowSuccessModal(true);
                                        setTimeout(
                                          () => setShowSuccessModal(false),
                                          1000
                                        );
                                      }}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Categoría */}
      <div className="modal fade" id="categoriaModal" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {isEditing ? "Actualizar Categoría" : "Agregar Nueva Categoría"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedCategoria(null);
                }}
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddCategoria}>
                <div className="mb-3">
                  <label className="form-label">Nombre de la Categoría</label>
                  <input
                    type="text"
                    className="form-control"
                    defaultValue={selectedCategoria?.nombre || ""}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    defaultValue={selectedCategoria?.descripcion || ""}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? "Actualizar" : "Guardar"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Lote */}
      <div className="modal fade" id="loteModal" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {isEditing ? "Actualizar Lote" : "Registrar Nuevo Lote"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedLote(null);
                }}
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddLote}>
                <div className="mb-3">
                  <label className="form-label">Nombre del Lote</label>
                  <input
                    type="text"
                    className="form-control"
                    defaultValue={selectedLote?.nombre || ""}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Producto</label>
                  <select
                    className="form-select"
                    defaultValue={selectedLote?.productoId || ""}
                    required
                  >
                    <option value="">Seleccione un producto</option>
                    {productos.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Cantidad Inicial</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    defaultValue={selectedLote?.cantidad ?? ""}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Fecha de Registro</label>
                  <input
                    type="date"
                    className="form-control"
                    defaultValue={
                      selectedLote?.fechaRegistro ||
                      new Date().toISOString().slice(0, 10)
                    }
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? "Actualizar" : "Guardar"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

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
              <div className="modal-body">¡Se procesó correctamente!</div>
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
              <div className="modal-body">{errorMessage}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
