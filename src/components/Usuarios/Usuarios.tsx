import { useState } from "react";
import Nav from "../Layout/Nav";
import Sidebar from "../Layout/Sidebar";
import "./Usuarios.css";

interface Compra {
  id: number;
  total: number;
  fecha: string;
  estado: string;
}

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  fechaRegistro: string;
  compras: Compra[];
}

function Usuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Datos de ejemplo tipados
  const usuarios: Usuario[] = [
    {
      id: "001",
      nombre: "Juan Pérez García",
      correo: "juan.perez@example.com",
      rol: "User",
      fechaRegistro: "15 Oct 2023",
      compras: [
        { id: 1, total: 150.0, fecha: "2023-10-31", estado: "Pendiente" },
        { id: 2, total: 280.5, fecha: "2023-10-15", estado: "Entregado" },
      ],
    },
    {
      id: "002",
      nombre: "María Rodríguez",
      correo: "maria.rodriguez@example.com",
      rol: "Admin",
      fechaRegistro: "10 Sep 2023",
      compras: [
        { id: 3, total: 450.0, fecha: "2023-10-25", estado: "Entregado" },
      ],
    },
  ];

  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  const filteredUsers = usuarios.filter((user) => {
    const matchesSearch = user.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === "" || user.rol.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
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
              <div className="breadcrumb-title pe-3">Usuarios</div>
              <div className="ps-3">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0 p-0">
                    <li className="breadcrumb-item">
                      <i className="bx bx-home-alt"></i>
                    </li>
                    <li className="breadcrumb-item active">
                      Lista de usuarios
                    </li>
                  </ol>
                </nav>
              </div>
            </div>

            {/* Card principal */}
            <div className="card radius-10">
              <div className="card-header">
                <div className="d-flex align-items-center">
                  <div>
                    <h6 className="mb-0">Lista de usuarios</h6>
                  </div>
                  <div className="dropdown ms-auto">
                    <a
                      className="dropdown-toggle dropdown-toggle-nocaret"
                      href="#"
                      data-bs-toggle="dropdown"
                    >
                      <i className="bx bx-dots-horizontal-rounded font-22 text-option"></i>
                    </a>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div className="table-responsive">
                  <div className="d-flex justify-content-between mb-3">
                    <div className="position-relative">
                      <input
                        type="search"
                        className="form-control ps-5 radius-30 input-60"
                        placeholder="Buscar cliente"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <span className="position-absolute top-50 product-show translate-middle-y">
                        <i className="bx bx-search"></i>
                      </span>
                    </div>
                    <select
                      className="form-select w-25"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="">Rol</option>
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                    </select>
                  </div>

                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Nombre Completo</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Fecha de Registro</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="client-row">
                          <td>{user.id}</td>
                          <td className="client-name">{user.nombre}</td>
                          <td>{user.correo}</td>
                          <td className="client-role">{user.rol}</td>
                          <td>{user.fechaRegistro}</td>
                          <td>
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                className="btn-action-details"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowOrdersModal(true);
                                }}
                              >
                                <i className="bx bx-receipt"></i>
                              </button>
                              <button
                                className="btn-action-delete"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <i className="bx bx-trash"></i>
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

            {/* Modal de Órdenes */}
            {showOrdersModal && selectedUser && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">
                        Compras de {selectedUser.nombre}
                      </h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowOrdersModal(false)}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>ID Pedido</th>
                            <th>Total</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedUser.compras.map((compra) => (
                            <tr key={compra.id}>
                              <td>{compra.id}</td>
                              <td>S/ {compra.total.toFixed(2)}</td>
                              <td>{compra.fecha}</td>
                              <td>
                                <span
                                  className={`badge badge-${compra.estado.toLowerCase()}`}
                                >
                                  {compra.estado}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowOrdersModal(false)}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Eliminación */}
            {showDeleteModal && selectedUser && (
              <div className="modal show d-block" tabIndex={-1}>
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header bg-danger text-white">
                      <h5 className="modal-title">Confirmar Eliminación</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowDeleteModal(false)}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <p>
                        ¿Estás seguro de que deseas eliminar a{" "}
                        {selectedUser.nombre}?
                      </p>
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
                          // Aquí iría la lógica de eliminación
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

export default Usuarios;
