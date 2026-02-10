import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import { Link } from "react-router-dom";
import "./AgregarProducto.css";

const API_URL = import.meta.env.VITE_API_URL;

interface Categoria {
  id: number;
  nombre: string;
}
interface Producto {
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

  // Estados de modales
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [messageModal, setMessageModal] = useState("");

  // Estados de modales para imágenes
  const [showImageSuccess, setShowImageSuccess] = useState(false);
  const [showImageError, setShowImageError] = useState(false);
  const [messageImageModal, setMessageImageModal] = useState("");

  // Estados de datos
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [loading, setLoading] = useState(false);

  // Estado para productos (futuro)
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);

  const [imagenPrincipal, setImagenPrincipal] = useState<File | null>(null);
  const [imagenSecundaria, setImagenSecundaria] = useState<File | null>(null);

  // Estados para previsualizaciones
  const [previewPrincipal, setPreviewPrincipal] = useState<string | null>(null);
  const [previewSecundaria, setPreviewSecundaria] = useState<string | null>(
    null,
  );

  const [loadingProductos, setLoadingProductos] = useState(false);
  const [subiendoImagenes, setSubiendoImagenes] = useState(false);

  const inputPrincipalRef = useRef<HTMLInputElement>(null);
  const inputSecundariaRef = useRef<HTMLInputElement>(null);
  const productosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return [];
    return productos.filter((p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()),
    );
  }, [productos, busqueda]);

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

  // Función auxiliar para validar que sea texto válido
  const esTextoValido = (texto: string): boolean => {
    const trimmed = texto.trim();
    // Verificar que no sea solo números, espacios o caracteres especiales
    return /[a-zA-Z]/.test(trimmed) && trimmed.length > 0;
  };

  // Función para limpiar y validar números
  const validarNumeroPositivo = (valor: number | ""): boolean => {
    if (valor === "") return false;
    const num = Number(valor);
    return !isNaN(num) && num > 0;
  };

  // Función para validar el formulario de productos
  const validarFormulario = (): boolean => {
    const nuevosErrores: { [key: string]: string } = {};

    // Validar nombre
    if (!nombre.trim()) {
      nuevosErrores.nombre = "El nombre del producto es requerido";
    } else if (!esTextoValido(nombre)) {
      nuevosErrores.nombre = "El nombre debe contener al menos una letra";
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
    } else if (!validarNumeroPositivo(costoUnit)) {
      nuevosErrores.costoUnit = "El costo unitario debe ser mayor a S/ 0.00";
    } else if (Number(costoUnit) > 999999.99) {
      nuevosErrores.costoUnit = "El costo unitario es demasiado grande";
    }

    // Validar marca (opcional pero si se completa)
    if (marca.trim()) {
      if (!esTextoValido(marca)) {
        nuevosErrores.marca = "La marca debe contener al menos una letra";
      } else if (marca.trim().length < 2) {
        nuevosErrores.marca = "La marca debe tener al menos 2 caracteres";
      } else if (marca.trim().length > 100) {
        nuevosErrores.marca = "La marca no puede exceder 100 caracteres";
      }
    }

    // Validar descripción (opcional pero si se completa)
    if (descripcion.trim()) {
      if (!esTextoValido(descripcion)) {
        nuevosErrores.descripcion =
          "La descripción debe contener al menos una letra";
      } else if (descripcion.trim().length < 10) {
        nuevosErrores.descripcion =
          "La descripción debe tener al menos 10 caracteres";
      } else if (descripcion.trim().length > 500) {
        nuevosErrores.descripcion =
          "La descripción no puede exceder 500 caracteres";
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
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

      const created = await response.json();
      setMessageModal("¡Producto creado correctamente!");
      setShowSuccess(true);

      // Si la API devuelve el producto creado, lo seleccionamos y actualizamos la lista
      if (created && created.id) {
        setProductoSeleccionado({
          id: created.id,
          nombre: (created.nombre as string) || nombre,
        });
        setBusqueda((created.nombre as string) || nombre);
        setProductos((prev) => {
          if (prev.some((p) => p.id === created.id)) return prev;
          return [
            { id: created.id, nombre: (created.nombre as string) || nombre },
            ...prev,
          ];
        });
      } else {
        // Si no hay data, refrescamos la lista por si acaso
        fetchProductos();
      }

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

  const fetchProductos = useCallback(async () => {
    try {
      setLoadingProductos(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/productos`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) throw new Error("Error al cargar productos");

      const data = await response.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching productos:", error);
    } finally {
      setLoadingProductos(false);
    }
  }, []);

  const uploadImagen = async (
    productoId: number,
    file: File,
    tipo: "principal" | "secundaria",
  ) => {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("imagen", file);
    formData.append("tipo", tipo);

    const response = await fetch(
      `${API_URL}/api/productos/${productoId}/imagenes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error("Error subiendo imagen");
    }
  };

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

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
                    Gestión de productos
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
                              const valor = e.target.value;
                              setNombre(valor);
                              // Limpiar error cuando el usuario empieza a escribir correctamente
                              if (errores.nombre && esTextoValido(valor)) {
                                const nuevosErrores = { ...errores };
                                delete nuevosErrores.nombre;
                                setErrores(nuevosErrores);
                              }
                            }}
                            placeholder="Ingresa el nombre del producto (ej: Arroz Premium)"
                            maxLength={150}
                          />
                          {errores.nombre && (
                            <div className="invalid-feedback d-block">
                              {errores.nombre}
                            </div>
                          )}
                          <small className="text-muted">
                            {nombre.length}/150 caracteres • Debe contener
                            letras
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
                              const valor = e.target.value;
                              setDescripcion(valor);
                              // Limpiar error si el texto es válido
                              if (errores.descripcion && esTextoValido(valor)) {
                                const nuevosErrores = { ...errores };
                                delete nuevosErrores.descripcion;
                                setErrores(nuevosErrores);
                              }
                            }}
                            placeholder="Describe el producto (ej: Arroz de grano largo, integral...)"
                            rows={3}
                            maxLength={500}
                          />
                          {errores.descripcion && (
                            <div className="invalid-feedback d-block">
                              {errores.descripcion}
                            </div>
                          )}
                          <small className="text-muted">
                            {descripcion.length}/500 caracteres • Opcional pero
                            debe contener letras
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
                              min="0.01"
                              max="999999.99"
                              className={`form-control ${
                                errores.costoUnit ? "is-invalid" : ""
                              }`}
                              value={costoUnit === "" ? "" : String(costoUnit)}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "") {
                                  setCostoUnit("");
                                } else {
                                  const num = parseFloat(v);
                                  // Solo aceptar números positivos mayores a 0
                                  if (!isNaN(num) && num >= 0.01) {
                                    setCostoUnit(num);
                                  }
                                }
                                // Limpiar error si es válido
                                if (
                                  errores.costoUnit &&
                                  validarNumeroPositivo(parseFloat(v || "0"))
                                ) {
                                  const nuevosErrores = { ...errores };
                                  delete nuevosErrores.costoUnit;
                                  setErrores(nuevosErrores);
                                }
                              }}
                              placeholder="0.01"
                              title="Ingresa un valor mayor a 0"
                            />
                          </div>
                          {errores.costoUnit && (
                            <div className="invalid-feedback d-block">
                              {errores.costoUnit}
                            </div>
                          )}
                          <small className="text-muted">
                            Mínimo S/ 0.01 • Máximo S/ 999,999.99
                          </small>
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
                              const valor = e.target.value;
                              setMarca(valor);
                              // Limpiar error si el texto es válido o está vacío
                              if (
                                errores.marca &&
                                (!valor.trim() || esTextoValido(valor))
                              ) {
                                const nuevosErrores = { ...errores };
                                delete nuevosErrores.marca;
                                setErrores(nuevosErrores);
                              }
                            }}
                            placeholder="Ingresa la marca (ej: Primor, Integral)"
                            maxLength={100}
                          />
                          {errores.marca && (
                            <div className="invalid-feedback d-block">
                              {errores.marca}
                            </div>
                          )}
                          <small className="text-muted">
                            {marca.length}/100 caracteres • Opcional, debe
                            contener letras
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

                        {/* BUSCADOR DE PRODUCTOS */}
                        <div className="mb-3 position-relative">
                          <label className="form-label">Buscar producto</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Escribe el nombre del producto..."
                            value={busqueda}
                            onChange={(e) => {
                              setBusqueda(e.target.value);
                              setProductoSeleccionado(null);
                            }}
                          />

                          {/* RESULTADOS */}
                          {busqueda && !productoSeleccionado && (
                            <div className="list-group position-absolute w-100 shadow z-3">
                              {loadingProductos ? (
                                <div className="list-group-item text-muted">
                                  Cargando...
                                </div>
                              ) : productosFiltrados.length === 0 ? (
                                <div className="list-group-item text-muted">
                                  No se encontraron productos
                                </div>
                              ) : (
                                productosFiltrados.slice(0, 6).map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    className="list-group-item list-group-item-action"
                                    onClick={() => {
                                      setProductoSeleccionado(p);
                                      setBusqueda(p.nombre);
                                    }}
                                  >
                                    {p.nombre}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        {/* PRODUCTO SELECCIONADO */}
                        {productoSeleccionado && (
                          <div className="alert alert-success py-2 d-flex justify-content-between align-items-center">
                            <small>
                              <i className="bx bx-check-circle me-1"></i>
                              Producto seleccionado:{" "}
                              <strong>{productoSeleccionado.nombre}</strong>
                            </small>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => {
                                setProductoSeleccionado(null);
                                setBusqueda("");
                              }}
                            >
                              Cambiar
                            </button>
                          </div>
                        )}

                        {/* IMAGEN PRINCIPAL */}
                        <div className="mb-3">
                          <label className="form-label">Imagen Principal</label>
                          <input
                            ref={inputPrincipalRef}
                            type="file"
                            accept="image/*"
                            className="form-control"
                            disabled={!productoSeleccionado}
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              setImagenPrincipal(file);
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setPreviewPrincipal(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              } else {
                                setPreviewPrincipal(null);
                              }
                            }}
                          />
                          {previewPrincipal && (
                            <div className="mt-2">
                              <img
                                src={previewPrincipal}
                                alt="Preview Principal"
                                className="img-fluid rounded"
                                style={{
                                  maxHeight: "200px",
                                  objectFit: "cover",
                                  border: "2px solid #32acbe",
                                }}
                              />
                              <small className="text-muted d-block mt-2">
                                {imagenPrincipal?.name}
                              </small>
                            </div>
                          )}
                        </div>

                        {/* IMAGEN SECUNDARIA */}
                        <div className="mb-3">
                          <label className="form-label">
                            Imagen Secundaria
                          </label>
                          <input
                            ref={inputSecundariaRef}
                            type="file"
                            accept="image/*"
                            className="form-control"
                            disabled={!productoSeleccionado}
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              setImagenSecundaria(file);
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setPreviewSecundaria(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              } else {
                                setPreviewSecundaria(null);
                              }
                            }}
                          />
                          {previewSecundaria && (
                            <div className="mt-2">
                              <img
                                src={previewSecundaria}
                                alt="Preview Secundaria"
                                className="img-fluid rounded"
                                style={{
                                  maxHeight: "200px",
                                  objectFit: "cover",
                                  border: "2px solid #32acbe",
                                }}
                              />
                              <small className="text-muted d-block mt-2">
                                {imagenSecundaria?.name}
                              </small>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn btn-success w-100"
                          disabled={
                            subiendoImagenes ||
                            !productoSeleccionado ||
                            (!imagenPrincipal && !imagenSecundaria)
                          }
                          onClick={async () => {
                            if (!productoSeleccionado) return;

                            setSubiendoImagenes(true);

                            try {
                              if (imagenPrincipal) {
                                await uploadImagen(
                                  productoSeleccionado.id,
                                  imagenPrincipal,
                                  "principal",
                                );
                              }

                              if (imagenSecundaria) {
                                await uploadImagen(
                                  productoSeleccionado.id,
                                  imagenSecundaria,
                                  "secundaria",
                                );
                              }

                              setMessageImageModal(
                                "¡Imágenes subidas correctamente!",
                              );
                              setShowImageSuccess(true);
                              setImagenPrincipal(null);
                              setImagenSecundaria(null);
                              setPreviewPrincipal(null);
                              setPreviewSecundaria(null);
                              // 🔥 RESET VISUAL DE LOS INPUT FILE
                              if (inputPrincipalRef.current) {
                                inputPrincipalRef.current.value = "";
                              }

                              if (inputSecundariaRef.current) {
                                inputSecundariaRef.current.value = "";
                              }
                              // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            } catch (e) {
                              setMessageImageModal(
                                "Error al subir imágenes. Intenta de nuevo.",
                              );
                              setShowImageError(true);
                            } finally {
                              setSubiendoImagenes(false);
                            }
                          }}
                        >
                          {subiendoImagenes
                            ? "Subiendo..."
                            : "Guardar Imágenes"}
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

            {/* Modal éxito - Imágenes */}
            {showImageSuccess && (
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
                        onClick={() => setShowImageSuccess(false)}
                        aria-label="Close"
                      ></button>
                    </div>
                    <div className="modal-body">
                      <p>
                        <strong>¡Imágenes subidas correctamente!</strong>
                      </p>
                      <p className="text-muted small mb-0">
                        {messageImageModal}
                      </p>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => setShowImageSuccess(false)}
                      >
                        Aceptar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal error - Imágenes */}
            {showImageError && (
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
                        onClick={() => setShowImageError(false)}
                        aria-label="Close"
                      ></button>
                    </div>
                    <div className="modal-body">
                      <p>
                        <strong>No se pudieron subir las imágenes</strong>
                      </p>
                      <p className="text-muted small mb-0">
                        {messageImageModal}
                      </p>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowImageError(false)}
                      >
                        Intentar de nuevo
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => setShowImageError(false)}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Backdrop para los modales de imágenes */}
            {(showImageSuccess || showImageError) && (
              <div
                className="modal-backdrop fade show"
                onClick={() => {
                  setShowImageSuccess(false);
                  setShowImageError(false);
                }}
              ></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
