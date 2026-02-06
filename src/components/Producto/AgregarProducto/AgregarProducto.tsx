import React, { useState, useEffect } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import { Link } from "react-router-dom";
import "./AgregarProducto.css";
const API_URL = import.meta.env.VITE_API_URL;
interface Categoria {
  id: number;
  nombre: string;
}

export default function AgregarProducto() {
  // Estados del formulario de productos
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [costoUnit, setCostoUnit] = useState<number | "">("");
  const [idCategoria, setIdCategoria] = useState("");
  const [marca, setMarca] = useState("");
  // Estado automático: siempre "Agotado" al crear
  const [estado] = useState("Agotado");

  // Estados de validación
  const [errores, setErrores] = useState<{ [key: string]: string }>({});

  // Estados de imágenes (futuro)
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [previewPrincipal, setPreviewPrincipal] = useState<string | null>(null);
  const [previewSecundaria, setPreviewSecundaria] = useState<string | null>(
    null,
  );

  // Estados de modales
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [messageModal, setMessageModal] = useState("");

  // Estados de datos
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [loading, setLoading] = useState(false);

  const productosEjemplo = [
    { id: "1", nombre: "Laptop Dell XPS" },
    { id: "2", nombre: "Monitor LG 27'" },
    { id: "3", nombre: "Laptop HP Pavilion" },
  ];

  // Cargar categorías desde la API
  useEffect(() => {
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
          setLoadingCategorias(false);
          return;
        }

        const data = await response.json();
        // Normalizar estructura de categorías
        const normalizedCategorias = (Array.isArray(data) ? data : []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (cat: any) => ({
            id: cat.id || cat.Id,
            nombre: cat.nombre || cat.Nombre,
          }),
        );
        setCategorias(normalizedCategorias);
      } catch (err) {
        console.error("Error al cargar categorías:", err);
      } finally {
        setLoadingCategorias(false);
      }
    };

    fetchCategorias();
  }, []);

  // Función para validar el formulario de productos
  const validarFormulario = (): boolean => {
    const nuevosErrores: { [key: string]: string } = {};

    // Validar nombre
    if (!nombre.trim()) {
      nuevosErrores.nombre = "El nombre del producto es requerido";
    } else if (nombre.trim().length < 3) {
      nuevosErrores.nombre = "El nombre debe tener al menos 3 caracteres";
    } else if (nombre.trim().length > 150) {
      nuevosErrores.nombre = "El nombre no puede exceder 150 caracteres";
    }

    // Validar categoría
    if (!idCategoria) {
      nuevosErrores.idCategoria = "Debes seleccionar una categoría";
    }

    // Validar costo unitario (sin permitir 0 ni negativos)
    if (costoUnit === "") {
      nuevosErrores.costoUnit = "El costo unitario es requerido";
    } else if (Number(costoUnit) < 0.01) {
      nuevosErrores.costoUnit = "El costo unitario debe ser mayor a S/ 0.00";
    } else if (Number(costoUnit) > 999999.99) {
      nuevosErrores.costoUnit = "El costo unitario es demasiado grande";
    }

    // Validar marca (opcional pero si se completa)
    if (marca.trim() && marca.trim().length > 100) {
      nuevosErrores.marca = "La marca no puede exceder 100 caracteres";
    }

    // Validar descripción (opcional pero si se completa)
    if (descripcion.trim() && descripcion.trim().length > 500) {
      nuevosErrores.descripcion =
        "La descripción no puede exceder 500 caracteres";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleFilePreview = (
    file: File | null,
    setPreview: (v: string | null) => void,
  ) => {
    if (!file) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(String(e.target?.result ?? null));
    reader.readAsDataURL(file);
  };

  const onChangePrincipal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    handleFilePreview(f, setPreviewPrincipal);
  };

  const onChangeSecundaria = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    handleFilePreview(f, setPreviewSecundaria);
  };

  // Función para enviar el formulario
  const submitProducto = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar antes de enviar
    if (!validarFormulario()) {
      setMessageModal("Por favor corrige los errores en el formulario");
      setShowError(true);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        marca: marca.trim() || null,
        id_categoria: parseInt(idCategoria),
        estado: estado,
        costo_unit: parseFloat(String(costoUnit)),
        fecha_registro: new Date().toISOString(),
      };

      const response = await fetch(`${API_URL}/api/productos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMessageModal(
          errorData.message || "Error al crear el producto. Intenta de nuevo.",
        );
        setShowError(true);
        setLoading(false);
        return;
      }

      await response.json();
      setMessageModal("¡Producto creado correctamente!");
      setShowSuccess(true);

      // Limpiar formulario
      setTimeout(() => {
        setNombre("");
        setDescripcion("");
        setCostoUnit("");
        setIdCategoria("");
        setMarca("");
        setErrores({});
        setShowSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Error al crear producto:", err);
      setMessageModal("Error de conexión. Intenta de nuevo.");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-area">
        <Nav />
        <div className="page-wrapper">
          <div className="page-content">
            <div className="page-breadcrumb d-none d-sm-flex align-items-center mb-3">
              <div className="breadcrumb-title pe-3">Productos</div>
              <div className="ps-3">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0 p-0">
                    <li className="breadcrumb-item">
                      <i className="bx bx-home-alt"></i>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Agregar nuevo producto
                    </li>
                  </ol>
                </nav>
              </div>
            </div>

            <div className="card">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Agregar Nuevo Producto</h5>
                  <Link
                    to="/productos"
                    className="btn custom-btn radius-30"
                    style={{
                      backgroundColor: "#32acbe",
                      borderColor: "#269cae",
                      color: "white",
                    }}
                  >
                    <i className="bx bx-file" style={{ marginRight: 8 }} /> Ver
                    Gestión
                  </Link>
                </div>

                <hr />

                <form onSubmit={submitProducto}>
                  <div className="row">
                    {/* FORMULARIO DE PRODUCTOS */}
                    <div className="col-lg-7">
                      <div className="border border-3 p-4 rounded">
                        <h6 className="mb-3 text-primary fw-bold">
                          <i className="bx bx-package me-2"></i>Información del
                          Producto
                        </h6>

                        {/* Nombre */}
                        <div className="mb-3">
                          <label className="form-label">
                            Nombre del Producto
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${
                              errores.nombre ? "is-invalid" : ""
                            }`}
                            value={nombre}
                            onChange={(e) => {
                              setNombre(e.target.value);
                              if (errores.nombre) {
                                const nuevosErrores = { ...errores };
                                delete nuevosErrores.nombre;
                                setErrores(nuevosErrores);
                              }
                            }}
                            placeholder="Ingresa el nombre del producto"
                          />
                          {errores.nombre && (
                            <div className="invalid-feedback d-block">
                              {errores.nombre}
                            </div>
                          )}
                          <small className="text-muted">
                            Máximo 150 caracteres
                          </small>
                        </div>

                        {/* Descripción */}
                        <div className="mb-3">
                          <label className="form-label">Descripción</label>
                          <textarea
                            className={`form-control ${
                              errores.descripcion ? "is-invalid" : ""
                            }`}
                            value={descripcion}
                            onChange={(e) => {
                              setDescripcion(e.target.value);
                              if (errores.descripcion) {
                                const nuevosErrores = { ...errores };
                                delete nuevosErrores.descripcion;
                                setErrores(nuevosErrores);
                              }
                            }}
                            placeholder="Describe el producto"
                            rows={3}
                          />
                          {errores.descripcion && (
                            <div className="invalid-feedback d-block">
                              {errores.descripcion}
                            </div>
                          )}
                          <small className="text-muted">
                            Máximo 500 caracteres
                          </small>
                        </div>

                        {/* Costo Unitario */}
                        <div className="mb-3">
                          <label className="form-label">
                            Costo Unitario
                            <span className="text-danger">*</span>
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">S/</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className={`form-control ${
                                errores.costoUnit ? "is-invalid" : ""
                              }`}
                              value={costoUnit === "" ? "" : String(costoUnit)}
                              onChange={(e) => {
                                const v = e.target.value;
                                setCostoUnit(v === "" ? "" : Number(v));
                                if (errores.costoUnit) {
                                  const nuevosErrores = { ...errores };
                                  delete nuevosErrores.costoUnit;
                                  setErrores(nuevosErrores);
                                }
                              }}
                              placeholder="00.00"
                            />
                          </div>
                          {errores.costoUnit && (
                            <div className="invalid-feedback d-block">
                              {errores.costoUnit}
                            </div>
                          )}
                        </div>

                        {/* Categoría */}
                        <div className="mb-3">
                          <label className="form-label">
                            Categoría
                            <span className="text-danger">*</span>
                          </label>
                          <select
                            className={`form-select ${
                              errores.idCategoria ? "is-invalid" : ""
                            }`}
                            value={idCategoria}
                            onChange={(e) => {
                              setIdCategoria(e.target.value);
                              if (errores.idCategoria) {
                                const nuevosErrores = { ...errores };
                                delete nuevosErrores.idCategoria;
                                setErrores(nuevosErrores);
                              }
                            }}
                            disabled={loadingCategorias}
                          >
                            <option value="">
                              {loadingCategorias
                                ? "Cargando categorías..."
                                : "Seleccionar Categoría"}
                            </option>
                            {categorias.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nombre}
                              </option>
                            ))}
                          </select>
                          {errores.idCategoria && (
                            <div className="invalid-feedback d-block">
                              {errores.idCategoria}
                            </div>
                          )}
                        </div>

                        {/* Estado Automático */}
                        <div className="mb-3">
                          <label className="form-label">
                            Estado
                            <span className="text-danger">*</span>
                          </label>
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
                              value={estado}
                              disabled
                            />
                            <span
                              className="input-group-text bg-warning text-dark fw-bold"
                              title="El estado se establece automáticamente como Agotado"
                            >
                              Automático
                            </span>
                          </div>
                          <small className="text-muted">
                            Todos los productos se crean como "Agotado". Se
                            actualizarán al agregar lotes.
                          </small>
                        </div>

                        {/* Marca */}
                        <div className="mb-3">
                          <label className="form-label">Marca</label>
                          <input
                            type="text"
                            className={`form-control ${
                              errores.marca ? "is-invalid" : ""
                            }`}
                            value={marca}
                            onChange={(e) => {
                              setMarca(e.target.value);
                              if (errores.marca) {
                                const nuevosErrores = { ...errores };
                                delete nuevosErrores.marca;
                                setErrores(nuevosErrores);
                              }
                            }}
                            placeholder="Ingresa la marca del producto"
                          />
                          {errores.marca && (
                            <div className="invalid-feedback d-block">
                              {errores.marca}
                            </div>
                          )}
                          <small className="text-muted">
                            Máximo 100 caracteres (opcional)
                          </small>
                        </div>

                        <button
                          type="submit"
                          className="btn btn-primary w-100"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Guardando...
                            </>
                          ) : (
                            "Guardar Producto"
                          )}
                        </button>
                      </div>
                    </div>

                    {/* FORMULARIO DE IMÁGENES (FUTURO) */}
                    <div className="col-lg-5">
                      <div className="border border-3 p-4 rounded">
                        <h6 className="mb-3 text-success fw-bold">
                          <i className="bx bx-image me-2"></i>Gestión de
                          Imágenes
                        </h6>

                        <div className="alert alert-info mb-3" role="alert">
                          <i className="bx bx-info-circle me-2"></i>
                          <small>
                            Esta sección se habilitará después de crear el
                            producto.
                          </small>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">
                            Producto (para imágenes)
                          </label>
                          <select
                            className="form-select"
                            value={productoSeleccionado}
                            onChange={(e) =>
                              setProductoSeleccionado(e.target.value)
                            }
                            disabled
                          >
                            <option value="">Crea un producto primero</option>
                            {productosEjemplo.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Imagen Principal</label>
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control"
                            onChange={onChangePrincipal}
                            disabled
                          />
                          {previewPrincipal && (
                            <div className="mt-2 text-center">
                              <img
                                src={previewPrincipal}
                                alt="principal"
                                style={{
                                  width: 150,
                                  height: 150,
                                  objectFit: "cover",
                                  borderRadius: 8,
                                  border: "2px solid #b4d8fe",
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <div className="mb-3">
                          <label className="form-label">
                            Imagen Secundaria
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control"
                            onChange={onChangeSecundaria}
                            disabled
                          />
                          {previewSecundaria && (
                            <div className="mt-2 text-center">
                              <img
                                src={previewSecundaria}
                                alt="secundaria"
                                style={{
                                  width: 120,
                                  height: 120,
                                  objectFit: "cover",
                                  borderRadius: 8,
                                  border: "2px solid #89e9e6",
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn btn-outline-secondary w-100"
                          disabled
                        >
                          Guardar Imágenes
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal éxito */}
            {showSuccess && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-md">
                  <div className="modal-content">
                    <div className="modal-header bg-success text-white">
                      <h5 className="modal-title">
                        <i className="bx bx-check-circle me-2"></i>Éxito
                      </h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => setShowSuccess(false)}
                        aria-label="Close"
                      ></button>
                    </div>
                    <div className="modal-body">
                      <p>
                        <strong>¡Producto creado correctamente!</strong>
                      </p>
                      <p className="text-muted small mb-0">{messageModal}</p>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => setShowSuccess(false)}
                      >
                        Aceptar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal error */}
            {showError && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-md">
                  <div className="modal-content">
                    <div className="modal-header bg-danger text-white">
                      <h5 className="modal-title">
                        <i className="bx bx-error-circle me-2"></i>Error
                      </h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => setShowError(false)}
                        aria-label="Close"
                      ></button>
                    </div>
                    <div className="modal-body">
                      <p>
                        <strong>No se pudo crear el producto</strong>
                      </p>
                      <p className="text-muted small mb-0">{messageModal}</p>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowError(false)}
                      >
                        Intentar de nuevo
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => setShowError(false)}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Backdrop para los modales */}
            {(showSuccess || showError) && (
              <div
                className="modal-backdrop fade show"
                onClick={() => {
                  setShowSuccess(false);
                  setShowError(false);
                }}
              ></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
