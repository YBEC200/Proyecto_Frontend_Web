import { Link } from "react-router-dom";
import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./Perfil.css";

export default function Perfil() {
  // Datos de ejemplo (simular backend)
  const userData = {
    id: 1,
    nombre: "Carlos",
    apellidoPaterno: "Apellido1",
    apellidoMaterno: "Apellido2",
    correo: "carlos@cdtech.com",
    telefono: "+56 9 1234 5678",
    rol: "Administrador",
    website: "www.cd_technology.com",
    facebook: "www.facebook.com/CD-TECH",
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Aquí iría la lógica para actualizar el perfil
    alert("Perfil actualizado correctamente");
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-area">
        <Nav />
        <div className="page-wrapper">
          <div className="page-content">
            {/* Breadcrumb */}
            <div className="page-breadcrumb d-none d-sm-flex align-items-center mb-3">
              <div className="breadcrumb-title pe-3">Perfil de Usuario</div>
              <div className="ps-3">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0 p-0">
                    <li className="breadcrumb-item">
                      <Link to="/dashboard">
                        <i className="bx bx-home-alt"></i>
                      </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      {userData.correo}
                    </li>
                  </ol>
                </nav>
              </div>
            </div>

            <div className="container">
              <div className="main-body">
                <div className="row">
                  {/* Tarjeta de Perfil */}
                  <div className="col-lg-4">
                    <div className="card">
                      <div className="card-body">
                        <div className="d-flex flex-column align-items-center text-center">
                          <img
                            src="/assets/images/avatars/avatar-1.png"
                            alt="Admin"
                            className="rounded-circle p-1 bg-primary"
                            width="110"
                          />
                          <div className="mt-3">
                            <h4>{userData.nombre}</h4>
                            <p className="text-secondary mb-1">
                              {userData.rol}
                            </p>
                            <p className="text-muted font-size-sm">
                              {userData.telefono}
                            </p>
                          </div>
                        </div>
                        <hr className="my-4" />
                        <ul className="list-group list-group-flush">
                          <li className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                            <h6 className="mb-0">
                              <i className="bx bx-globe me-2"></i>
                              Website
                            </h6>
                            <span className="text-secondary">
                              {userData.website}
                            </span>
                          </li>
                          <li className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                            <h6 className="mb-0">
                              <i className="bx bx-envelope me-2"></i>
                              Correo
                            </h6>
                            <span className="text-secondary">
                              {userData.correo}
                            </span>
                          </li>
                          <li className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                            <h6 className="mb-0">
                              <i className="bx bxl-facebook-square me-2"></i>
                              Facebook
                            </h6>
                            <span className="text-secondary">
                              {userData.facebook}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Formulario de Edición */}
                  <div className="col-lg-8">
                    <div className="card">
                      <div className="card-body">
                        <form onSubmit={handleSubmit}>
                          <div className="row mb-3">
                            <div className="col-sm-3">
                              <h6 className="mb-0">Nombre</h6>
                            </div>
                            <div className="col-sm-9">
                              <input
                                type="text"
                                className="form-control"
                                defaultValue={userData.nombre}
                              />
                            </div>
                          </div>
                          <div className="row mb-3">
                            <div className="col-sm-3">
                              <h6 className="mb-0">Apellido Paterno</h6>
                            </div>
                            <div className="col-sm-9">
                              <input
                                type="text"
                                className="form-control"
                                defaultValue={userData.apellidoPaterno}
                              />
                            </div>
                          </div>
                          <div className="row mb-3">
                            <div className="col-sm-3">
                              <h6 className="mb-0">Apellido Materno</h6>
                            </div>
                            <div className="col-sm-9">
                              <input
                                type="text"
                                className="form-control"
                                defaultValue={userData.apellidoMaterno}
                              />
                            </div>
                          </div>
                          <div className="row mb-3">
                            <div className="col-sm-3">
                              <h6 className="mb-0">Correo</h6>
                            </div>
                            <div className="col-sm-9">
                              <input
                                type="email"
                                className="form-control"
                                defaultValue={userData.correo}
                              />
                            </div>
                          </div>
                          <div className="row mb-3">
                            <div className="col-sm-3">
                              <h6 className="mb-0">Teléfono</h6>
                            </div>
                            <div className="col-sm-9">
                              <input
                                type="text"
                                className="form-control"
                                defaultValue={userData.telefono}
                              />
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-sm-3"></div>
                            <div className="col-sm-9">
                              <button
                                type="submit"
                                className="btn btn-primary px-4"
                              >
                                Guardar Cambios
                              </button>
                            </div>
                          </div>
                        </form>
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
