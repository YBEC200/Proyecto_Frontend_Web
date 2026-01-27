import { useState, useEffect, useCallback } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./Analisis.css";
import { Bar, Doughnut, Line } from "react-chartjs-2";
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
  const [lotes, setLotes] = useState<any>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<
    { Id: number; Nombre: string }[]
  >([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ventas, setVentas] = useState<any[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [loadingProductosComprados, setLoadingProductosComprados] =
    useState(false);
  const [loadingVentasPorMes, setLoadingVentasPorMes] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ventasPorMesData, setVentasPorMesData] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

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

  // Obtener lotes activos por categoría (reemplaza obtenerDatosLotesTotales)
  const fetchLotesActivosPorCategoria = useCallback(async () => {
    setLoadingProductos(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (selectedCategoryId) {
        params.append("category_id", selectedCategoryId);
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/estadisticas/lotes-activos-por-categoria?${params.toString()}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        setLotes(null);
        setLoadingProductos(false);
        return;
      }

      const data = await response.json();
      // Convertir data a números para evitar concatenación en reduce
      const normalizedData = {
        ...data,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: (data?.data || []).map((val: any) => Number(val) || 0),
      };
      setLotes(normalizedData);
    } catch (err) {
      console.error("Error fetching lotes activos:", err);
      setLotes(null);
    } finally {
      setLoadingProductos(false);
    }
  }, [selectedCategoryId]);

  const fetchProductos = useCallback(async () => {
    setLoadingProductos(true);
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();

    // Filtrar por categoría si está seleccionada
    if (selectedCategoryId) {
      params.append("categoria", selectedCategoryId);
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/productos?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        setProductos([]);
        setLotes(null);
        setLoadingProductos(false);
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
        await fetchLotesActivosPorCategoria();
      } else {
        setLoadingProductos(false);
      }
    } catch (error) {
      console.error("Error fetching productos:", error);
      setProductos([]);
      setLotes(null);
      setLoadingProductos(false);
    }
  }, [selectedCategoryId, fetchLotesActivosPorCategoria]);

  // Obtener ventas (para gráficos de clientes y tipo de pago)
  const fetchVentas = useCallback(async () => {
    setLoadingClientes(true);
    setLoadingPagos(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://127.0.0.1:8000/api/ventas`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setVentas([]);
        setLoadingClientes(false);
        setLoadingPagos(false);
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
    } finally {
      setLoadingClientes(false);
      setLoadingPagos(false);
    }
  }, []);

  // Obtener categorías más vendidas (reemplaza obtenerProductosComprados)
  const fetchCategoriasMasVendidas = useCallback(async () => {
    setLoadingProductosComprados(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://127.0.0.1:8000/api/estadisticas/categorias-mas-vendidas`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        setLoadingProductosComprados(false);
        return;
      }

      const data = await response.json();
      setProductosComprados(data);
    } catch (err) {
      console.error("Error fetching categorías:", err);
    } finally {
      setLoadingProductosComprados(false);
    }
  }, []);

  // Obtener ventas por mes
  const fetchVentasPorMes = useCallback(async (year: number) => {
    setLoadingVentasPorMes(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://127.0.0.1:8000/api/estadisticas/ventasPorMesYTipoEntrega?year=${year}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        setVentasPorMesData(null);
        setLoadingVentasPorMes(false);
        return;
      }

      const data = await response.json();
      setVentasPorMesData(data);
    } catch (err) {
      console.error("Error fetching ventas por mes:", err);
      setVentasPorMesData(null);
    } finally {
      setLoadingVentasPorMes(false);
    }
  }, []);

  // Estado para datos de productos comprados
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [productosComprados, setProductosComprados] = useState<any>(null);

  useEffect(() => {
    fetchVentas();
    fetchCategoriasMasVendidas();
    fetchVentasPorMes(selectedYear);
  }, [
    fetchVentas,
    fetchCategoriasMasVendidas,
    fetchVentasPorMes,
    selectedYear,
  ]);

  useEffect(() => {
    fetchLotesActivosPorCategoria();
  }, [fetchLotesActivosPorCategoria]);

  // Datos para gráfico de lotes activos (desde API)
  const lotesPorProducto = {
    labels: lotes?.labels || [],
    datasets: [
      {
        label: "Unidades Disponibles",
        data: lotes?.data || [],
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
        max: Math.max(...(lotes?.data || [10]), 10),
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
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } },
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

  const pagoChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function (context: any) {
            const total = context.dataset.data.reduce(
              (sum: number, val: number) => sum + val,
              0,
            );
            const percentage = ((context.parsed / total) * 100).toFixed(2);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Datos para gráfico de categorías más vendidas (desde API)
  const coloresProductos = [
    "#0d6efd",
    "#198754",
    "#ffc107",
    "#dc3545",
    "#6c757d",
    "#6610f2",
    "#20c997",
    "#fd7e14",
    "#0dcaf0",
    "#6f42c1",
  ];

  const productosCompradosData = {
    labels: productosComprados?.labels || [],
    datasets: [
      {
        data: productosComprados?.data || [],
        backgroundColor: coloresProductos.slice(
          0,
          productosComprados?.labels?.length || 0,
        ),
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function (context: any) {
            const total = context.dataset.data.reduce(
              (sum: number, val: number) => sum + val,
              0,
            );
            const percentage = ((context.parsed / total) * 100).toFixed(2);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Datos para gráfico de ventas por mes (desde API)
  const ventasChartData = {
    labels: ventasPorMesData?.labels || [],
    datasets: ventasPorMesData?.datasets || [],
  };

  const ventasChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#ddd",
        borderWidth: 1,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function (context: any) {
            return `${context.dataset.label}: S/. ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: function (value: any) {
            return "S/. " + value.toFixed(0);
          },
        },
      },
    },
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

            <div className="row mt-4">
              <div className="col-12">
                <div className="card radius-10 border-0 shadow-sm">
                  <div className="card-header bg-light border-bottom">
                    <h6 className="mb-0 fw-bold text-dark">
                      📊 Análisis Detallado de la Operación
                    </h6>
                  </div>
                  <div className="card-body p-4">
                    {/* DIAGRAMA 1: LOTES POR PRODUCTO */}
                    <div className="row mt-0">
                      <div className="col-12">
                        <div className="card radius-10 border-0 shadow-sm">
                          <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-0 fw-bold text-dark">
                                📦 Inventario: Lotes Activos por Producto
                              </h6>
                              {lotes?.labels && lotes.labels.length > 0 && (
                                <small className="text-muted d-block mt-1">
                                  Total:{" "}
                                  {lotes.data.reduce(
                                    (sum: number, val: number) => sum + val,
                                    0,
                                  )}{" "}
                                  unidades en {lotes.labels.length} productos
                                </small>
                              )}
                            </div>
                          </div>
                          <div className="card-body p-4">
                            <div className="row mb-4">
                              <div className="col-12">
                                <label className="form-label fw-bold text-dark mb-2">
                                  🔍 Filtrar por Categoría
                                </label>
                                <div className="d-flex gap-2 flex-wrap align-items-center">
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
                            {loadingProductos ? (
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
                                  Productos: {productos.length}
                                </div>
                                {lotes?.labels && lotes.labels.length > 0 ? (
                                  <div
                                    style={{
                                      height: "100%",
                                      maxHeight: "100%",
                                    }}
                                  >
                                    <Bar
                                      data={lotesPorProducto}
                                      options={chartOptions}
                                    />
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      textAlign: "center",
                                      color: "#999",
                                    }}
                                  >
                                    No hay lotes activos para mostrar
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
                    <div>
                      {/* FILA 2: CLIENTES Y CATEGORÍAS (COL-6 CADA UNO) */}
                      <div className="row mt-3">
                        {/* DIAGRAMA 2: CLIENTES CON MÁS COMPRAS */}
                        <div className="col-md-6">
                          <div className="card radius-10 border-0 shadow-sm h-100">
                            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-0 fw-bold text-dark">
                                  👥 Clientes Top
                                </h6>
                                {datosClientesTop.length > 0 && (
                                  <small className="text-muted d-block mt-1">
                                    Ranking por número de compras
                                  </small>
                                )}
                              </div>
                            </div>
                            <div className="card-body p-4">
                              {loadingClientes ? (
                                <div
                                  style={{
                                    textAlign: "center",
                                    padding: "2em",
                                  }}
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
                                    Cargando datos de clientes...
                                  </div>
                                </div>
                              ) : datosClientesTop.length > 0 ? (
                                <>
                                  <div
                                    style={{
                                      height: "280px",
                                      marginBottom: "1em",
                                    }}
                                  >
                                    <Bar
                                      data={clientesChartData}
                                      options={clientesChartOptions}
                                    />
                                  </div>
                                  <div className="row mt-3 text-center border-top pt-3">
                                    <div className="col-6">
                                      <p className="text-muted mb-1 small">
                                        Total Clientes
                                      </p>
                                      <h5 className="mb-0 text-primary">
                                        {datosClientesTop.length}
                                      </h5>
                                    </div>
                                    <div className="col-6">
                                      <p className="text-muted mb-1 small">
                                        Mayor Comprador
                                      </p>
                                      <h5 className="mb-0 text-success">
                                        {
                                          datosClientesTop[0]?.nombre?.split(
                                            " ",
                                          )[0]
                                        }
                                      </h5>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div
                                  style={{
                                    textAlign: "center",
                                    color: "#999",
                                    padding: "2em",
                                  }}
                                >
                                  No hay datos de clientes
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* DIAGRAMA 3: CATEGORÍAS MÁS VENDIDAS */}
                        <div className="col-md-6">
                          <div className="card radius-10 border-0 shadow-sm h-100">
                            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-0 fw-bold text-dark">
                                  🏆 Categorías Líderes
                                </h6>
                                {productosComprados?.labels &&
                                  productosComprados.labels.length > 0 && (
                                    <small className="text-muted d-block mt-1">
                                      Distribución de ventas
                                    </small>
                                  )}
                              </div>
                            </div>
                            <div className="card-body p-4">
                              {loadingProductosComprados ? (
                                <div
                                  style={{
                                    textAlign: "center",
                                    padding: "2em",
                                  }}
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
                                    Cargando categorías...
                                  </div>
                                </div>
                              ) : productosComprados?.labels &&
                                productosComprados.labels.length > 0 ? (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "1.5em",
                                  }}
                                >
                                  <div style={{ height: "280px" }}>
                                    <Doughnut
                                      data={productosCompradosData}
                                      options={doughnutOptions}
                                    />
                                  </div>
                                  <div
                                    style={{
                                      overflowY: "auto",
                                      maxHeight: "220px",
                                      paddingRight: "0.5em",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.6em",
                                      }}
                                    >
                                      {productosComprados.labels.map(
                                        (label: string, index: number) => {
                                          const total =
                                            productosComprados.data.reduce(
                                              (sum: number, val: number) =>
                                                sum + val,
                                              0,
                                            );
                                          const percentage = (
                                            (productosComprados.data[index] /
                                              total) *
                                            100
                                          ).toFixed(2);
                                          const color =
                                            coloresProductos[index] || "#999";

                                          return (
                                            <div
                                              key={index}
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.8em",
                                                padding: "0.5em",
                                                backgroundColor: "#f8f9fa",
                                                borderRadius: "0.375rem",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  width: "12px",
                                                  height: "12px",
                                                  backgroundColor: color,
                                                  borderRadius: "2px",
                                                  flexShrink: 0,
                                                }}
                                              ></div>
                                              <div
                                                style={{
                                                  fontSize: "0.85em",
                                                  flex: 1,
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    fontWeight: "500",
                                                    color: "#333",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                  }}
                                                >
                                                  {label}
                                                </div>
                                              </div>
                                              <div
                                                style={{
                                                  color: color,
                                                  fontSize: "0.8em",
                                                  fontWeight: "600",
                                                  whiteSpace: "nowrap",
                                                }}
                                              >
                                                {percentage}%
                                              </div>
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    textAlign: "center",
                                    color: "#999",
                                    padding: "2em",
                                  }}
                                >
                                  No hay datos de categorías
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* FILA 3: MÉTODOS DE PAGO Y VENTAS POR MES (COL-6 CADA UNO) */}
                      <div className="row mt-4">
                        {/* DIAGRAMA 4: MÉTODOS DE PAGO */}
                        <div className="col-md-6">
                          <div className="card radius-10 border-0 shadow-sm h-100">
                            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-0 fw-bold text-dark">
                                  💳 Métodos de Pago
                                </h6>
                                {datosTiposPago.length > 0 && (
                                  <small className="text-muted d-block mt-1">
                                    Preferencias de pago
                                  </small>
                                )}
                              </div>
                            </div>
                            <div className="card-body p-4">
                              {loadingPagos ? (
                                <div
                                  style={{
                                    textAlign: "center",
                                    padding: "2em",
                                  }}
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
                                    Cargando datos de pagos...
                                  </div>
                                </div>
                              ) : datosTiposPago.length > 0 ? (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "1.5em",
                                  }}
                                >
                                  <div style={{ height: "280px" }}>
                                    <Doughnut
                                      data={tiposPagoData}
                                      options={pagoChartOptions}
                                    />
                                  </div>
                                  <div
                                    style={{
                                      overflowY: "auto",
                                      maxHeight: "220px",
                                      paddingRight: "0.5em",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.6em",
                                      }}
                                    >
                                      {datosTiposPago.map(
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        (item: any, index: number) => {
                                          const total = datosTiposPago.reduce(
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            (sum: number, val: any) =>
                                              sum + val.count,
                                            0,
                                          );
                                          const percentage = (
                                            (item.count / total) *
                                            100
                                          ).toFixed(2);
                                          const color =
                                            coloresTipoPago[index] || "#999";

                                          return (
                                            <div
                                              key={index}
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.8em",
                                                padding: "0.5em",
                                                backgroundColor: "#f8f9fa",
                                                borderRadius: "0.375rem",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  width: "12px",
                                                  height: "12px",
                                                  backgroundColor: color,
                                                  borderRadius: "2px",
                                                  flexShrink: 0,
                                                }}
                                              ></div>
                                              <div
                                                style={{
                                                  fontSize: "0.85em",
                                                  flex: 1,
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    fontWeight: "500",
                                                    color: "#333",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                  }}
                                                >
                                                  {item.metodo}
                                                </div>
                                              </div>
                                              <div
                                                style={{
                                                  color: color,
                                                  fontSize: "0.8em",
                                                  fontWeight: "600",
                                                  whiteSpace: "nowrap",
                                                }}
                                              >
                                                {percentage}%
                                              </div>
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    textAlign: "center",
                                    color: "#999",
                                    padding: "2em",
                                  }}
                                >
                                  No hay datos de pago
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* DIAGRAMA 5: VENTAS POR MES */}
                        <div className="col-md-6">
                          <div className="card radius-10 border-0 shadow-sm h-100">
                            <div className="card-header bg-white border-bottom">
                              <div className="d-flex justify-content-between align-items-center gap-3">
                                <div className="flex-grow-1">
                                  <h6 className="mb-0 fw-bold text-dark">
                                    📈 Ventas por Mes
                                  </h6>
                                  <small className="text-muted d-block mt-1">
                                    Tendencia de ingresos
                                  </small>
                                </div>
                                <select
                                  className="form-select form-select-sm"
                                  style={{
                                    width: "110px",
                                    borderRadius: "0.375rem",
                                    flexShrink: 0,
                                  }}
                                  value={selectedYear}
                                  onChange={(e) =>
                                    setSelectedYear(Number(e.target.value))
                                  }
                                >
                                  {[2022, 2023, 2024, 2025, 2026].map(
                                    (year) => (
                                      <option key={year} value={year}>
                                        {year}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </div>
                            </div>
                            <div className="card-body p-4">
                              {loadingVentasPorMes ? (
                                <div
                                  style={{
                                    textAlign: "center",
                                    padding: "2em",
                                  }}
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
                                    Cargando ventas...
                                  </div>
                                </div>
                              ) : ventasPorMesData?.labels &&
                                ventasPorMesData.labels.length > 0 ? (
                                <>
                                  <div
                                    style={{
                                      height: "280px",
                                      marginBottom: "1em",
                                    }}
                                  >
                                    <Line
                                      data={ventasChartData}
                                      options={ventasChartOptions}
                                    />
                                  </div>
                                  <div className="row mt-3 text-center border-top pt-3">
                                    <div className="col-4">
                                      <p className="text-muted mb-1 small">
                                        Promedio
                                      </p>
                                      <h6 className="mb-0 text-info">
                                        S/.{" "}
                                        {(
                                          ventasPorMesData?.data?.reduce(
                                            (sum: number, val: number) =>
                                              sum + val,
                                            0,
                                          ) /
                                          (ventasPorMesData?.data?.length || 1)
                                        ).toFixed(0)}
                                      </h6>
                                    </div>
                                    <div className="col-4">
                                      <p className="text-muted mb-1 small">
                                        Máximo
                                      </p>
                                      <h6 className="mb-0 text-success">
                                        S/.{" "}
                                        {Math.max(
                                          ...(ventasPorMesData?.data || [0]),
                                        )}
                                      </h6>
                                    </div>
                                    <div className="col-4">
                                      <p className="text-muted mb-1 small">
                                        Mínimo
                                      </p>
                                      <h6 className="mb-0 text-warning">
                                        S/.{" "}
                                        {Math.min(
                                          ...(ventasPorMesData?.data || [0]),
                                        )}
                                      </h6>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div
                                  style={{
                                    textAlign: "center",
                                    color: "#999",
                                    padding: "2em",
                                  }}
                                >
                                  No hay datos de ventas para este período
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
    </div>
  );
}

export default Analisis;
