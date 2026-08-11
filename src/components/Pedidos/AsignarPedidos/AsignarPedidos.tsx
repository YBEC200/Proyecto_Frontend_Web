/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./AsignarPedidos.css";
import { QRCodeCanvas } from "qrcode.react";
const API_URL = import.meta.env.VITE_API_URL;
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
  estado?: string;
  costo_unit?: number;
  precio?: number;
  cantidad?: number;
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
  const DISTRITOS_HUANCAYO = [
    "Huancayo",
    "El Tambo",
    "Chilca",
    "Pilcomayo",
    "Huancán",
    "San Agustín de Cajas",
    "Sapallanga",
  ];
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
  // Estado dinámico según tipo de entrega
  // Recojo = Entregado, Envío = Pendiente
  const [selectedEstado, setSelectedEstado] = useState<string>("Pendiente");
  // Función para obtener fecha y hora actual en formato datetime
  const getFechaActual = (): string => {
    const now = new Date();
    // Formato: YYYY-MM-DD HH:mm:ss
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  const [tipoEntrega, setTipoEntrega] = useState<string>("Envío a Domicilio");
  const [ciudad, setCiudad] = useState<string>("");
  const [, setCalle] = useState<string>("");
  const [, setReferencia] = useState<string>("");

  const [lotesByProduct, setLotesByProduct] = useState<
    Record<number, LoteAPI[]>
  >({});
  const [usuarios, setUsuarios] = useState<UsuarioAPI[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState<string>("");

  // Estados para modales de éxito y error
  const [showModalSuccess, setShowModalSuccess] = useState(false);
  const [showModalError, setShowModalError] = useState(false);
  const [showModalDireccion, setShowModalDireccion] = useState(false);
  const [showModalDireccionExito, setShowModalDireccionExito] = useState(false);
  const [showModalDuplicado, setShowModalDuplicado] = useState(false);
  const [showModalValidacion, setShowModalValidacion] = useState(false);
  const [erroresValidacion, setErroresValidacion] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [successData, setSuccessData] = useState<Record<string, unknown>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState<Record<string, string>>({});
  const [mensajeDuplicado, setMensajeDuplicado] = useState("");
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [, setDireccionTexto] = useState<string>("");
  const [pendingVentaPayload, setPendingVentaPayload] = useState<any>(null);

  const [direccionExitoData, setDireccionExitoData] = useState<
    Record<string, string>
  >({});

  useEffect(() => {}, [showModalSuccess, showModalError]);

  // Actualizar estado según tipo de entrega
  useEffect(() => {
    if (tipoEntrega === "Recojo en Tienda") {
      setSelectedEstado("Entregado");
    } else {
      setSelectedEstado("Pendiente");
    }
  }, [tipoEntrega]);

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
        const [uRes] = await Promise.all([
          fetch(`${API_URL}/api/usuarios`, { headers }),
        ]);

        if (uRes.ok) {
          const uData = await uRes.json();
          setUsuarios(
            (uData || []).map((u: any) => ({
              id: Number(u.id ?? u.Id ?? u.IdUsuario),
              nombre: u.nombre ?? (u.Nombre || u.correo),
            })),
          );
        }
      } catch (err) {
        console.error("Error fetch inicial:", err);
      }
    })();
  }, []);

  async function buscarProductosVenta(texto: string, rowId: string) {
    const valor = texto.trim();

    if (!valor) {
      setProductoSuggestions((s) => ({ ...s, [rowId]: [] }));
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${API_URL}/api/productos/buscar-para-venta?nombre=${encodeURIComponent(valor)}&limit=8`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) {
        setProductoSuggestions((s) => ({ ...s, [rowId]: [] }));
        return;
      }

      const data = await res.json();

      const lista = (data.data || []).map((p: any) => ({
        id: Number(p.id),
        nombre: p.nombre,
        estado: p.estado ?? "disponible",
        costo_unit: Number(p.precio ?? p.costo_unit ?? 0),
        cantidad: Number(p.cantidad ?? 0),
      }));

      setProductos((prev) => {
        const map = new Map(
          prev.map((producto: ProductoAPI) => [producto.id, producto]),
        );
        lista.forEach((producto: ProductoAPI) =>
          map.set(producto.id, producto),
        );
        return Array.from(map.values());
      });

      setProductoSuggestions((s) => ({ ...s, [rowId]: lista }));
    } catch (err) {
      console.error("Error buscando productos:", err);
    }
  }

  const fetchLotesForProduct = async (productId: number) => {
    if (!productId) return;

    // Ya cargados
    if (lotesByProduct[productId]) return;

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${API_URL}/api/lotes?product_id=${productId}&page=1`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) return;

      const response = await res.json();

      // Los lotes ahora vienen dentro de "data"
      setLotesByProduct((s) => ({
        ...s,
        [productId]: response.data || [],
      }));
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
    const productoDuplicado = rows.some(
      (row) =>
        row.id !== id && row.productoId === productoId && productoId !== "",
    );

    if (productoDuplicado) {
      setMensajeDuplicado(
        "Este producto ya fue agregado. Aumenta la cantidad en esa fila en lugar de crear una nueva.",
      );
      setShowModalDuplicado(true);
      return;
    }

    const prod = productos.find((p) => String(p.id) === productoId);

    if (!prod) return;

    if (prod.id) {
      fetchLotesForProduct(prod.id);
    }

    const stockDisponible = Number(prod.cantidad ?? 0);

    const agotado = prod.estado === "agotado" || stockDisponible <= 0;

    if (agotado) {
      setMensajeDuplicado(
        "Este producto está agotado y no puede seleccionarse.",
      );
      setShowModalDuplicado(true);
      return;
    }

    setRows((r) =>
      r.map((row) =>
        row.id === id
          ? {
              ...row,
              productoId: String(prod.id),
              productoName: prod.nombre,
              precioUnit: Number(prod.costo_unit ?? prod.precio ?? 0),
              cantidad: 1,
              subtotal: Number(
                ((prod.costo_unit ?? prod.precio ?? 0) * 1).toFixed(2),
              ),
            }
          : row,
      ),
    );
  }
  function updateRowCantidad(id: string, cantidad: number) {
    const row = rows.find((r) => r.id === id);
    const producto = productos.find((p) => String(p.id) === row?.productoId);

    const stockDisponible = Number(producto?.cantidad ?? 1);

    const cantidadSegura = Number.isFinite(cantidad) ? Math.floor(cantidad) : 1;
    const cantidadValida = Math.min(
      Math.max(1, cantidadSegura),
      stockDisponible,
    );

    setRows((r) =>
      r.map((rowItem) =>
        rowItem.id === id
          ? {
              ...rowItem,
              cantidad: cantidadValida,
              subtotal: Number(
                (rowItem.precioUnit * cantidadValida).toFixed(2),
              ),
            }
          : rowItem,
      ),
    );
  }

  function handleProductoInputChange(rowId: string, text: string) {
    setRows((r) =>
      r.map((row) => (row.id === rowId ? { ...row, productoName: text } : row)),
    );

    buscarProductosVenta(text, rowId);
  }

  function selectProductoSuggestion(rowId: string, prod: ProductoAPI) {
    updateRowProducto(rowId, String(prod.id));
    setProductoSuggestions((s) => ({ ...s, [rowId]: [] }));
  }

  // Obtener detalles de lotes para un producto
  async function obtenerDetallesLotes(productoId: number): Promise<{
    totalDisponible: number;
    lotes: Array<{ nombre: string; cantidad: number; estado: string }>;
  }> {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${API_URL}/api/lotes?product_id=${productoId}&estado=Activo`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        },
      );
      if (!res.ok) {
        return { totalDisponible: 0, lotes: [] };
      }
      const lotes = await res.json();
      const totalDisponible = (lotes as Array<{ Cantidad: number }>).reduce(
        (sum, lote) => sum + (lote.Cantidad || 0),
        0,
      );
      const lotesFormato = (
        lotes as Array<{ Lote: string; Cantidad: number; Estado: string }>
      ).map((lote) => ({
        nombre: lote.Lote,
        cantidad: lote.Cantidad,
        estado: lote.Estado,
      }));
      return { totalDisponible, lotes: lotesFormato };
    } catch (err) {
      console.error("Error obteniendo lotes:", err);
      return { totalDisponible: 0, lotes: [] };
    }
  }

  // Función para validar el formulario antes de guardar
  function validarFormularioVenta(): boolean {
    const errores: string[] = [];

    // Validar usuario seleccionado
    if (!selectedUsuario || selectedUsuario.trim() === "") {
      errores.push("⚠️ Selecciona un cliente para registrar la venta");
    }

    // Validar método de pago
    if (!selectedMetodoPago || selectedMetodoPago.trim() === "") {
      errores.push(
        "⚠️ Elige un método de pago (Efectivo, Tarjeta, Depósito, Yape)",
      );
    }

    // Validar comprobante
    if (!selectedComprobante || selectedComprobante.trim() === "") {
      errores.push("⚠️ Selecciona el comprobante a emitir (Boleta o Factura)");
    }

    if (selectedComprobante === "Factura") {
      if (!ruc || ruc.trim() === "") {
        errores.push("⚠️ El RUC es obligatorio para emitir Factura");
      } else if (!/^\d{11}$/.test(ruc)) {
        errores.push("⚠️ El RUC debe tener exactamente 11 dígitos");
      }
    }

    // Validar que haya productos en la venta
    if (!rows || rows.length === 0) {
      errores.push("⚠️ Agrega al menos un producto a la venta");
    } else {
      // Validar cada fila de producto
      rows.forEach((row, index) => {
        const prod = productos.find((p) => String(p.id) === row.productoId);

        if (prod) {
          const maximo = Number(prod.cantidad ?? 0);

          if (row.cantidad > maximo) {
            errores.push(
              `⚠️ Fila ${index + 1}: la cantidad supera el stock disponible de ${prod.nombre} (${maximo}).`,
            );
          }
        }
        if (!row.productoId || row.productoId.toString().trim() === "") {
          errores.push(`⚠️ Fila ${index + 1}: Selecciona un producto`);
        }

        // Validar cantidad: debe ser mayor a 0
        if (!row.cantidad || row.cantidad <= 0 || isNaN(row.cantidad)) {
          errores.push(`⚠️ Fila ${index + 1}: La cantidad debe ser mayor a 0`);
        }

        // Validar que la cantidad sea un número entero
        if (!Number.isInteger(row.cantidad)) {
          errores.push(
            `⚠️ Fila ${index + 1}: La cantidad debe ser un número entero`,
          );
        }

        // Validar precio unitario: debe ser mayor a 0
        if (!row.precioUnit || row.precioUnit <= 0) {
          errores.push(
            `⚠️ Fila ${index + 1}: El precio unitario debe ser mayor a 0`,
          );
        }
      });
    }

    // Validar total
    if (!total || total <= 0) {
      errores.push("⚠️ El total de la venta debe ser mayor a 0");
    }

    if (errores.length > 0) {
      setErroresValidacion(errores);
      setShowModalValidacion(true);
      return false;
    }

    return true;
  }

  // Crear venta y enviar al backend
  async function handleCrearVenta(e?: React.FormEvent<HTMLFormElement>) {
    if (e) e.preventDefault();
  
    if (!validarFormularioVenta()) return;
  
    const details = rows.map((r) => ({
      id_producto: Number(r.productoId),
      cantidad: Number(r.cantidad),
      costo: Number(r.precioUnit),
    }));
  
    const estadoFinal =
      tipoEntrega === "Recojo en Tienda" ? "Entregado" : "Pendiente";
  
    // Payload base SIN id_direccion para evitar capturar un id inválido
    const payloadBase: Record<string, unknown> = {
      id_usuario: Number(selectedUsuario),
      fecha: getFechaActual(),
      metodo_pago: selectedMetodoPago || null,
      comprobante: selectedComprobante || null,
      ruc: selectedComprobante === "Factura" ? ruc : null,
      tipo_entrega: tipoEntrega,
      costo_total: Number(total),
      estado: estadoFinal,
      details,
    };
  
    // Si es recojo, no necesitamos id_direccion
    if (tipoEntrega === "Recojo en Tienda") {
      const payload = { ...payloadBase, id_direccion: null };
      await enviarVenta(payload);
      return;
    }
  
    // Si es envío y NO hay dirección aún, guardamos el payload base (sin id_direccion)
    // para enviarlo después de crear la dirección en el modal
    if (tipoEntrega === "Envío a Domicilio" && !idDireccion) {
      setPendingVentaPayload(payloadBase);
      setShowModalDireccion(true);
      return;
    }
  
    // Si ya tenemos idDireccion (string), convertirla a número y enviarla
    const dirIdNum =
      idDireccion !== null && idDireccion !== undefined
        ? Number(idDireccion)
        : null;
  
    const payloadFinal = {
      ...payloadBase,
      id_direccion: dirIdNum,
    };
  
    await enviarVenta(payloadFinal);
  }

  function handleComprobanteChange(id: string) {
    setSelectedComprobante(id);
    const comp = sampleComprobantes.find((c) => c.id === id);
    const isFactura = comp?.nombre?.toLowerCase() === "factura";
    if (!isFactura) {
      setRuc("");
    }
  }

  // Guardar dirección a través del backend
  async function guardarDireccionSimulada() {
    const ciudadInput = ciudad;
    const calleInput =
      (document.getElementById("calleInput") as HTMLInputElement)?.value || "";
    const referenciaInput =
      (document.getElementById("refInput") as HTMLTextAreaElement)?.value || "";
  
    if (!ciudadInput.trim()) {
      alert("La ciudad es obligatoria.");
      return;
    }
    if (!calleInput.trim()) {
      alert("La calle es obligatoria.");
      return;
    }
  
    const token = localStorage.getItem("token");
    const payload = {
      ciudad: ciudadInput,
      calle: calleInput,
      referencia: referenciaInput || null,
    };
  
    try {
      const res = await fetch(`${API_URL}/api/directions`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      const body = await res.json().catch(() => null);
  
      if (res.ok) {
        // Extraer id robustamente. Tu controlador devuelve 'id'
        const posibleId =
          body?.id ??
          body?.Id ??
          body?.data?.id ??
          body?.data?.Id ??
          body?.direccion?.id ??
          null;
  
        const direccionId = Number(posibleId);
  
        if (!Number.isFinite(direccionId) || direccionId <= 0) {
          console.error("No se pudo extraer un id válido de la respuesta:", body);
          alert("La dirección se creó pero no se devolvió un id válido desde el servidor.");
          return;
        }
  
        // Actualizar estado del componente (puede ser asíncrono)
        setIdDireccion(String(direccionId));
        setDireccionTexto(`${ciudadInput}${calleInput ? ", " + calleInput : ""}`);
  
        // Mostrar modal de éxito con la info
        setDireccionExitoData({
          ciudad: ciudadInput,
          calle: calleInput,
          referencia: referenciaInput,
          id: String(direccionId),
        });
  
        // Aquí NO dependemos de idDireccion en estado (porque setState es async).
        // Si hay una venta pendiente, la armamos usando el id recién obtenido.
        if (pendingVentaPayload) {
          const payloadFinal = {
            ...pendingVentaPayload,
            id_direccion: direccionId,
          };
          // Intentamos enviar la venta con el id correcto
          await enviarVenta(payloadFinal);
          // Limpiamos el payload pendiente
          setPendingVentaPayload(null);
        }
  
        // Cerrar modal y limpiar inputs
        setShowModalDireccion(false);
        setShowModalDireccionExito(true);
  
        (document.getElementById("calleInput") as HTMLInputElement).value = "";
        (document.getElementById("refInput") as HTMLTextAreaElement).value = "";
        setCiudad("");
  
        setTimeout(() => {
          setShowModalDireccionExito(false);
        }, 3000);
      } else {
        console.error("Error guardar dirección:", {
          status: res.status,
          statusText: res.statusText,
          body,
        });
  
        let errorMsg =
          body?.message ||
          body?.error ||
          `Error ${res.status}: ${res.statusText}`;
  
        if (res.status === 404) {
          errorMsg =
            "El endpoint de direcciones no existe. Verifica que el backend esté configurado correctamente.";
        } else if (res.status === 422) {
          errorMsg =
            "Datos de validación inválidos: " +
            JSON.stringify(body?.errors || body);
        }
  
        alert(errorMsg);
      }
    } catch (err) {
      console.error("Fetch error guardar dirección:", err);
      alert(
        `Error de conexión al guardar la dirección. Verifica que el servidor esté en ${API_URL}`,
      );
    }
  }

  async function enviarVenta(payload: Record<string, unknown>) {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/api/ventas`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);

      if (res.ok) {
        // Guardar datos de la venta exitosa
        const qr = body?.qr_token || null; // 👈 AQUÍ RECIBIMOS EL TOKEN
        setQrToken(qr);
        const ventaData = {
          usuario: usuarios.find((u) => String(u.id) === selectedUsuario)
            ?.nombre,
          metodo_pago: selectedMetodoPago,
          comprobante: selectedComprobante,
          cantidad_items: rows.length,
          total: total,
          estado: selectedEstado,
          fecha: new Date().toLocaleString("es-PE"),
        };

        setSuccessData(ventaData);
        setSuccessMessage("¡Venta creada correctamente!");
        setShowModalSuccess(true);

        // Cerrar modal después de 4 segundos
        setTimeout(() => {
          setShowModalSuccess(false);
        }, 4000);

        // Reset básico después de un pequeño delay
        setTimeout(() => {
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
          setDireccionTexto("");
          setCiudad("");
          setCalle("");
          setReferencia("");
          setSelectedMetodoPago("");
          setSelectedComprobante("");
          setRuc("");
          // Estado y fecha son automáticos, no se resetean
          setTipoEntrega("Envío a Domicilio");
        }, 500);
      } else {
        console.error("Error crear venta:", body);

        // Manejo de diferentes tipos de errores
        let message = body?.message || `Error ${res.status}`;
        const details: Record<string, string> = {};

        // Procesar según código de error y status HTTP
        if (res.status === 422 && body?.errors) {
          // Error de validación - Datos inválidos
          message = "❌ Datos inválidos. Por favor, revisa los campos";
          Object.entries(body.errors).forEach(
            ([field, msgs]: [string, any]) => {
              const nombreCampo =
                field === "id_usuario"
                  ? "👤 Usuario"
                  : field === "metodo_pago"
                    ? "💳 Método de Pago"
                    : field === "comprobante"
                      ? "📄 Comprobante"
                      : field === "id_direccion"
                        ? "📍 Dirección"
                        : field === "costo_total"
                          ? "💰 Costo Total"
                          : field === "estado"
                            ? "📊 Estado"
                            : field === "details" || field.includes("details")
                              ? "📦 Productos"
                              : field;
              details[nombreCampo] = Array.isArray(msgs)
                ? msgs[0]
                : String(msgs);
            },
          );
        } else if (body?.code === "INSUFFICIENT_STOCK") {
          // Error de stock insuficiente
          message = "⚠️ Stock insuficiente";
          details["Producto"] = body.product_name || "Desconocido";
          details["Solicitado"] = String(body.requested) || "0";
          details["Disponible"] = String(body.available) || "0";
          details["Diferencia"] =
            String((body.requested || 0) - (body.available || 0)) || "0";

          // Obtener detalles de lotes disponibles
          if (body.product_id) {
            const lotesData = await obtenerDetallesLotes(body.product_id);
            if (lotesData.lotes && lotesData.lotes.length > 0) {
              const lotesFormato = lotesData.lotes
                .map((l) => `${l.nombre}: ${l.cantidad} unidades`)
                .join(" | ");
              details["Lotes Disponibles"] = lotesFormato;
              details["Total Disponible (Lotes)"] = String(
                lotesData.totalDisponible,
              );
            }
          }
        } else if (body?.code === "MISSING_ADDRESS") {
          // Error de dirección faltante
          message = "📍 Dirección requerida";
          details["Tipo de Entrega"] =
            "Envío a domicilio requiere una dirección";
          details["Acción"] =
            "Por favor, ingresa una dirección válida en el formulario";
        } else if (body?.code === "PRODUCT_NOT_FOUND") {
          // Producto no encontrado
          message = "🚫 Producto no encontrado";
          details["Estado"] = "Uno o más productos no existen en el sistema";
          details["Acción"] =
            "Revisa que los productos seleccionados sean válidos";
        } else if (body?.code === "PROCESSING_ERROR") {
          // Error en el procesamiento
          message = "⚠️ Error al procesar la venta";
          details["Tipo de Error"] = "Error interno del servidor";
          details["Acción"] =
            "Contacta al administrador si el problema persiste";
          details["Código de Error"] = body.code;
        } else if (res.status === 400) {
          // Errores de solicitud malformada
          message = "❌ Solicitud inválida";
          details["Error"] = body?.message || "Verificar los datos enviados";
        } else if (res.status === 404) {
          // No encontrado
          message = "🚫 Recurso no encontrado";
          details["Error"] =
            body?.message || "Verifica que todos los datos sean válidos";
        } else if (res.status === 409) {
          // Conflicto (generalmente stock)
          message = "⚠️ Conflicto en la venta";
          details["Problema"] =
            body?.message || "Problema con el stock o datos";
        } else if (res.status === 500) {
          // Error del servidor
          message = "🔴 Error del servidor";
          details["Tipo"] = "Error interno del servidor";
          details["Acción"] = "Contacta al administrador";
        }

        setErrorMessage(message);
        setErrorDetails(details);
        setShowModalError(true);
      }
    } catch (err) {
      console.error("Fetch error crear venta:", err);
      setErrorMessage("Error de conexión al crear la venta");
      setErrorDetails({ Conexión: "Verifique su conexión a internet" });
      setShowModalError(true);
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
                          <small className="form-text text-muted d-block mt-1">
                            Selecciona el cliente que realiza la compra
                          </small>
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
                          <label className="form-label">Fecha y Hora</label>
                          <input
                            className="form-control"
                            readOnly
                            value={getFechaActual()}
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
                          <small className="form-text text-muted d-block mt-1">
                            Elige cómo pagará el cliente
                          </small>
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
                          <small className="form-text text-muted d-block mt-1">
                            Comprobante a emitir (Boleta o Factura)
                          </small>
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
                            {selectedComprobante === "Factura" &&
                              ruc.length > 0 &&
                              ruc.length !== 11 && (
                                <small className="text-danger">
                                  El RUC debe tener 11 dígitos
                                </small>
                              )}
                          </div>
                        )}

                        <div className="col-md-6">
                          <label className="form-label">Tipo de Entrega</label>
                          <select
                            className="form-select"
                            value={tipoEntrega}
                            onChange={(e) => {
                              setTipoEntrega(e.target.value);
                              if (e.target.value === "Recojo en Tienda")
                                setIdDireccion(null);
                            }}
                          >
                            <option value="Envío a Domicilio">
                              Envío a Domicilio
                            </option>
                            <option value="Recojo en Tienda">
                              Recojo en Tienda
                            </option>
                          </select>
                          <small className="form-text text-muted d-block mt-1">
                            Tipo de entrega (Recojo en tienda o Envío a
                            domicilio)
                          </small>
                        </div>

                        {/* {tipoEntrega === "Envío a Domicilio" && (
                          <div className="col-md-6">
                            <label className="form-label">Dirección</label>
                            <div className="d-flex gap-2">
                              <input
                                id="direccionInput"
                                className="form-control"
                                placeholder="Dirección registrada"
                                value={direccionTexto}
                                readOnly
                                onChange={(e) =>
                                  setIdDireccion(e.target.value || null)
                                }
                              />
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setShowModalDireccion(true)}
                              >
                                <i className="bx bx-map"></i>
                              </button>
                            </div>
                          </div>
                        )}*/}

                        <div className="col-md-6">
                          <label className="form-label">
                            Estado
                            <span className="text-danger">*</span>
                          </label>
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
                              value={selectedEstado}
                              disabled
                            />
                            <span
                              className={`input-group-text text-white fw-bold ${
                                selectedEstado === "Entregado"
                                  ? "bg-success"
                                  : "bg-warning"
                              }`}
                              title={
                                tipoEntrega === "Recojo en Tienda"
                                  ? "Recojo en Tienda: Estado Entregado"
                                  : "Envío a Domicilio: Estado Pendiente"
                              }
                            >
                              Automático
                            </span>
                          </div>
                          <small className="text-muted">
                            {tipoEntrega === "Recojo en Tienda"
                              ? "✓ Recojo en Tienda: Se crea como 'Entregado'"
                              : "⏳ Envío a Domicilio: Se crea como 'Pendiente'"}
                          </small>
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
                                        e.target.value,
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
                                              style={{
                                                cursor:
                                                  Number(p.cantidad ?? 0) <=
                                                    0 || p.estado === "agotado"
                                                    ? "not-allowed"
                                                    : "pointer",
                                                color:
                                                  Number(p.cantidad ?? 0) <=
                                                    0 || p.estado === "agotado"
                                                    ? "red"
                                                    : "inherit",
                                                opacity:
                                                  Number(p.cantidad ?? 0) <=
                                                    0 || p.estado === "agotado"
                                                    ? 0.7
                                                    : 1,
                                              }}
                                              onClick={() => {
                                                if (
                                                  Number(p.cantidad ?? 0) <=
                                                    0 ||
                                                  p.estado === "agotado"
                                                )
                                                  return;
                                                selectProductoSuggestion(
                                                  row.id,
                                                  p,
                                                );
                                              }}
                                            >
                                              {p.nombre}{" "}
                                              {Number(p.cantidad ?? 0) <= 0
                                                ? " - Agotado"
                                                : `- ${p.cantidad} disponibles`}
                                            </li>
                                          ),
                                        )}
                                      </ul>
                                    )}
                                </div>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  className="form-control"
                                  value={row.cantidad}
                                  max={Number(
                                    productos.find(
                                      (p) => String(p.id) === row.productoId,
                                    )?.cantidad ?? 1,
                                  )}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || isNaN(Number(val))) {
                                      updateRowCantidad(row.id, 1);
                                    } else {
                                      updateRowCantidad(row.id, Number(val));
                                    }
                                  }}
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
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={
                            selectedComprobante === "Factura" &&
                            (!ruc || ruc.length !== 11)
                          }
                        >
                          Guardar Venta
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal Dirección */}
            <div
              className={`modal fade ${showModalDireccion ? "show" : ""}`}
              id="modalDireccion"
              tabIndex={-1}
              inert={!showModalDireccion}
              style={{
                display: showModalDireccion ? "block" : "none",
                zIndex: 1050,
              }}
            >
              <div className="modal-dialog modal-dialog-centered modal-md">
                <div className="modal-content border-primary shadow-lg">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">
                      <i
                        className="bx bx-map-pin me-2"
                        style={{ fontSize: "1.5rem" }}
                      ></i>
                      Agregar Dirección
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowModalDireccion(false)}
                      aria-label="Cerrar"
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Ciudad</label>
                      <select
                        id="ciudadInput"
                        className="form-select"
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                      >
                        <option value="">Seleccione un distrito</option>
                        {DISTRITOS_HUANCAYO.map((distrito) => (
                          <option key={distrito} value={distrito}>
                            {distrito}
                          </option>
                        ))}
                      </select>

                      <small className="text-muted">
                        Selecciona el distrito de {`Huancayo`}
                      </small>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Calle</label>
                      <input
                        id="calleInput"
                        className="form-control"
                        placeholder="Ingresa la calle y número"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Referencia</label>
                      <textarea
                        id="refInput"
                        className="form-control"
                        rows={2}
                        placeholder="Ej: cerca al parque, departamento 305"
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModalDireccion(false)}
                    >
                      <i className="bx bx-x me-1"></i>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={guardarDireccionSimulada}
                    >
                      <i className="bx bx-check me-1"></i>
                      Guardar Dirección
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay para modales */}
            {(showModalSuccess ||
              showModalError ||
              showModalDireccion ||
              showModalDireccionExito) && (
              <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1040 }}
                onClick={() => {
                  if (showModalSuccess) setShowModalSuccess(false);
                  if (showModalError) setShowModalError(false);
                  if (showModalDireccion) setShowModalDireccion(false);
                  if (showModalDireccionExito)
                    setShowModalDireccionExito(false);
                }}
              ></div>
            )}

            {/* Modal Éxito - Venta */}
            <div
              className={`modal fade ${showModalSuccess ? "show" : ""}`}
              id="modalSuccess"
              tabIndex={-1}
              inert={!showModalSuccess}
              style={{
                display: showModalSuccess ? "block" : "none",
                zIndex: 1050,
              }}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-success shadow-lg">
                  <div className="modal-header bg-success text-white">
                    <h5 className="modal-title">
                      <i
                        className="bx bx-check-circle me-2"
                        style={{ fontSize: "1.5rem" }}
                      ></i>
                      ¡Venta Registrada Exitosamente!
                    </h5>
                  </div>
                  <div className="modal-body">
                    <div className="alert alert-success-light mb-3">
                      <p className="mb-0 text-success fw-bold">
                        {successMessage}
                      </p>
                    </div>

                    {Object.entries(successData).length > 0 && (
                      <div className="success-details">
                        <h6 className="mb-3">Detalles de la venta:</h6>
                        <table className="table table-sm table-borderless">
                          <tbody>
                            {Object.entries(successData).map(([key, value]) => (
                              <tr key={key}>
                                <td
                                  className="fw-bold"
                                  style={{ width: "40%" }}
                                >
                                  {key === "usuario"
                                    ? "Cliente"
                                    : key === "metodo_pago"
                                      ? "Método Pago"
                                      : key === "cantidad_items"
                                        ? "Items"
                                        : key === "total"
                                          ? "Total (S/)"
                                          : key === "estado"
                                            ? "Estado"
                                            : key === "fecha"
                                              ? "Fecha"
                                              : key === "comprobante"
                                                ? "Comprobante"
                                                : key}
                                  :
                                </td>
                                <td className="text-end">
                                  {key === "total"
                                    ? `${Number(value).toFixed(2)}`
                                    : String(value)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {qrToken && (
                      <div className="mt-4 d-flex justify-content-center">
                        <div className="text-center">
                          <h6 className="fw-bold mb-2">
                            📦 Código QR para validación de entrega
                          </h6>

                          <QRCodeCanvas
                            value={qrToken} // 👈 EL TOKEN SE CONVIERTE EN QR
                            size={180}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            level="H"
                            includeMargin={true}
                          />

                          <p className="text-muted small mt-2">
                            Escanea este código al momento de entregar el pedido
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => setShowModalSuccess(false)}
                    >
                      <i className="bx bx-check me-1"></i>
                      Aceptar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Error */}
            <div
              className={`modal fade ${showModalError ? "show" : ""}`}
              id="modalError"
              tabIndex={-1}
              inert={!showModalError}
              style={{
                display: showModalError ? "block" : "none",
                zIndex: 1050,
              }}
            >
              <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-danger shadow-lg">
                  <div className="modal-header bg-danger text-white">
                    <h5 className="modal-title">
                      <i
                        className="bx bx-error-circle me-2"
                        style={{ fontSize: "1.5rem" }}
                      ></i>
                      Error al crear la venta
                    </h5>
                  </div>
                  <div className="modal-body">
                    <div className="alert alert-danger mb-3">
                      <p className="mb-0 fw-bold">{errorMessage}</p>
                    </div>
                    {Object.entries(errorDetails).length > 0 && (
                      <div className="error-details">
                        <h6 className="mb-2">
                          <i className="bx bx-info-circle me-1"></i>
                          Detalles del error:
                        </h6>
                        <div className="alert alert-danger-light">
                          <ul className="mb-0">
                            {Object.entries(errorDetails).map(
                              ([key, value], idx) => (
                                <li key={idx} className="mb-1">
                                  <strong>{key}:</strong> {String(value)}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setShowModalError(false)}
                    >
                      <i className="bx bx-x me-1"></i>
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Producto Duplicado */}
            <div
              className={`modal fade ${showModalDuplicado ? "show" : ""}`}
              id="modalDuplicado"
              tabIndex={-1}
              inert={!showModalDuplicado}
              style={{
                display: showModalDuplicado ? "block" : "none",
                zIndex: 1050,
              }}
            >
              <div className="modal-dialog modal-dialog-centered modal-md">
                <div className="modal-content border-warning shadow-lg">
                  <div className="modal-header bg-warning text-dark">
                    <h5 className="modal-title">
                      <i
                        className="bx bx-info-circle me-2"
                        style={{ fontSize: "1.5rem" }}
                      ></i>
                      Producto Duplicado
                    </h5>
                  </div>
                  <div className="modal-body">
                    <div className="alert alert-warning-light">
                      <p className="mb-0 text-warning fw-bold">
                        <i className="bx bx-bulb me-1"></i>
                        {mensajeDuplicado}
                      </p>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={() => setShowModalDuplicado(false)}
                    >
                      <i className="bx bx-check me-1"></i>
                      Entendido
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal de Validación - Errores */}
            <div
              className={`modal fade ${showModalValidacion ? "show" : ""}`}
              id="modalValidacion"
              tabIndex={-1}
              inert={!showModalValidacion}
              style={{
                display: showModalValidacion ? "block" : "none",
                zIndex: 1050,
              }}
            >
              <div className="modal-dialog modal-dialog-centered modal-md">
                <div className="modal-content border-warning shadow-lg">
                  <div className="modal-header bg-warning text-dark">
                    <h5 className="modal-title">
                      <i
                        className="bx bx-error-circle me-2"
                        style={{ fontSize: "1.5rem" }}
                      ></i>
                      Hay Errores en el Formulario
                    </h5>
                  </div>
                  <div className="modal-body">
                    <div className="alert alert-warning-light">
                      <p className="text-warning fw-bold mb-2">
                        <i className="bx bx-check-circle me-1"></i>
                        Por favor completa los siguientes campos:
                      </p>
                      <ul className="mb-0 ps-3">
                        {erroresValidacion.map((error, index) => (
                          <li key={index} className="text-warning small mb-1">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={() => setShowModalValidacion(false)}
                    >
                      <i className="bx bx-x me-1"></i>
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Éxito - Dirección */}
            <div
              className={`modal fade ${showModalDireccionExito ? "show" : ""}`}
              id="modalDireccionExito"
              tabIndex={-1}
              inert={!showModalDireccionExito}
              style={{
                display: showModalDireccionExito ? "block" : "none",
                zIndex: 1050,
              }}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-success shadow-lg">
                  <div className="modal-header bg-success text-white">
                    <h5 className="modal-title">
                      <i
                        className="bx bx-map-pin me-2"
                        style={{ fontSize: "1.5rem" }}
                      ></i>
                      Dirección Guardada
                    </h5>
                  </div>
                  <div className="modal-body">
                    <div className="alert alert-success-light mb-3">
                      <p className="mb-0 text-success fw-bold">
                        ¡Dirección registrada exitosamente!
                      </p>
                    </div>

                    {Object.entries(direccionExitoData).length > 0 && (
                      <div className="direccion-details">
                        <div className="card bg-light">
                          <div className="card-body">
                            <p className="mb-2">
                              <strong>
                                <i className="bx bx-building me-2"></i>
                                Ciudad:
                              </strong>
                              <br />
                              <span>{direccionExitoData.ciudad}</span>
                            </p>
                            <p className="mb-2">
                              <strong>
                                <i className="bx bx-street-view me-2"></i>
                                Calle:
                              </strong>
                              <br />
                              <span>{direccionExitoData.calle}</span>
                            </p>
                            {direccionExitoData.referencia && (
                              <p className="mb-0">
                                <strong>
                                  <i className="bx bx-note me-2"></i>
                                  Referencia:
                                </strong>
                                <br />
                                <span>{direccionExitoData.referencia}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => setShowModalDireccionExito(false)}
                    >
                      <i className="bx bx-check me-1"></i>
                      Aceptar
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
