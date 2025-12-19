import React, { useEffect, useState } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./AsignarPedidos.css";

interface DetalleRow {
  id: string;
  productoId: string;
  productoName?: string;
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
  { id: "Boleta", nombre: "Boleta" },
  { id: "Factura", nombre: "Factura" },
];

export default function AsignarPedidos() {
  // Estados
  const [idDireccion, setIdDireccion] = useState<string | null>(null);
  const [rows, setRows] = useState<DetalleRow[]>([
    {
      id: "r1",
      productoId: "",
      productoName: "",
      cantidad: 1,
      precioUnit: 0,
      subtotal: 0,
    },
  ]);
  const [total, setTotal] = useState(0);
  const [productos, setProductos] = useState<ProductoAPI[]>([]);

  const [selectedComprobante, setSelectedComprobante] = useState<string>("");
  const [ruc, setRuc] = useState<string>("");
  const [productoSuggestions, setProductoSuggestions] = useState<
    Record<string, ProductoAPI[]>
  >({});

  const [selectedMetodoPago, setSelectedMetodoPago] = useState<string>("");
  const [selectedEstado, setSelectedEstado] = useState<string>("Pendiente");
  const [tipoEntrega, setTipoEntrega] = useState<string>("Envío");
  const [ciudad, setCiudad] = useState<string>("");
  const [calle, setCalle] = useState<string>("");
  const [referencia, setReferencia] = useState<string>("");

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
              productoName: prod ? String(prod.nombre) : "",
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

  function handleProductoInputChange(rowId: string, text: string) {
    setRows((r) =>
      r.map((row) => (row.id === rowId ? { ...row, productoName: text } : row))
    );
    if (!text) {
      setProductoSuggestions((s) => ({ ...s, [rowId]: [] }));
      return;
    }
    const q = text.toLowerCase();
    const matches = productos
      .filter((p) => String(p.nombre).toLowerCase().includes(q))
      .slice(0, 8);
    setProductoSuggestions((s) => ({ ...s, [rowId]: matches }));
    const exact = productos.find((p) => String(p.nombre).toLowerCase() === q);
    if (exact) {
      updateRowProducto(rowId, String(exact.id));
    }
  }

  function selectProductoSuggestion(rowId: string, prod: ProductoAPI) {
    updateRowProducto(rowId, String(prod.id));
    setProductoSuggestions((s) => ({ ...s, [rowId]: [] }));
  }

  // Crear venta y enviar al backend
  async function handleCrearVenta(e?: React.FormEvent<HTMLFormElement>) {
    if (e) e.preventDefault();

    if (!selectedUsuario) {
      alert("Seleccione un usuario.");
      return;
    }

    if (tipoEntrega === "Envío" && !ciudad) {
      alert("Debe ingresar una dirección para envío a domicilio.");
      return;
    }

    // Validar que todos los productos tengan cantidad mayor a 0
    if (rows.some((r) => !r.productoId || r.cantidad <= 0)) {
      alert("Complete todos los detalles de productos con cantidad válida.");
      return;
    }

    // Construir detalles con nombres en snake_case
    const details = rows.map((r) => ({
      id_producto: Number(r.productoId),
      cantidad: Number(r.cantidad),
      costo: Number(r.precioUnit),
    }));

    const payload = {
      id_usuario: Number(selectedUsuario),
      metodo_pago: selectedMetodoPago || null,
      comprobante: selectedComprobante || null,
      id_direccion: tipoEntrega === "Recojo" ? null : idDireccion || null,
      ciudad: tipoEntrega === "Envío" ? ciudad : null,
      calle: tipoEntrega === "Envío" ? calle : null,
      referencia: tipoEntrega === "Envío" ? referencia : null,
      costo_total: Number(total),
      estado: selectedEstado,
      details,
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
        setCiudad("");
        setCalle("");
        setReferencia("");
        setSelectedMetodoPago("");
        setSelectedComprobante("");
        setRuc("");
        setSelectedEstado("Pendiente");
        setTipoEntrega("Envío");
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
    setSelectedComprobante(id);
    const comp = sampleComprobantes.find((c) => c.id === id);
    const isFactura = comp?.nombre?.toLowerCase() === "factura";
    if (!isFactura) {
      setRuc("");
    }
  }

  // modal dirección
  function guardarDireccionSimulada() {
    const ciudadInput =
      (document.getElementById("ciudadInput") as HTMLInputElement)?.value || "";
    const calleInput =
      (document.getElementById("calleInput") as HTMLInputElement)?.value || "";
    const referenciaInput =
      (document.getElementById("refInput") as HTMLTextAreaElement)?.value || "";

    if (ciudadInput) {
      setCiudad(ciudadInput);
      setCalle(calleInput);
      setReferencia(referenciaInput);
      setIdDireccion("dir-" + Date.now());
      const modalElement = document.getElementById("modalDireccion");
      if (modalElement) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const modal = (window as any).bootstrap?.Modal.getInstance(
          modalElement
        );
        modal?.hide();
      }
    } else {
      alert("Ingrese al menos la ciudad.");
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
                {/* Unificado: datos generales de venta ANTES y tabla de productos ABAJO */}
                <form onSubmit={handleCrearVenta}>
                  <div className="card mb-3">
                    <div className="card-body">
                      <div className="row gy-2">
                        <div className="col-md-4">
                          <label className="form-label">Usuario</label>
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
                          <label className="form-label">Id</label>
                          <input
                            className="form-control"
                            readOnly
                            value={"auto"}
                          />
                        </div>

                        <div className="col-md-3">
                          <label className="form-label">Fecha</label>
                          <input
                            className="form-control"
                            readOnly
                            value={new Date().toISOString().slice(0, 10)}
                          />
                        </div>

                        <div className="col-md-3">
                          <label className="form-label">Método de Pago</label>
                          <select
                            className="form-select"
                            value={selectedMetodoPago}
                            onChange={(e) =>
                              setSelectedMetodoPago(e.target.value)
                            }
                          >
                            <option value="">Seleccione</option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta">Tarjeta</option>
                            <option value="Deposito">Deposito</option>
                            <option value="Yape">Yape</option>
                          </select>
                        </div>

                        <div className="col-md-3">
                          <label className="form-label">Comprobante</label>
                          <select
                            className="form-select"
                            value={selectedComprobante}
                            onChange={(e) =>
                              handleComprobanteChange(e.target.value)
                            }
                          >
                            <option value="">Seleccione</option>
                            {sampleComprobantes.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/** Mostrar RUC si se eligió Factura */}
                        {sampleComprobantes
                          .find((c) => c.id === selectedComprobante)
                          ?.nombre?.toLowerCase() === "factura" && (
                          <div className="col-md-3">
                            <label className="form-label">RUC Cliente</label>
                            <input
                              id="rucInput"
                              className="form-control"
                              value={ruc}
                              onChange={(e) => setRuc(e.target.value)}
                              placeholder="Ingresa RUC"
                            />
                          </div>
                        )}

                        <div className="col-md-6">
                          <label className="form-label">Tipo de Entrega</label>
                          <select
                            className="form-select"
                            value={tipoEntrega}
                            onChange={(e) => {
                              setTipoEntrega(e.target.value);
                              if (e.target.value === "Recojo")
                                setIdDireccion(null);
                            }}
                          >
                            <option value="Envío">Envío a domicilio</option>
                            <option value="Recojo">Recojo en tienda</option>
                          </select>
                        </div>

                        {tipoEntrega === "Envío" && (
                          <div className="col-md-6">
                            <label className="form-label">Dirección</label>
                            <div className="d-flex gap-2">
                              <input
                                id="direccionInput"
                                className="form-control"
                                placeholder="Agregar o seleccionar dirección"
                                value={idDireccion ?? ""}
                                onChange={(e) =>
                                  setIdDireccion(e.target.value || null)
                                }
                              />
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                data-bs-toggle="modal"
                                data-bs-target="#modalDireccion"
                              >
                                <i className="bx bx-map"></i>
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="col-md-6">
                          <label className="form-label">Estado</label>
                          <select
                            className="form-select"
                            value={selectedEstado}
                            onChange={(e) => setSelectedEstado(e.target.value)}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Entregado">Entregado</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                        </div>

                        <div className="col-12 mt-2">
                          <label className="form-label">Costo total (S/)</label>
                          <input
                            className="form-control"
                            readOnly
                            value={total.toFixed(2)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de productos */}
                  <div className="card">
                    <div className="card-body">
                      <table
                        className="table table-bordered"
                        id="tablaDetalles"
                      >
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
                                <div style={{ position: "relative" }}>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={row.productoName ?? ""}
                                    onChange={(e) =>
                                      handleProductoInputChange(
                                        row.id,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Buscar producto..."
                                  />
                                  {productoSuggestions[row.id] &&
                                    productoSuggestions[row.id].length > 0 && (
                                      <ul
                                        className="list-group"
                                        style={{
                                          position: "absolute",
                                          zIndex: 9999,
                                          width: "100%",
                                          maxHeight: 220,
                                          overflowY: "auto",
                                        }}
                                      >
                                        {productoSuggestions[row.id].map(
                                          (p) => (
                                            <li
                                              key={p.id}
                                              className="list-group-item list-group-item-action"
                                              style={{ cursor: "pointer" }}
                                              onClick={() =>
                                                selectProductoSuggestion(
                                                  row.id,
                                                  p
                                                )
                                              }
                                            >
                                              {p.nombre}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    )}
                                </div>
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
                    </div>
                  </div>
                </form>
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
