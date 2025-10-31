import Nav from "../Layout/Nav";
import Sidebar from "../Layout/Sidebar";
import "./Dashboard.css";

function Dashboard() {
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
                      <h5>Bienvenido al Sistema de Administración</h5>
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

export default Dashboard;
