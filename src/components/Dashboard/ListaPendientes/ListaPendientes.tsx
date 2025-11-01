import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./ListaPendientes.css";

function ListaPendientes() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-area">
        <Nav />
        <div className="page-wrapper">
          <div className="page-content">
            {/* Tarjetas de resumen */}
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-2">
              <div className="col">
                <div className="card radius-10 bg-gradient-cosmic">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="me-auto">
                        <p className="mb-0 text-white">Ventas Pendientes</p>
                        <h4 className="my-1 text-white">15</h4>
                      </div>
                      <div>
                        <i className="bx bx-cart-alt text-white fs-3"></i>
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
                        <p className="mb-0 text-white">
                          Mantenimientos Pendientes
                        </p>
                        <h4 className="my-1 text-white">8</h4>
                      </div>
                      <div>
                        <i className="bx bx-wrench text-white fs-3"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Pendientes */}
            <div className="row mt-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">Lista de Pendientes</h6>
                  </div>
                  <div className="card-body">
                    <ul className="nav nav-tabs" role="tablist">
                      <li className="nav-item" role="presentation">
                        <button
                          className="nav-link active"
                          data-bs-toggle="tab"
                          data-bs-target="#ventasPendientes"
                          type="button"
                        >
                          Ventas Pendientes
                        </button>
                      </li>
                      <li className="nav-item" role="presentation">
                        <button
                          className="nav-link"
                          data-bs-toggle="tab"
                          data-bs-target="#mantenimientosPendientes"
                          type="button"
                        >
                          Mantenimientos Pendientes
                        </button>
                      </li>
                    </ul>

                    <div className="tab-content py-3">
                      <div
                        className="tab-pane fade show active"
                        id="ventasPendientes"
                      >
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Fecha</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>#001</td>
                                <td>Juan Pérez</td>
                                <td>2023-10-31</td>
                                <td>S/. 150.00</td>
                                <td>
                                  <span className="badge bg-warning">
                                    Pendiente
                                  </span>
                                </td>
                                <td>
                                  <button className="btn btn-primary btn-sm me-2">
                                    Ver
                                  </button>
                                  <button className="btn btn-success btn-sm">
                                    Procesar
                                  </button>
                                </td>
                              </tr>
                              {/* Más filas de ejemplo... */}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div
                        className="tab-pane fade"
                        id="mantenimientosPendientes"
                      >
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Equipo</th>
                                <th>Cliente</th>
                                <th>Fecha Ingreso</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>#M001</td>
                                <td>Laptop Dell</td>
                                <td>María García</td>
                                <td>2023-10-30</td>
                                <td>Preventivo</td>
                                <td>
                                  <span className="badge bg-warning">
                                    Pendiente
                                  </span>
                                </td>
                                <td>
                                  <button className="btn btn-primary btn-sm me-2">
                                    Ver
                                  </button>
                                  <button className="btn btn-success btn-sm">
                                    Actualizar
                                  </button>
                                </td>
                              </tr>
                              {/* Más filas de ejemplo... */}
                            </tbody>
                          </table>
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

export default ListaPendientes;
