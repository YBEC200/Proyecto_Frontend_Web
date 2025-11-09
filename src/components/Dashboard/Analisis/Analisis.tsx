import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./Analisis.css";
import { Bar, Line, Doughnut } from "react-chartjs-2";
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
  const ventasPorMes = {
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
    datasets: [
      {
        label: "Ventas",
        data: [120, 150, 170, 140, 180, 200],
        backgroundColor: "#8e2de2",
      },
    ],
  };

  const mantenimientosPorMes = {
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
    datasets: [
      {
        label: "Mantenimientos",
        data: [80, 90, 100, 95, 110, 120],
        borderColor: "#0474dc",
        backgroundColor: "rgba(4,116,220,0.2)",
        fill: true,
      },
    ],
  };

  const clientesPorTipo = {
    labels: ["Nuevos", "Recurrentes", "VIP"],
    datasets: [
      {
        label: "Clientes",
        data: [100, 50, 18],
        backgroundColor: ["#00b09b", "#f7971e", "#8e2de2"],
      },
    ],
  };
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
                    <div className="row mt-4">
                      <div className="col-md-4 mb-3">
                        <div className="card radius-10">
                          <div className="card-header">
                            <h6 className="mb-0">Ventas por Mes</h6>
                          </div>
                          <div className="card-body">
                            <Bar data={ventasPorMes} />
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <div className="card radius-10">
                          <div className="card-header">
                            <h6 className="mb-0">Mantenimientos por Mes</h6>
                          </div>
                          <div className="card-body">
                            <Line data={mantenimientosPorMes} />
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <div className="card radius-10">
                          <div className="card-header">
                            <h6 className="mb-0">Clientes por Tipo</h6>
                          </div>
                          <div className="card-body">
                            <Doughnut data={clientesPorTipo} />
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
