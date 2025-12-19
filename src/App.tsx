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
import GestionCategorias from "./components/Producto/GestionLotes/GestionCategorias";
import AgregarProducto from "./components/Producto/AgregarProducto/AgregarProducto";
import Sidebar from "./components/Layout/Sidebar";
import Perfil from "./components/Usuarios/Perfil/Perfil";
import PrivateRoute from "./utilities/PrivateRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/sidebar"
          element={
            <PrivateRoute>
              <Sidebar />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Analisis />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/historial"
          element={
            <PrivateRoute>
              <ListaPendientes />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/notificaciones"
          element={
            <PrivateRoute>
              <Notificaciones />
            </PrivateRoute>
          }
        />
        <Route
          path="/pedidos"
          element={
            <PrivateRoute>
              <GestionPedidos />
            </PrivateRoute>
          }
        />
        <Route
          path="/pedidos/asignar"
          element={
            <PrivateRoute>
              <AsignarPedidos />
            </PrivateRoute>
          }
        />
        <Route
          path="/productos"
          element={
            <PrivateRoute>
              <GestionProductos />
            </PrivateRoute>
          }
        />
        <Route
          path="/productos/categorias"
          element={
            <PrivateRoute>
              <GestionCategorias />
            </PrivateRoute>
          }
        />
        <Route
          path="/productos/agregarproductos"
          element={
            <PrivateRoute>
              <AgregarProducto />
            </PrivateRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <PrivateRoute>
              <Usuarios />
            </PrivateRoute>
          }
        />
        <Route
          path="/tu_perfil"
          element={
            <PrivateRoute>
              <Perfil />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
