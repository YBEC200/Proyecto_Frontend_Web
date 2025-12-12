import React, { useEffect, useState } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./AsignarPedidos.css";

interface DetalleRow {
  id: string;
  productoId: string;
  cantidad: number;
  precioUnit: number;
  subtotal: number;
}

interface ProductoAPI {
  id: number;
  nombre: string;
  costo_unit?: number;
}

interface LoteAPI {
  Id: number;
  Lote: string;
  Id_Producto: number;
  Cantidad: number;
  Fecha_Registro: string;
}

interface UsuarioAPI {
  id: number;
  nombre: string;
}

const sampleComprobantes = [
  { id: "c1", nombre: "Boleta" },
  { id: "c2", nombre: "Factura" },
];

export default function AsignarPedidos() {
  // Estados
  const [ventaCreada, setVentaCreada] = useState(false);
  const [idDireccion, setIdDireccion] = useState<string | null>(null);
  const [rows, setRows] = useState<DetalleRow[]>([
    {
      id: "r1",
      productoId: "",
      cantidad: 1,
      precioUnit: 0,
      subtotal: 0,
    },
  ]);
  const [total, setTotal] = useState(0);

  const [productos, setProductos] = useState<ProductoAPI[]>([]);
  const [lotesByProduct, setLotesByProduct] = useState<
    Record<number, LoteAPI[]>
  >({});
  const [usuarios, setUsuarios] = useState<UsuarioAPI[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState<string>("");

  useEffect(() => {
    const t = rows.reduce((s, r) => s + r.subtotal, 0);
    setTotal(parseFloat(t.toFixed(2)));
  }, [rows]);

  // Fetch inicial: productos y usuarios
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };

    (async () => {
      try {
        const [pRes, uRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/productos", { headers }),
          fetch("http://127.0.0.1:8000/api/usuarios", { headers }),
        ]);
        if (pRes.ok) {
          const pData = await pRes.json();
          // Normalizar id/nombre
          setProductos(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (pData || []).map((p: any) => ({
              id: Number(p.id ?? p.Id ?? p.id_producto),
              nombre: p.nombre ?? p.Nombre,
              costo_unit: Number(p.costo_unit ?? p.Costo_unit ?? 0),
            }))
          );
        }
        if (uRes.ok) {
          const uData = await uRes.json();
          setUsuarios(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (uData || []).map((u: any) => ({
              id: Number(u.id ?? u.Id ?? u.IdUsuario),
              nombre: u.nombre ?? (u.Nombre || u.correo),
            }))
          );
        }
      } catch (err) {
        console.error("Error fetch inicial:", err);
      }
    })();
  }, []);

  // Obtener lotes para un producto
  const fetchLotesForProduct = async (productId: number) => {
    if (!productId) return;
    if (lotesByProduct[productId]) return; // ya cargado
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/lotes?product_id=${productId}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      setLotesByProduct((s) => ({ ...s, [productId]: data }));
    } catch (err) {
      console.error("Error fetching lotes:", err);
    }
  };

  // Gestión de filas
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
    const prod = productos.find((p) => String(p.id) === productoId);
    const pid = prod ? prod.id : 0;
    // cargar lotes del producto
    if (pid) fetchLotesForProduct(pid);
    setRows((r) =>
      r.map((row) =>
        row.id === id
          ? {
              ...row,
              productoId: productoId,
              precioUnit: prod
                ? Number(prod.costo_unit ?? prod.costo_unit ?? 0)
                : 0,
              subtotal: Number(
                (
                  (prod ? Number(prod.costo_unit ?? 0) : 0) * row.cantidad
                ).toFixed(2)
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

  // Crear venta y enviar al backend
  async function handleCrearVenta(e?: React.FormEvent<HTMLFormElement>) {
    if (e) e.preventDefault();

    if (!selectedUsuario) {
      alert("Seleccione un usuario.");
      return;
    }

    // Validar que todos los productos tengan cantidad mayor a 0
    if (rows.some((r) => !r.productoId || r.cantidad <= 0)) {
      alert("Complete todos los detalles de productos con cantidad válida.");
      return;
    }

    const detalles = rows.map((r) => ({
      Id_Producto: Number(r.productoId),
      Cantidad: Number(r.cantidad),
      Costo: Number(r.precioUnit),
    }));

    const payload = {
      Id_Usuario: Number(selectedUsuario),
      Id_Metodo_Pago: null,
      Id_Comprobante: null,
      Id_Direccion: idDireccion ? idDireccion : null,
      Fecha: new Date().toISOString().slice(0, 10),
      Costo_total: Number(total),
      estado: "pendiente",
      detalles,
    };

    console.log("Payload a enviar:", payload);

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/ventas", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        alert("Venta creada correctamente.");
        // Reset básico
        setRows([
          {
            id: "r" + Date.now(),
            productoId: "",
            cantidad: 1,
            precioUnit: 0,
            subtotal: 0,
          },
        ]);
        setTotal(0);
        setSelectedUsuario("");
        setIdDireccion(null);
        setVentaCreada(false);
      } else {
        console.error("Error crear venta:", body);
        alert(body?.message || `Error ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (err) {
      console.error("Fetch error crear venta:", err);
      alert("Error de conexión al crear la venta.");
    }
  }

  function handleComprobanteChange(id: string) {
    const comp = sampleComprobantes.find((c) => c.id === id);
    const isFactura = comp?.nombre?.toLowerCase() === "factura";
    if (!isFactura) {
      const rucInput = document.getElementById("rucInput") as HTMLInputElement;
      if (rucInput) rucInput.value = "";
    }
  }

  // modal dirección (simulado)
  function guardarDireccionSimulada() {
    const ciudad =
      (document.getElementById("ciudadInput") as HTMLInputElement)?.value || "";
    const calle =
      (document.getElementById("calleInput") as HTMLInputElement)?.value || "";

    if (ciudad) {
      setIdDireccion("dir-" + Date.now());
      const direccionTexto = `${ciudad}, ${calle}`;
      const direccionSpan = document.querySelector(".direccion-guardada");
      if (direccionSpan) direccionSpan.textContent = direccionTexto;
      const modalElement = document.getElementById("modalDireccion");
      if (modalElement) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const modal = (window as any).bootstrap?.Modal.getInstance(
          modalElement
        );
        modal?.hide();
      }
    }
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
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setVentaCreada(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
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
                        <label>Usuario</label>
                        <select
                          className="form-select"
                          value={selectedUsuario}
                          onChange={(e) => setSelectedUsuario(e.target.value)}
                        >
                          <option value="">Seleccione</option>
                          {usuarios.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nombre}
                            </option>
                          ))}
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

                    <div className="text-end">
                      <button className="btn btn-primary" type="submit">
                        Crear Venta
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleCrearVenta}>
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
                            <td style={{ minWidth: 220 }}>
                              <select
                                className="form-select"
                                value={row.productoId}
                                onChange={(e) =>
                                  updateRowProducto(row.id, e.target.value)
                                }
                              >
                                <option value="">Seleccione</option>
                                {productos.map((p) => (
                                  <option key={p.id} value={p.id}>
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
                                  className="btn btn-success btn-sm"
                                  onClick={addRow}
                                  title="Agregar fila"
                                >
                                  <i className="bx bx-plus"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => removeRow(row.id)}
                                  disabled={rows.length === 1}
                                  title="Eliminar fila"
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
                      <button type="submit" className="btn btn-primary">
                        Guardar Venta
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Modal Dirección (simulado) */}
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
