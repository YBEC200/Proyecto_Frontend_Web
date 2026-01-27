import { useState, useEffect, useCallback } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./Analisis.css";
import { Bar, Doughnut } from "react-chartjs-2";
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
  Legend,
);

function Analisis() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [productos, setProductos] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lotes, setLotes] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<
    { Id: number; Nombre: string }[]
  >([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    (async () => {
      try {
        const res = await fetch(
          "https://proyecto-backend-web-1.onrender.com/api/categorias",
          {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          },
        );
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

    try {
      const response = await fetch(
        `https://proyecto-backend-web-1.onrender.com/api/lotes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        console.error("Error response:", response.status);
        setLotes([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setLotes(Array.isArray(data) ? data : []);
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

    // Filtrar por categoría si está seleccionada
    if (selectedCategoryId) {
      params.append("categoria", selectedCategoryId);
    }

    try {
      const response = await fetch(
        `https://proyecto-backend-web-1.onrender.com/api/productos?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
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
  }, [selectedCategoryId, fetchLotes]);

  // Obtener ventas (para gráficos de clientes y tipo de pago)
  const fetchVentas = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://proyecto-backend-web-1.onrender.com/api/ventas`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        setVentas([]);
        return;
      }

      const data = await response.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: item.id || item.Id,
        metodo_pago: item.metodo_pago || item.Metodo_Pago,
        user: {
          id: item.id_usuario || item.Id_Usuario,
          nombre:
            item.user?.nombre ||
            item.nombre_cliente ||
            item.nombre ||
            item.user?.Nombre ||
            "Sin cliente",
        },
      }));

      setVentas(normalized);
    } catch (err) {
      console.error("Error fetching ventas:", err);
      setVentas([]);
    }
  }, []);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  // Función para contar lotes ACTIVOS por producto
  const obtenerDatosLotesTotales = () => {
    const productosMap = new Map();

    // Primero, crear entrada para cada producto
    productos.forEach((producto) => {
      const productoId = producto.id;
      productosMap.set(productoId, {
        id: productoId,
        nombre: producto.nombre || "Sin nombre",
        totalLotes: 0,
      });
    });

    // Contar solo lotes ACTIVOS por producto
    lotes.forEach((lote) => {
      // Filtrar solo lotes con estado "Activo"
      if (lote.Estado === "Activo" || lote.Estado === "activo") {
        const productoId = lote.Id_Producto;

        if (productosMap.has(productoId)) {
          const producto = productosMap.get(productoId);
          producto.totalLotes += 1;
        }
      }
    });

    const resultado = Array.from(productosMap.values());
    return resultado;
  };

  const datosLotesTotales = obtenerDatosLotesTotales();

  const lotesPorProducto = {
    labels: datosLotesTotales.map((p) => p.nombre),
    datasets: [
      {
        label: "Lotes Activos",
        data: datosLotesTotales.map((p) => p.totalLotes),
        backgroundColor: "#0d6efd",
        borderColor: "#0d6efd",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(...datosLotesTotales.map((p) => p.totalLotes), 10),
      },
    },
  };
  // --- Datos para gráfico: Clientes con más compras ---
  const obtenerClientesTop = (top = 10) => {
    const map = new Map<string, number>();
    ventas.forEach((v) => {
      const nombre = v.user?.nombre || "Sin cliente";
      map.set(nombre, (map.get(nombre) || 0) + 1);
    });
    const arr = Array.from(map.entries()).map(([nombre, count]) => ({
      nombre,
      count,
    }));
    arr.sort((a, b) => b.count - a.count);
    return arr.slice(0, top);
  };

  const datosClientesTop = obtenerClientesTop(10);

  const clientesChartData = {
    labels: datosClientesTop.map((d) => d.nombre),
    datasets: [
      {
        label: "Compras",
        data: datosClientesTop.map((d) => d.count),
        backgroundColor: "#198754",
        borderColor: "#198754",
        borderWidth: 1,
      },
    ],
  };

  const clientesChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  // --- Datos para gráfico: Tipos de pago ---
  const obtenerTiposPago = () => {
    const map = new Map<string, number>();
    ventas.forEach((v) => {
      const metodo = v.metodo_pago || v.metodoPago || "Desconocido";
      map.set(metodo, (map.get(metodo) || 0) + 1);
    });
    return Array.from(map.entries()).map(([metodo, count]) => ({
      metodo,
      count,
    }));
  };

  const datosTiposPago = obtenerTiposPago();

  const coloresTipoPago = [
    "#0d6efd",
    "#198754",
    "#ffc107",
    "#dc3545",
    "#6c757d",
    "#6610f2",
  ];

  const tiposPagoData = {
    labels: datosTiposPago.map((d) => d.metodo),
    datasets: [
      {
        data: datosTiposPago.map((d) => d.count),
        backgroundColor: coloresTipoPago.slice(0, datosTiposPago.length),
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
                      <div></div>
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
                    <h6 className="mb-0">
                      Bienvenido al Sistema de Administración de la Corporacion
                      Digital Technology
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row mt-3">
                      <div className="col-12">
                        <div className="card radius-10">
                          <div className="card-header">
                            <h6 className="mb-0">
                              Análisis de Lotes por Producto
                            </h6>
                          </div>
                          <div className="card-body">
                            <div className="row mb-4">
                              <div className="col-12">
                                <label className="form-label">
                                  Filtrar por Categoría
                                </label>
                                <div className="d-flex gap-2 flex-wrap">
                                  <button
                                    className={`btn ${
                                      selectedCategoryId === ""
                                        ? "btn-primary"
                                        : "btn-outline-primary"
                                    }`}
                                    onClick={() => setSelectedCategoryId("")}
                                  >
                                    Todas las categorías
                                  </button>
                                  {categories.map((c) => (
                                    <button
                                      key={c.Id}
                                      className={`btn ${
                                        selectedCategoryId === String(c.Id)
                                          ? "btn-primary"
                                          : "btn-outline-primary"
                                      }`}
                                      onClick={() =>
                                        setSelectedCategoryId(String(c.Id))
                                      }
                                    >
                                      {c.Nombre}
                                    </button>
                                  ))}
                                </div>
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
                                {datosLotesTotales.length > 0 ? (
                                  <>
                                    <div
                                      style={{
                                        height: "400px",
                                        maxHeight: "500px",
                                      }}
                                    >
                                      <Bar
                                        data={lotesPorProducto}
                                        options={chartOptions}
                                      />
                                    </div>

                                    <div className="row mt-4">
                                      <div className="col-md-8">
                                        <div className="card radius-10">
                                          <div className="card-header">
                                            <h6 className="mb-0">
                                              Clientes con más compras
                                            </h6>
                                          </div>
                                          <div className="card-body">
                                            {datosClientesTop.length > 0 ? (
                                              <div style={{ height: "300px" }}>
                                                <Bar
                                                  data={clientesChartData}
                                                  options={clientesChartOptions}
                                                />
                                              </div>
                                            ) : (
                                              <div
                                                style={{
                                                  textAlign: "center",
                                                  color: "#999",
                                                }}
                                              >
                                                No hay datos de clientes
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="col-md-4">
                                        <div className="card radius-10">
                                          <div className="card-header">
                                            <h6 className="mb-0">
                                              Métodos de Pago
                                            </h6>
                                          </div>
                                          <div className="card-body">
                                            {datosTiposPago.length > 0 ? (
                                              <div style={{ height: "300px" }}>
                                                <Doughnut
                                                  data={tiposPagoData}
                                                />
                                              </div>
                                            ) : (
                                              <div
                                                style={{
                                                  textAlign: "center",
                                                  color: "#999",
                                                }}
                                              >
                                                No hay datos de pago
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </>
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
