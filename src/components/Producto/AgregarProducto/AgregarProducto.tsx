import React, { useState } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import { Link } from "react-router-dom";
import "./AgregarProducto.css";

export default function AgregarProducto() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [costoUnit, setCostoUnit] = useState<number | "">("");
  const [categoria, setCategoria] = useState("");
  const [marca, setMarca] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [previewPrincipal, setPreviewPrincipal] = useState<string | null>(null);
  const [previewSecundaria, setPreviewSecundaria] = useState<string | null>(
    null
  );
  const [showSuccess, setShowSuccess] = useState(false);

  // Datos de ejemplo (mantén consistencia con el proyecto)
  const categoriasEjemplo = [
    { id: "1", nombre: "Laptops" },
    { id: "2", nombre: "Monitores" },
    { id: "3", nombre: "Accesorios" },
  ];

  const productosEjemplo = [
    { id: "1", nombre: "Laptop Dell XPS" },
    { id: "2", nombre: "Monitor LG 27'" },
    { id: "3", nombre: "Laptop HP Pavilion" },
  ];

  const handleFilePreview = (
    file: File | null,
    setPreview: (v: string | null) => void
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

  const submitProducto = (e: React.FormEvent) => {
    e.preventDefault();
    // Simular guardado frontend-only
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1200);
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
                    <div className="col-lg-7">
                      <div className="border border-3 p-4 rounded">
                        <div className="mb-3">
                          <label className="form-label">
                            Nombre del Producto
                          </label>
                          <input
                            className="form-control"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ingresa el nombre del producto"
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Descripción</label>
                          <textarea
                            className="form-control"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Describe el producto"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Costo Unitario</label>
                          <div className="input-group">
                            <span className="input-group-text">S/</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="form-control"
                              value={costoUnit === "" ? "" : String(costoUnit)}
                              onChange={(e) => {
                                const v = e.target.value;
                                setCostoUnit(v === "" ? "" : Number(v));
                              }}
                              placeholder="00.00"
                              required
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Categoría</label>
                          <select
                            className="form-select"
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            required
                          >
                            <option value="">Seleccionar Categoría</option>
                            {categoriasEjemplo.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Marca</label>
                          <input
                            className="form-control"
                            value={marca}
                            onChange={(e) => setMarca(e.target.value)}
                            placeholder="Ingresa la marca del producto"
                            required
                          />
                        </div>

                        <button type="submit" className="btn btn-primary w-100">
                          Guardar Producto
                        </button>
                      </div>
                    </div>

                    <div className="col-lg-5">
                      <div className="border border-3 p-4 rounded">
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
                            required
                          >
                            <option value="">Seleccionar Producto</option>
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
                          onClick={() => {
                            // Simula subir imágenes (frontend only)
                            if (!productoSeleccionado) {
                              // puedes mostrar un mensaje si quieres
                              return;
                            }
                            setShowSuccess(true);
                            setTimeout(() => setShowSuccess(false), 1200);
                          }}
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
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header bg-success text-white">
                      <h5 className="modal-title">✅ Éxito</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowSuccess(false)}
                      ></button>
                    </div>
                    <div className="modal-body">
                      ¡Operación simulada correctamente!
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
