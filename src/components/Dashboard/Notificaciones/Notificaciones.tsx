import Nav from "../../Layout/Nav";
import Sidebar from "../../Layout/Sidebar";
import "./Notificaciones.css";

function Notificaciones() {
  // Datos de ejemplo
  const notificaciones = [
    {
      id: 1,
      tipo: "agotado",
      nombre: "Laptop Dell Inspiron",
      estado: "Agotado",
      riesgo: "Alto",
      imagen: "/assets/images/default.png",
      mensaje:
        "Este producto está agotado. Es crucial reabastecerlo lo antes posible para evitar interrupciones en el inventario.",
      recomendacion: "Realizar pedido inmediatamente",
    },
    {
      id: 2,
      tipo: "pocos",
      nombre: 'Monitor HP 24"',
      estado: "Quedan pocos lotes",
      riesgo: "Medio",
      imagen: "/assets/images/default.png",
      mensaje: "La cantidad total de lotes de este producto es menor a 50.",
      recomendacion: "Planificar reabastecimiento",
    },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-area">
        <Nav />
        <div className="page-wrapper">
          <div className="page-content">
            {/* Breadcrumb */}
            <div className="page-breadcrumb d-none d-sm-flex align-items-center mb-3">
              <div className="breadcrumb-title pe-3">Dashboard</div>
              <div className="ps-3">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0 p-0">
                    <li className="breadcrumb-item">
                      <i className="bx bx-home-alt"></i>
                    </li>
                    <li className="breadcrumb-item active">
                      Notificaciones y alertas
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
                    <h6 className="mb-0">Notificaciones y alertas</h6>
                  </div>
                </div>
              </div>

              <div className="card-body">
                {notificaciones.map((notif) => (
                  <div
                    key={notif.id}
                    className={`alert ${
                      notif.tipo === "agotado"
                        ? "alert-danger"
                        : "alert-warning"
                    } d-flex align-items-center`}
                    role="alert"
                  >
                    <div
                      className={`alert-image ${
                        notif.tipo === "agotado"
                          ? "riesgo-alto"
                          : "riesgo-medio"
                      } me-3`}
                    >
                      <img src={notif.imagen} alt={notif.nombre} />
                    </div>
                    <div>
                      <h5 className="alert-heading">{notif.nombre}</h5>
                      <p>
                        <strong>Estado:</strong> {notif.estado}
                      </p>
                      <p>
                        <strong>Riesgo:</strong> {notif.riesgo}
                      </p>
                      <p className="mb-0">{notif.mensaje}</p>
                      <hr />
                      <p className="mb-0">
                        <strong>Recomendación:</strong> {notif.recomendacion}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notificaciones;
