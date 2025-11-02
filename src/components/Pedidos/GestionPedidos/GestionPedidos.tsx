import { useState } from "react";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./GestionPedidos.css";

interface Pedido {
  id: string;
  cliente: string;
  fechaPedido: string;
  tipo: string;
  total: number;
  estado: "Pendiente" | "Entregado" | "Cancelado";
}

interface DetallePedido {
  producto: string;
  cantidad: number;
  costo: number;
}

function GestionPedidos() {
  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState({ start: "", end: "" });
  const [filterStatus, setFilterStatus] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<string | null>(null);

  // Datos de ejemplo
  const pedidos: Pedido[] = [
    {
      id: "001",
      cliente: "Juan Pérez",
      fechaPedido: "2023-11-01",
      tipo: "Envío",
      total: 150.0,
      estado: "Pendiente",
    },
    {
      id: "002",
      cliente: "María García",
      fechaPedido: "2023-11-01",
      tipo: "Recoger",
      total: 280.5,
      estado: "Entregado",
    },
  ];

  const detallesPedido: Record<string, DetallePedido[]> = {
    "001": [
      { producto: "Producto A", cantidad: 2, costo: 50.0 },
      { producto: "Producto B", cantidad: 1, costo: 50.0 },
    ],
    "002": [{ producto: "Producto C", cantidad: 1, costo: 280.5 }],
  };

  // Estadísticas
  const stats = {
    total: pedidos.length,
    pendientes: pedidos.filter((p) => p.estado === "Pendiente").length,
    entregados: pedidos.filter((p) => p.estado === "Entregado").length,
    cancelados: pedidos.filter((p) => p.estado === "Cancelado").length,
  };

  // Filtros
  const filteredPedidos = pedidos.filter((pedido) => {
    const matchesSearch = pedido.cliente
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || pedido.estado === filterStatus;
    const matchesDate =
      (!filterDate.start || pedido.fechaPedido >= filterDate.start) &&
      (!filterDate.end || pedido.fechaPedido <= filterDate.end);
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-area">
        <Nav />
        <div className="page-wrapper">
          <div className="page-content">
            {/* Breadcrumb */}
            <div className="page-breadcrumb d-none d-sm-flex align-items-center mb-3">
              <div className="breadcrumb-title pe-3">Pedidos</div>
              <div className="ps-3">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0 p-0">
                    <li className="breadcrumb-item">
                      <i className="bx bx-home-alt"></i>
                    </li>
                    <li className="breadcrumb-item active">
                      Gestión de pedidos
                    </li>
                  </ol>
                </nav>
              </div>
            </div>

            {/* Cards estadísticas */}
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4">
              <div className="col">
                <div className="card radius-10 bg-gradient-cosmic">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="me-auto">
                        <p className="mb-0 text-white">Total Pedidos</p>
                        <h4 className="my-1 text-white">{stats.total}</h4>
                      </div>
                      <div>
                        <i className="bx bx-cart text-white fs-3"></i>
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
                        <p className="mb-0 text-white">Pendientes</p>
                        <h4 className="my-1 text-white">{stats.pendientes}</h4>
                      </div>
                      <div>
                        <i className="bx bx-time text-white fs-3"></i>
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
                        <p className="mb-0 text-white">Entregados</p>
                        <h4 className="my-1 text-white">{stats.entregados}</h4>
                      </div>
                      <div>
                        <i className="bx bx-check-circle text-white fs-3"></i>
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
                        <p className="mb-0 text-white">Cancelados</p>
                        <h4 className="my-1 text-white">{stats.cancelados}</h4>
                      </div>
                      <div>
                        <i className="bx bx-x-circle text-white fs-3"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla principal */}
            <div className="card radius-10">
              <div className="card-header">
                <div className="d-flex align-items-center">
                  <div>
                    <h6 className="mb-0">Gestión de Pedidos</h6>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div className="table-responsive">
                  <div className="d-flex justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                      <div className="position-relative flex-grow-1">
                        <input
                          type="search"
                          className="form-control ps-5 radius-30"
                          placeholder="Buscar según el cliente"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="position-absolute top-50 product-show translate-middle-y">
                          <i className="bx bx-search"></i>
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="dropdown">
                        <button
                          className="btn btn-light dropdown-toggle"
                          type="button"
                          data-bs-toggle="dropdown"
                        >
                          Filtrar por Fecha
                        </button>
                        <div className="dropdown-menu p-3">
                          <div className="d-flex gap-2">
                            <input
                              type="date"
                              className="form-control"
                              value={filterDate.start}
                              onChange={(e) =>
                                setFilterDate((prev) => ({
                                  ...prev,
                                  start: e.target.value,
                                }))
                              }
                            />
                            <span>a</span>
                            <input
                              type="date"
                              className="form-control"
                              value={filterDate.end}
                              onChange={(e) =>
                                setFilterDate((prev) => ({
                                  ...prev,
                                  end: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <select
                        className="form-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="">Filtrar por Estado</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Entregado">Entregado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Pedido ID</th>
                        <th>Cliente</th>
                        <th>Fecha Pedido</th>
                        <th>Tipo</th>
                        <th>Total (S/)</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPedidos.map((pedido) => (
                        <tr key={pedido.id}>
                          <td>{pedido.id}</td>
                          <td>
                            <span className="badge cliente-nombre">
                              {pedido.cliente}
                            </span>
                          </td>
                          <td>{pedido.fechaPedido}</td>
                          <td>{pedido.tipo}</td>
                          <td>S/ {pedido.total.toFixed(2)}</td>
                          <td>
                            <span
                              className={`badge badge-${pedido.estado.toLowerCase()}`}
                            >
                              {pedido.estado}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex justify-content-center gap-2">
                              {pedido.estado !== "Entregado" && (
                                <button
                                  className="btn btn-danger btn-sm btn-action"
                                  onClick={() => {
                                    setSelectedPedido(pedido.id);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <i className="bx bx-trash"></i>
                                </button>
                              )}
                              <button
                                className="btn btn-info btn-sm btn-action"
                                onClick={() => {
                                  setSelectedPedido(pedido.id);
                                  setShowDetailModal(true);
                                }}
                              >
                                <i className="bx bx-list-ul"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Detalle */}
            {showDetailModal && selectedPedido && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-lg modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Detalle del Pedido</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowDetailModal(false)}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Costo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detallesPedido[selectedPedido].map(
                            (detalle, idx) => (
                              <tr key={idx}>
                                <td>{detalle.producto}</td>
                                <td>{detalle.cantidad}</td>
                                <td>S/ {detalle.costo.toFixed(2)}</td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowDetailModal(false)}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Eliminar */}
            {showDeleteModal && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Confirmar Eliminación</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowDeleteModal(false)}
                      ></button>
                    </div>
                    <div className="modal-body">
                      ¿Seguro que deseas eliminar este pedido?
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowDeleteModal(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => {
                          // Simular eliminación
                          alert("Pedido eliminado (simulación frontend)");
                          setShowDeleteModal(false);
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GestionPedidos;
