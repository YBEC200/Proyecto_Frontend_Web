import React, { useState, useEffect, useCallback } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./GestionCategorias.css";

interface Categoria {
  Id: number;
  Nombre: string;
  Descripcion?: string;
}

interface Producto {
  id: string;
  nombre: string;
}

export default function GestionCategorias() {
  // ========== FORMULARIO CREAR LOTES ==========
  const [loteNombre, setLoteNombre] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [productoNombreInput, setProductoNombreInput] = useState("");
  const [loteCantidad, setLoteCantidad] = useState<number | "">("");
  const [mensajeLote, setMensajeLote] = useState("");
  const [mensajeLoteTipo, setMensajeLoteTipo] = useState<
    "success" | "error" | ""
  >("");
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);

  // ========== TABLA CATEGORÍAS CRUD ==========
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetCategoria, setDeleteTargetCategoria] =
    useState<Categoria | null>(null);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState<"success" | "error" | "">("");

  // Form estados para editar categoría
  const [editFormNombre, setEditFormNombre] = useState("");
  const [editFormDescripcion, setEditFormDescripcion] = useState("");

  // Estados para Productos
  const [productos, setProductos] = useState<Producto[]>([]);

  // ========== HELPERS ==========
  const getToken = () => localStorage.getItem("token");

  // ========== CATEGORÍAS ==========
  const fetchCategorias = useCallback(async () => {
    setLoadingCategorias(true);
    try {
      const token = getToken();
      const response = await fetch(`http://127.0.0.1:8000/api/categorias`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) throw new Error("Error al cargar categorías");

      const data = await response.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching categorías:", error);
      setMensaje("Error al cargar las categorías");
      setMensajeTipo("error");
    } finally {
      setLoadingCategorias(false);
    }
  }, []);

  const handleEditCategoria = (categoria: Categoria) => {
    setIsEditing(true);
    setSelectedCategoria(categoria);
    setEditFormNombre(categoria.Nombre);
    setEditFormDescripcion(categoria.Descripcion || "");
  };

  const handleSubmitCategoria = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = getToken();

    const payload = {
      Nombre: editFormNombre.trim(),
      Descripcion: editFormDescripcion.trim(),
    };

    if (!payload.Nombre) {
      setMensaje("El nombre es obligatorio.");
      setMensajeTipo("error");
      return;
    }

    try {
      const method = isEditing && selectedCategoria ? "PUT" : "POST";
      const url =
        method === "PUT"
          ? `http://127.0.0.1:8000/api/categorias/${selectedCategoria?.Id}`
          : `http://127.0.0.1:8000/api/categorias`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchCategorias();
        setMensaje(
          isEditing
            ? "Categoría actualizada correctamente"
            : "Categoría creada correctamente"
        );
        setMensajeTipo("success");
        setIsEditing(false);
        setSelectedCategoria(null);
        setEditFormNombre("");
        setEditFormDescripcion("");

        const modalElement = document.querySelector("#categoriaModal");
        if (modalElement instanceof HTMLElement) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bsModal = (window as any).bootstrap?.Modal.getInstance(
            modalElement
          );
          bsModal?.hide();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMensaje(errorData.message || `Error ${response.status}`);
        setMensajeTipo("error");
      }
    } catch (error) {
      console.error("Error guardando categoría:", error);
      setMensaje("Error de conexión al guardar la categoría.");
      setMensajeTipo("error");
    }
  };

  const handleConfirmDeleteCategoria = (categoria: Categoria) => {
    setDeleteTargetCategoria(categoria);
    setShowDeleteModal(true);
  };

  const handleDeleteCategoria = async (categoria: Categoria) => {
    const token = getToken();
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/categorias/${categoria.Id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (response.ok) {
        await fetchCategorias();
        setMensaje("Categoría eliminada correctamente");
        setMensajeTipo("success");
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMensaje(errorData.message || "Error al eliminar la categoría");
        setMensajeTipo("error");
      }
    } catch (error) {
      console.error("Error deleting categoría:", error);
      setMensaje("Error al eliminar la categoría");
      setMensajeTipo("error");
    } finally {
      setShowDeleteModal(false);
      setDeleteTargetCategoria(null);
    }
  };

  // ========== LOTES ==========
  const fetchProductos = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://127.0.0.1:8000/api/productos`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) throw new Error("Error al cargar productos");

      const data = await response.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching productos:", error);
    }
  }, []);

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(productoNombreInput.toLowerCase())
  );

  const handleSelectProducto = (productoId: string, productoNombre: string) => {
    setProductoSeleccionado(productoId);
    setProductoNombreInput(productoNombre);
    setShowProductoDropdown(false);
  };

  const handleSubmitLote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensajeLote("");
    setMensajeLoteTipo("");
    const token = getToken();

    const payload = {
      Lote: loteNombre.trim(),
      Id_Producto: productoSeleccionado,
      Cantidad: loteCantidad,
    };

    if (
      !payload.Lote ||
      !payload.Id_Producto ||
      !payload.Cantidad ||
      payload.Cantidad <= 0
    ) {
      setMensajeLote("Complete todos los campos correctamente.");
      setMensajeLoteTipo("error");
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/lotes`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMensajeLote("Lote creado correctamente");
        setMensajeLoteTipo("success");
        setLoteNombre("");
        setProductoSeleccionado("");
        setProductoNombreInput("");
        setLoteCantidad("");
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMensajeLote(errorData.message || `Error ${response.status}`);
        setMensajeLoteTipo("error");
      }
    } catch (error) {
      console.error("Error guardando lote:", error);
      setMensajeLote("Error de conexión al guardar el lote.");
      setMensajeLoteTipo("error");
    }
  };

  // Cargar datos al montar
  useEffect(() => {
    fetchCategorias();
    fetchProductos();
  }, [fetchCategorias, fetchProductos]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-area">
        <Nav />
        <div className="page-wrapper">
          <div className="page-content">
            {/* Breadcrumb */}
            <div className="page-breadcrumb d-none d-sm-flex align-items-center mb-3">
              <div className="breadcrumb-title pe-3">Gestión</div>
              <div className="ps-3">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0 p-0">
                    <li className="breadcrumb-item">
                      <i className="bx bx-home-alt"></i>
                    </li>
                    <li className="breadcrumb-item active">
                      Categorías y Lotes
                    </li>
                  </ol>
                </nav>
              </div>
            </div>

            {/* Alertas */}
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
            {mensajeLote && (
              <div
                className={`alert alert-${
                  mensajeLoteTipo === "success" ? "success" : "danger"
                } alert-dismissible fade show`}
                role="alert"
              >
                {mensajeLote}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setMensajeLote("")}
                ></button>
              </div>
            )}

            {/* Layout dos columnas */}
            <div className="row">
              {/* COLUMNA 1: FORMULARIO CREAR LOTES */}
              <div className="col-lg-6 mb-4">
                <div className="card radius-10">
                  <div className="card-header">
                    <h6 className="mb-0">Crear Nuevo Lote</h6>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSubmitLote}>
                      <div className="mb-3">
                        <label className="form-label">Nombre del Lote</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ej: LOTE-001"
                          value={loteNombre}
                          onChange={(e) => setLoteNombre(e.target.value)}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Producto</label>
                        <div className="position-relative">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar producto..."
                            value={productoNombreInput}
                            onChange={(e) => {
                              setProductoNombreInput(e.target.value);
                              setShowProductoDropdown(true);
                            }}
                            onFocus={() => setShowProductoDropdown(true)}
                            required={!productoSeleccionado}
                          />
                          {showProductoDropdown &&
                            productoNombreInput.length > 0 && (
                              <div
                                className="dropdown-menu show w-100"
                                style={{
                                  position: "absolute",
                                  top: "100%",
                                  left: 0,
                                  zIndex: 1000,
                                  maxHeight: "200px",
                                  overflowY: "auto",
                                }}
                              >
                                {productosFiltrados.length > 0 ? (
                                  productosFiltrados.map((producto) => (
                                    <button
                                      key={producto.id}
                                      type="button"
                                      className="dropdown-item"
                                      onClick={() =>
                                        handleSelectProducto(
                                          producto.id,
                                          producto.nombre
                                        )
                                      }
                                    >
                                      {producto.nombre}
                                    </button>
                                  ))
                                ) : (
                                  <div className="dropdown-item disabled">
                                    No hay productos
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Cantidad Inicial</label>
                        <div className="input-group">
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            step="1"
                            placeholder="0"
                            value={loteCantidad === "" ? "" : loteCantidad}
                            onChange={(e) =>
                              setLoteCantidad(
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                            required
                          />
                        </div>
                      </div>

                      <button type="submit" className="btn btn-primary w-100">
                        Guardar Lote
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* COLUMNA 2: TABLA CATEGORÍAS CRUD */}
              <div className="col-lg-6 mb-4">
                <div className="card radius-10">
                  <div className="card-header">
                    <div className="d-flex align-items-center justify-content-between w-100">
                      <div>
                        <h6 className="mb-0">Gestión de Categorías</h6>
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        <button
                          className="btn btn-primary btn-sm"
                          data-bs-toggle="modal"
                          data-bs-target="#categoriaModal"
                          onClick={() => {
                            setIsEditing(false);
                            setSelectedCategoria(null);
                            setEditFormNombre("");
                            setEditFormDescripcion("");
                          }}
                        >
                          <i className="bx bx-plus"></i> Nueva Categoría
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead className="table-light">
                          <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categorias.map((categoria) => (
                            <tr key={categoria.Id}>
                              <td>{categoria.Id}</td>
                              <td>{categoria.Nombre}</td>
                              <td>
                                <div className="d-flex gap-2 justify-content-center">
                                  <button
                                    className="btn-action-edit"
                                    data-bs-toggle="modal"
                                    data-bs-target="#categoriaModal"
                                    onClick={() =>
                                      handleEditCategoria(categoria)
                                    }
                                    title="Editar"
                                  >
                                    <i className="bx bx-edit"></i>
                                  </button>
                                  <button
                                    className="btn-action-delete"
                                    onClick={() =>
                                      handleConfirmDeleteCategoria(categoria)
                                    }
                                    title="Eliminar"
                                  >
                                    <i className="bx bx-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {loadingCategorias && (
                        <div style={{ textAlign: "center", padding: "1em" }}>
                          <div
                            className="spinner-border spinner-border-sm text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Cargando...</span>
                          </div>
                        </div>
                      )}
                      {!loadingCategorias && categorias.length === 0 && (
                        <div
                          style={{
                            textAlign: "center",
                            color: "#999",
                            padding: "1em",
                          }}
                        >
                          Sin categorías
                        </div>
                      )}
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
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">
                {isEditing ? "Editar Categoría" : "Nueva Categoría"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <form onSubmit={handleSubmitCategoria}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormNombre}
                    onChange={(e) => setEditFormNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editFormDescripcion}
                    onChange={(e) => setEditFormDescripcion(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal Confirmar Eliminar Categoría */}
      {showDeleteModal && deleteTargetCategoria && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Confirmar Eliminación</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                ¿Estás seguro de eliminar la categoría{" "}
                <strong>{deleteTargetCategoria.Nombre}</strong>? Esta acción no
                se puede deshacer.
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDeleteCategoria(deleteTargetCategoria)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
