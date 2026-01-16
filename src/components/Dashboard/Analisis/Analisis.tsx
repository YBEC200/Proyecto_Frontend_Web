import { useState, useEffect, useCallback } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./Analisis.css";
import { Bar } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

function Analisis() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [productos, setProductos] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lotes, setLotes] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<
    { Id: number; Nombre: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    (async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/categorias", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (!res.ok) return;
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching categorias:", err);
      }
    })();
  }, []);

  const fetchLotes = useCallback(async () => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/lotes?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("Error response:", response.status);
        setLotes([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const lotesArray = Array.isArray(data) ? data : [];

      setLotes(lotesArray);
    } catch (error) {
      console.error("Error fetching lotes:", error);
      setLotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();

    if (categoryFilter) params.append("categoria", categoryFilter);
    if (statusFilter) params.append("estado", statusFilter);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/productos?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        setProductos([]);
        setLotes([]);
        setLoading(false);
        return;
      }

      const data = await response.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized = (data || []).map((p: any) => ({
        ...p,
        lotes: typeof p.lotes !== "undefined" ? Number(p.lotes) : 0,
        fecha_registro: p.fecha_registro ?? p.fechaRegistro ?? "",
        ultimo_abastecimiento:
          p.ultimo_abastecimiento ?? p.ultimoAbastecimiento ?? null,
      }));

      setProductos(normalized);

      if (normalized.length > 0) {
        await fetchLotes();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching productos:", error);
      setProductos([]);
      setLotes([]);
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, fetchLotes]);

  // Función para agrupar lotes activos e inactivos por producto
  const obtenerDatosLotesConEstado = () => {
    const productosMap = new Map();

    // Primero, crear entrada para cada producto
    productos.forEach((producto) => {
      const productoId = producto.id;
      productosMap.set(productoId, {
        id: productoId,
        nombre: producto.nombre || "Sin nombre",
        activos: 0,
        inactivos: 0,
      });
    });

    // Ahora, contar lotes por producto e estado
    // ✓ CAMBIO: Usar Id_Producto (tal como lo devuelve el controlador)
    lotes.forEach((lote) => {
      const productoId = lote.Id_Producto;

      if (productosMap.has(productoId)) {
        const producto = productosMap.get(productoId);
        // ✓ CAMBIO: Usar Estado (con mayúscula)
        if (lote.Estado === "activo" || lote.Estado === "Activo") {
          producto.activos += 1;
        } else {
          producto.inactivos += 1;
        }
      }
    });

    const resultado = Array.from(productosMap.values());
    return resultado;
  };

  const datosLotesConEstado = obtenerDatosLotesConEstado();

  const lotesPorProductoConEstado = {
    labels: datosLotesConEstado.map((p) => p.nombre),
    datasets: [
      {
        label: "Lotes Activos",
        data: datosLotesConEstado.map((p) => p.activos),
        backgroundColor: "#00b09b",
        borderColor: "#00b09b",
        borderWidth: 1,
      },
      {
        label: "Lotes Inactivos",
        data: datosLotesConEstado.map((p) => p.inactivos),
        backgroundColor: "#ff6b6b",
        borderColor: "#ff6b6b",
        borderWidth: 1,
      },
    ],
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
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-2 row-cols-xxl-4">
              <div className="col">
                <div className="card radius-10 bg-gradient-cosmic">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="me-auto">
                        <p className="mb-0 text-white">Total de ventas</p>
                        <h4 className="my-1 text-white">100</h4>
                      </div>
                      <div>
                        <i className="bx bx-cart text-white fs-3"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card radius-10 bg-gradient-ibiza">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="me-auto">
                        <p className="mb-0 text-white">Total Mantenimientos</p>
                        <h4 className="my-1 text-white">85</h4>
                      </div>
                      <div>
                        <i className="bx bx-wrench text-white fs-3"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card radius-10 bg-gradient-ohhappiness">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="me-auto">
                        <p className="mb-0 text-white">Ganancias del Mes</p>
                        <h4 className="my-1 text-white">S/. 8,950</h4>
                      </div>
                      <div>
                        <i className="bx bx-dollar text-white fs-3"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card radius-10 bg-gradient-kyoto">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="me-auto">
                        <p className="mb-0 text-white">Total Clientes</p>
                        <h4 className="my-1 text-white">168</h4>
                      </div>
                      <div>
                        <i className="bx bx-group text-white fs-3"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-12">
                <div className="card radius-10">
                  <div className="card-header">
                    <h6 className="mb-0">Panel de Control</h6>
                  </div>
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <h5>
                        Bienvenido al Sistema de Administración de la
                        Corporacion Digital Technology
                      </h5>
                    </div>

                    <div className="row mt-3">
                      <div className="col-12">
                        <div className="card radius-10">
                          <div className="card-header">
                            <h6 className="mb-0">
                              Análisis de Lotes por Producto
                            </h6>
                          </div>
                          <div className="card-body">
                            <div className="row mb-3">
                              <div className="col-md-4">
                                <label
                                  htmlFor="categoryFilter"
                                  className="form-label"
                                >
                                  Categoría
                                </label>
                                <select
                                  id="categoryFilter"
                                  className="form-select"
                                  value={categoryFilter}
                                  onChange={(e) =>
                                    setCategoryFilter(e.target.value)
                                  }
                                >
                                  <option value="">Todas las categorías</option>
                                  {categories.map((c) => (
                                    <option key={c.Id} value={String(c.Id)}>
                                      {c.Nombre}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-4">
                                <label
                                  htmlFor="statusFilter"
                                  className="form-label"
                                >
                                  Estado
                                </label>
                                <select
                                  id="statusFilter"
                                  className="form-select"
                                  value={statusFilter}
                                  onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                  }
                                >
                                  <option value="">Todos los estados</option>
                                  <option value="Abastecido">Abastecido</option>
                                  <option value="Agotado">Agotado</option>
                                  <option value="Activo">Activo</option>
                                  <option value="Inactivo">Inactivo</option>
                                </select>
                              </div>
                            </div>
                            {loading ? (
                              <div
                                style={{ textAlign: "center", padding: "2em" }}
                              >
                                <div
                                  className="spinner-border text-primary"
                                  role="status"
                                >
                                  <span className="visually-hidden">
                                    Cargando...
                                  </span>
                                </div>
                                <div
                                  style={{
                                    marginTop: "1em",
                                    color: "#0d6efd",
                                    fontWeight: "bold",
                                  }}
                                >
                                  Cargando productos...
                                </div>
                              </div>
                            ) : productos.length > 0 ? (
                              <>
                                <div
                                  style={{
                                    marginBottom: "1em",
                                    fontSize: "0.9em",
                                    color: "#666",
                                  }}
                                >
                                  Productos: {productos.length} | Lotes:{" "}
                                  {lotes.length}
                                </div>
                                {datosLotesConEstado.length > 0 ? (
                                  <Bar data={lotesPorProductoConEstado} />
                                ) : (
                                  <div
                                    style={{
                                      textAlign: "center",
                                      color: "#999",
                                    }}
                                  >
                                    No hay lotes para mostrar
                                  </div>
                                )}
                              </>
                            ) : (
                              <div
                                style={{
                                  marginTop: "1em",
                                  color: "#0d6efd",
                                  fontWeight: "bold",
                                  textAlign: "center",
                                }}
                              >
                                No hay productos que encajen con los filtros
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analisis;
