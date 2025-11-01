import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Analisis from "./components/Dashboard/Analisis/Analisis";
import Login from "./components/Login/Login";
import ListaPendientes from "./components/Dashboard/ListaPendientes/ListaPendientes";
import Notificaciones from "./components/Dashboard/Notificaciones/Notificaciones";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Analisis />} />
        <Route path="/dashboard/historial" element={<ListaPendientes />} />
        <Route path="/dashboard/notificaciones" element={<Notificaciones />} />
      </Routes>
    </Router>
  );
}

export default App;
