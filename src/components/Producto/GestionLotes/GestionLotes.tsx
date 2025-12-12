import React, { useState, useEffect, useCallback } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./GestionLotes.css";

interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface Producto {
  id: number;
  nombre: string;
}

interface Lote {
  Id: number;
  Id_Producto: number;
  Lote: string;
  Cantidad: number;
  Fecha_Registro: string;
  productoNombre?: string;
}

export default function GestionLotes() {
  // Estados para Categorías
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSearch, setCategoriaSearch] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(
    null
  );
  const [formNombre, setFormNombre] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estados para Lotes
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteSearch, setLoteSearch] = useState("");
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [formLoteNombre, setFormLoteNombre] = useState("");
  const [formLoteProductoId, setFormLoteProductoId] = useState("");
  const [formLoteCantidad, setFormLoteCantidad] = useState(0);
  const [formLoteFecha, setFormLoteFecha] = useState("");
  const [loadingLotes, setLoadingLotes] = useState(false);

  // Estados para Productos
  const [productos, setProductos] = useState<Producto[]>([]);

  // Estados para Modales
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [deleteType, setDeleteType] = useState<"categoria" | "lote" | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);
  // ==================== CATEGORÍAS ====================

  // Obtener token del localStorage
  const getToken = () => localStorage.getItem("token");

  // Obtener todas las categorías
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
      setErrorMessage("Error al cargar las categorías");
      setShowErrorModal(true);
    } finally {
      setLoadingCategorias(false);
    }
  }, []);

  // Manejar edición de categoría
  const handleEditCategoria = (categoria: Categoria) => {
    setIsEditing(true);
    setSelectedCategoria(categoria);
  };

  // Eliminar categoría
  const handleDeleteCategoria = async (categoriaId: number) => {
    const token = getToken();
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/categorias/${categoriaId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (response.ok) {
        await fetchCategorias();
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(errorData.message || "Error al eliminar la categoría");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error deleting categoría:", error);
      setErrorMessage("Error al eliminar la categoría");
      setShowErrorModal(true);
    }
  };

  // Mostrar confirmación de eliminación
  const confirmDelete = (
    type: "categoria" | "lote",
    id: number,
    nombre: string
  ) => {
    setConfirmMessage(
      `¿Estás seguro de que deseas eliminar ${
        type === "categoria" ? "la categoría" : "el lote"
      } "${nombre}"? Esta acción no se puede deshacer.`
    );
    setDeleteType(type);
    setDeleteId(id);
    setShowConfirmModal(true);
  };

  // Enviar formulario de categoría
  const handleSubmitCategoria = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = getToken();

    const payload = {
      nombre: formNombre.trim(),
      descripcion: formDescripcion.trim(),
    };

    if (!payload.nombre) {
      setErrorMessage("El nombre es obligatorio.");
      setShowErrorModal(true);
      return;
    }

    try {
      const method = isEditing && selectedCategoria ? "PUT" : "POST";
      const url =
        method === "PUT"
          ? `http://127.0.0.1:8000/api/categorias/${selectedCategoria?.id}`
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
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 1500);

        // Limpiar y cerrar modal
        setIsEditing(false);
        setSelectedCategoria(null);
        setFormNombre("");
        setFormDescripcion("");

        const modalElement = document.getElementById("categoriaModal");
        if (modalElement) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bsModal = (window as any).bootstrap?.Modal.getInstance(
            modalElement
          );
          bsModal?.hide();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(errorData.message || `Error ${response.status}`);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error guardando categoría:", error);
      setErrorMessage("Error de conexión al guardar la categoría.");
      setShowErrorModal(true);
    }
  };

  // ==================== LOTES ====================

  // Obtener todos los lotes
  const fetchLotes = useCallback(async () => {
    setLoadingLotes(true);
    try {
      const token = getToken();
      const response = await fetch(`http://127.0.0.1:8000/api/lotes`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) throw new Error("Error al cargar lotes");

      const data = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lotesFormateados = data.map((lote: any) => ({
        Id: lote.Id,
        Id_Producto: lote.Id_Producto,
        Lote: lote.Lote,
        Cantidad: lote.Cantidad,
        Fecha_Registro: lote.Fecha_Registro || lote.fecha_registro,
        productoNombre: lote.producto?.nombre,
      }));
      setLotes(lotesFormateados);
    } catch (error) {
      console.error("Error fetching lotes:", error);
      setErrorMessage("Error al cargar los lotes");
      setShowErrorModal(true);
    } finally {
      setLoadingLotes(false);
    }
  }, []);

  // Obtener todos los productos
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

  // Manejar edición de lote
  const handleEditLote = (lote: Lote) => {
    setIsEditing(true);
    setSelectedLote(lote);
  };

  // Enviar formulario de lote
  const handleAddLote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = getToken();

    const payload = {
      Lote: formLoteNombre.trim(),
      Id_Producto: parseInt(formLoteProductoId),
      Cantidad: formLoteCantidad,
      FechaRegistro: formLoteFecha,
    };

    if (!payload.Lote || !payload.Id_Producto || payload.Cantidad <= 0) {
      setErrorMessage("Complete todos los campos correctamente.");
      setShowErrorModal(true);
      return;
    }

    try {
      const method = isEditing && selectedLote ? "PUT" : "POST";
      const url =
        method === "PUT"
          ? `http://127.0.0.1:8000/api/lotes/${selectedLote?.Id}`
          : `http://127.0.0.1:8000/api/lotes`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchLotes();
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 1500);

        // Limpiar y cerrar modal
        setIsEditing(false);
        setSelectedLote(null);
        setFormLoteNombre("");
        setFormLoteProductoId("");
        setFormLoteCantidad(0);
        setFormLoteFecha("");

        const modalElement = document.getElementById("loteModal");
        if (modalElement) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bsModal = (window as any).bootstrap?.Modal.getInstance(
            modalElement
          );
          bsModal?.hide();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(errorData.message || `Error ${response.status}`);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error guardando lote:", error);
      setErrorMessage("Error de conexión al guardar el lote.");
      setShowErrorModal(true);
    }
  };

  // Eliminar lote
  const handleDeleteLote = async (loteId: number) => {
    const token = getToken();
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/lotes/${loteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (response.ok) {
        await fetchLotes();
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 1500);
      } else {
        setErrorMessage("Error al eliminar el lote");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error deleting lote:", error);
      setErrorMessage("Error al eliminar el lote");
      setShowErrorModal(true);
    }
  };

  // Filtrar lotes
  const filteredLotes = lotes.filter(
    (lote) =>
      lote.Lote.toLowerCase().includes(loteSearch.toLowerCase()) ||
      (lote.productoNombre || "")
        .toLowerCase()
        .includes(loteSearch.toLowerCase())
  );

  // Sincronizar formulario de categoría cuando se edita
  useEffect(() => {
    if (selectedCategoria && isEditing) {
      setFormNombre(selectedCategoria.nombre);
      setFormDescripcion(selectedCategoria.descripcion || "");
    } else {
      setFormNombre("");
      setFormDescripcion("");
    }
  }, [selectedCategoria, isEditing]);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchCategorias();
    fetchLotes();
    fetchProductos();
  }, [fetchCategorias, fetchLotes, fetchProductos]);

  // Sincronizar formulario de lote cuando se edita
  useEffect(() => {
    if (selectedLote && isEditing) {
      setFormLoteNombre(selectedLote.Lote);
      setFormLoteProductoId(selectedLote.Id_Producto.toString());
      setFormLoteCantidad(selectedLote.Cantidad);
      setFormLoteFecha(selectedLote.Fecha_Registro);
    } else {
      setFormLoteNombre("");
      setFormLoteProductoId("");
      setFormLoteCantidad(0);
      setFormLoteFecha(new Date().toISOString().split("T")[0]);
    }
  }, [selectedLote, isEditing]);

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
                          setFormNombre("");
                          setFormDescripcion("");
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
                                      data-bs-toggle="modal"
                                      data-bs-target="#categoriaModal"
                                      onClick={() =>
                                        handleEditCategoria(categoria)
                                      }
                                    >
                                      Editar
                                    </button>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() =>
                                        confirmDelete(
                                          "categoria",
                                          categoria.id,
                                          categoria.nombre
                                        )
                                      }
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {loadingCategorias && (
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
                            Cargando categorías, por favor espera...
                          </div>
                        </div>
                      )}
                      {!loadingCategorias && categorias.length === 0 && (
                        <div
                          style={{
                            marginTop: "1em",
                            color: "#0d6efd",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          No hay categorías disponibles
                        </div>
                      )}
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
                          setFormLoteNombre("");
                          setFormLoteProductoId("");
                          setFormLoteCantidad(0);
                          setFormLoteFecha(
                            new Date().toISOString().split("T")[0]
                          );
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
                          {filteredLotes.map((lote) => (
                            <tr key={lote.Id}>
                              <td>{lote.Id}</td>
                              <td>{lote.Lote}</td>
                              <td>{lote.productoNombre || "Sin producto"}</td>
                              <td>{lote.Fecha_Registro}</td>
                              <td>{lote.Cantidad}</td>
                              <td>
                                <div className="d-flex justify-content-center gap-2">
                                  <button
                                    className="btn btn-warning btn-sm"
                                    data-bs-toggle="modal"
                                    data-bs-target="#loteModal"
                                    onClick={() => handleEditLote(lote)}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() =>
                                      confirmDelete("lote", lote.Id, lote.Lote)
                                    }
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {loadingLotes && (
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
                            Cargando lotes, por favor espera...
                          </div>
                        </div>
                      )}
                      {!loadingLotes && lotes.length === 0 && (
                        <div
                          style={{
                            marginTop: "1em",
                            color: "#0d6efd",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          No hay lotes disponibles
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
                  setFormNombre("");
                  setFormDescripcion("");
                }}
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmitCategoria}>
                <div className="mb-3">
                  <label className="form-label">Nombre de la Categoría</label>
                  <input
                    name="nombre"
                    type="text"
                    className="form-control"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea
                    name="descripcion"
                    className="form-control"
                    rows={3}
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
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
                    value={formLoteNombre}
                    onChange={(e) => setFormLoteNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Producto</label>
                  <select
                    className="form-select"
                    value={formLoteProductoId}
                    onChange={(e) => setFormLoteProductoId(e.target.value)}
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
                    value={formLoteCantidad}
                    onChange={(e) =>
                      setFormLoteCantidad(Number(e.target.value))
                    }
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Fecha de Registro</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formLoteFecha}
                    onChange={(e) => setFormLoteFecha(e.target.value)}
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

      {/* Modal Confirmación de Eliminación */}
      {showConfirmModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">⚠️ Confirmar Eliminación</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfirmModal(false)}
                ></button>
              </div>
              <div className="modal-body">{confirmMessage}</div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setDeleteType(null);
                    setDeleteId(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={async () => {
                    try {
                      if (deleteType === "categoria" && deleteId) {
                        await handleDeleteCategoria(deleteId);
                      } else if (deleteType === "lote" && deleteId) {
                        await handleDeleteLote(deleteId);
                      }
                    } catch (error) {
                      console.error("Error executing delete:", error);
                    }
                    setShowConfirmModal(false);
                    setDeleteType(null);
                    setDeleteId(null);
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
  );
}
