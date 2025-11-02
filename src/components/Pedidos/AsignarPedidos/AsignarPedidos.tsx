import React, { useEffect, useState } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./AsignarPedidos.css";

type TipoEnvio = "Envio" | "Recoger";

interface DetalleRow {
  id: string;
  productoId: string;
  cantidad: number;
  precioUnit: number;
  subtotal: number;
}

interface Direccion {
  ciudad: string;
  calle: string;
  referencia: string;
}

const sampleProducts = [
  { id: "p1", nombre: "Producto A", precio: 25.0 },
  { id: "p2", nombre: "Producto B", precio: 45.5 },
  { id: "p3", nombre: "Producto C", precio: 12.3 },
];

const sampleUsers = [
  { id: "u1", nombre: "Juan Pérez" },
  { id: "u2", nombre: "María García" },
];

const sampleComprobantes = [
  { id: "c1", nombre: "Boleta" },
  { id: "c2", nombre: "Factura" },
];

const sampleMetodos = [
  { id: "m1", nombre: "Efectivo" },
  { id: "m2", nombre: "Tarjeta" },
];

export default function AsignarPedidos() {
  // Estados
  const [ventaCreada, setVentaCreada] = useState(false);
  const [tipo, setTipo] = useState<TipoEnvio>("Envio");
  const [idDireccion, setIdDireccion] = useState<string | null>(null);
  const [direccion, setDireccion] = useState<Direccion | null>(null);
  const [rucRequired, setRucRequired] = useState(false);
  const [ruc, setRuc] = useState("");
  const [rows, setRows] = useState<DetalleRow[]>([
    { id: "r1", productoId: "", cantidad: 1, precioUnit: 0, subtotal: 0 },
  ]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const t = rows.reduce((s, r) => s + r.subtotal, 0);
    setTotal(parseFloat(t.toFixed(2)));
  }, [rows]);

  function handleCrearVenta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setVentaCreada(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleTipoChange(v: TipoEnvio) {
    setTipo(v);
    if (v === "Recoger") {
      setIdDireccion(null);
      setDireccion(null);
    }
  }

  function handleComprobanteChange(id: string) {
    const comp = sampleComprobantes.find((c) => c.id === id);
    setRucRequired(comp?.nombre?.toLowerCase() === "factura");
    if (!(comp?.nombre?.toLowerCase() === "factura")) setRuc("");
  }

  // modal dirección (simulado)
  function guardarDireccionSimulada() {
    const ciudad =
      (document.getElementById("ciudadInput") as HTMLInputElement)?.value || "";
    const calle =
      (document.getElementById("calleInput") as HTMLInputElement)?.value || "";
    const referencia =
      (document.getElementById("refInput") as HTMLTextAreaElement)?.value || "";

    if (ciudad) {
      const nuevaDireccion = { ciudad, calle, referencia };
      setDireccion(nuevaDireccion);
      setIdDireccion("dir-" + Date.now());

      // Mostrar la dirección guardada
      const direccionTexto = `${nuevaDireccion.ciudad}, ${nuevaDireccion.calle}`;
      const direccionSpan = document.querySelector(".direccion-guardada");
      if (direccionSpan) {
        direccionSpan.textContent = direccionTexto;
      }

      // Cerrar modal usando Bootstrap 5
      const modalElement = document.getElementById("modalDireccion");
      if (modalElement) {
        // @ts-expect-error Bootstrap types not available
        const modal = window.bootstrap?.Modal.getInstance(modalElement);
        modal?.hide();
      }
    }
  }

  // detalle filas
  function addRow() {
    setRows((r) => [
      ...r,
      {
        id: "r" + Date.now(),
        productoId: "",
        cantidad: 1,
        precioUnit: 0,
        subtotal: 0,
      },
    ]);
  }
  function removeRow(id: string) {
    setRows((r) => r.filter((x) => x.id !== id));
  }
  function updateRowProducto(id: string, productoId: string) {
    const prod = sampleProducts.find((p) => p.id === productoId);
    setRows((r) =>
      r.map((row) =>
        row.id === id
          ? {
              ...row,
              productoId,
              precioUnit: prod ? prod.precio : 0,
              subtotal: Number(
                ((prod ? prod.precio : 0) * row.cantidad).toFixed(2)
              ),
            }
          : row
      )
    );
  }
  function updateRowCantidad(id: string, cantidad: number) {
    setRows((r) =>
      r.map((row) =>
        row.id === id
          ? {
              ...row,
              cantidad,
              subtotal: Number((row.precioUnit * cantidad).toFixed(2)),
            }
          : row
      )
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-area">
        <Nav />
        <div className="page-wrapper">
          <div className="page-content">
            <div className="page-breadcrumb d-none d-sm-flex align-items-center mb-3">
              <div className="breadcrumb-title pe-3">Comercio Electrónico</div>
              <div className="ps-3">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0 p-0">
                    <li className="breadcrumb-item">
                      <i className="bx bx-home-alt"></i>
                    </li>
                    <li className="breadcrumb-item active">Asignar Pedidos</li>
                  </ol>
                </nav>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                {!ventaCreada ? (
                  <form onSubmit={handleCrearVenta}>
                    <div className="row mb-3">
                      <div className="col-md-3">
                        <label>Fecha Pedido</label>
                        <input
                          type="date"
                          className="form-control"
                          defaultValue={new Date().toISOString().slice(0, 10)}
                          required
                        />
                      </div>
                      <div className="col-md-3">
                        <label>Fecha Envío</label>
                        <input
                          type="date"
                          className="form-control"
                          defaultValue={new Date().toISOString().slice(0, 10)}
                          required
                        />
                      </div>
                      <div className="col-md-3">
                        <label>Tipo</label>
                        <select
                          className="form-select"
                          value={tipo}
                          onChange={(e) =>
                            handleTipoChange(e.target.value as TipoEnvio)
                          }
                        >
                          <option value="Envio">Envio</option>
                          <option value="Recoger">Recoger</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label>Tipo de Comprobante</label>
                        <select
                          className="form-select"
                          onChange={(e) =>
                            handleComprobanteChange(e.target.value)
                          }
                          defaultValue=""
                        >
                          <option value="">Seleccione</option>
                          {sampleComprobantes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div
                      className="row mb-3"
                      style={{ display: rucRequired ? "flex" : "none" }}
                    >
                      <div className="col-md-4">
                        <label>RUC</label>
                        <input
                          className="form-control"
                          value={ruc}
                          onChange={(e) => setRuc(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-3">
                        <label>Usuario</label>
                        <select className="form-select" defaultValue="">
                          <option value="">Seleccione</option>
                          {sampleUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label>Método de Pago</label>
                        <select className="form-select" defaultValue="">
                          <option value="">Seleccione</option>
                          {sampleMetodos.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div
                        className="col-md-3"
                        style={{
                          display: tipo === "Envio" ? undefined : "none",
                        }}
                      >
                        <label>Dirección de Envío</label>
                        <br />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          data-bs-toggle="modal"
                          data-bs-target="#modalDireccion"
                        >
                          Agregar Dirección
                        </button>
                        {idDireccion && (
                          <div className="mt-2">
                            <span className="text-success">
                              Dirección guardada:
                            </span>
                            <br />
                            <small className="direccion-guardada">
                              {direccion
                                ? `${direccion.ciudad}, ${direccion.calle}`
                                : ""}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-end">
                      <button className="btn btn-primary" type="submit">
                        Crear Venta
                      </button>
                    </div>
                  </form>
                ) : (
                  <form>
                    <input type="hidden" name="id_venta" value="SIMULADO" />
                    <table className="table table-bordered" id="tablaDetalles">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Cantidad</th>
                          <th>Precio Unitario</th>
                          <th>Sub Total</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.id}>
                            <td>
                              <select
                                className="form-select"
                                value={row.productoId}
                                onChange={(e) =>
                                  updateRowProducto(row.id, e.target.value)
                                }
                              >
                                <option value="">Seleccione</option>
                                {sampleProducts.map((p) => (
                                  <option
                                    key={p.id}
                                    value={p.id}
                                    data-precio={p.precio}
                                  >
                                    {p.nombre}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                min={1}
                                className="form-control"
                                value={row.cantidad}
                                onChange={(e) =>
                                  updateRowCantidad(
                                    row.id,
                                    Number(e.target.value || 1)
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                readOnly
                                value={row.precioUnit.toFixed(2)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                readOnly
                                value={row.subtotal.toFixed(2)}
                              />
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-success"
                                  onClick={addRow}
                                >
                                  <i className="bx bx-plus"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger"
                                  onClick={() => removeRow(row.id)}
                                >
                                  <i className="bx bx-minus"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="text-end mb-3">
                      <strong>Total (S/):</strong>{" "}
                      <span id="totalVenta">{total.toFixed(2)}</span>
                    </div>

                    <div className="text-end">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                          alert("Simulación: detalles guardados (frontend).")
                        }
                      >
                        Guardar Detalles y Finalizar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Modal Dirección (simulado) */}
            <div
              className="modal fade"
              id="modalDireccion"
              tabIndex={-1}
              aria-hidden="true"
            >
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Agregar Dirección</h5>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Cerrar"
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label>Ciudad</label>
                      <input id="ciudadInput" className="form-control" />
                    </div>
                    <div className="mb-3">
                      <label>Calle</label>
                      <input id="calleInput" className="form-control" />
                    </div>
                    <div className="mb-3">
                      <label>Referencia</label>
                      <textarea
                        id="refInput"
                        className="form-control"
                        rows={2}
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={guardarDireccionSimulada}
                    >
                      Guardar Dirección
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
