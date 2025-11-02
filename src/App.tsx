import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Analisis from "./components/Dashboard/Analisis/Analisis";
import Login from "./components/Login/Login";
import ListaPendientes from "./components/Dashboard/ListaPendientes/ListaPendientes";
import Notificaciones from "./components/Dashboard/Notificaciones/Notificaciones";
import Usuarios from "./components/Usuarios/Usuarios";
import AsignarPedidos from "./components/Pedidos/AsignarPedidos/AsignarPedidos";
import GestionPedidos from "./components/Pedidos/GestionPedidos/GestionPedidos";
import GestionProductos from "./components/Producto/GestionProductos/GestionProductos";
import GestionLotes from "./components/Producto/GestionLotes/GestionLotes";
import AgregarProducto from "./components/Producto/AgregarProducto/AgregarProducto";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Analisis />} />
        <Route path="/dashboard/historial" element={<ListaPendientes />} />
        <Route path="/dashboard/notificaciones" element={<Notificaciones />} />
        <Route path="/pedidos" element={<GestionPedidos />} />
        <Route path="/pedidos/asignar" element={<AsignarPedidos />} />
        <Route path="/productos" element={<GestionProductos />} />
        <Route path="/productos/lotes" element={<GestionLotes />} />
        <Route
          path="/productos/agregarproductos"
          element={<AgregarProducto />}
        />
        <Route path="/usuarios" element={<Usuarios />} />
      </Routes>
    </Router>
  );
}

export default App;
