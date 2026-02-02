import { useState } from "react";
import "./Login.css";
const API_URL = import.meta.env.VITE_API_URL;
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const validarEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setErrorMessage("");
    let valido = true;

    if (email === "") {
      setEmailError("Por favor, ingresa tu correo electrónico.");
      valido = false;
    } else if (!validarEmail(email)) {
      setEmailError("Ingresa un correo electrónico válido.");
      valido = false;
    }

    if (password === "") {
      setPasswordError("Por favor, ingresa tu contraseña.");
      valido = false;
    }

    if (!valido) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo: email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("isAuthenticated", "true");
        window.location.href = "/dashboard";
      } else {
        setErrorMessage(
          data.message || "Correo electrónico y/o contraseña incorrectos.",
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setErrorMessage("Error al conectar con el servidor. Inténtalo de nuevo.");
    }
  };

  return (
    <>
      <div className="background"></div>
      <div className="wrapper">
        <div className="section-authentication-signin d-flex align-items-center justify-content-center my-5 my-lg-0">
          <div className="container">
            <div className="row row-cols-1 row-cols-lg-2 row-cols-xl-3">
              <div className="col mx-auto">
                <div className="card mb-0">
                  <div className="card-body">
                    <div className="p-1">
                      <div className="mb-2 text-center">
                        <img
                          src="/assets/images/CDTECH.png"
                          width="90"
                          alt="Logo CDTECH"
                        />
                      </div>
                      <div className="text-center mb-4">
                        <h5>Administrador</h5>
                        <p className="mb-0">
                          Por favor, inicie sesión en su cuenta
                        </p>
                      </div>
                      <div className="form-body">
                        <form className="row g-3" onSubmit={handleSubmit}>
                          <div className="col-12">
                            <label
                              htmlFor="inputEmailAddress"
                              className="form-label"
                            >
                              Correo Electrónico
                            </label>
                            <input
                              type="email"
                              className="form-control"
                              id="inputEmailAddress"
                              placeholder="example@gmail.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                            {emailError && (
                              <div style={{ color: "red", fontSize: "0.9em" }}>
                                {emailError}
                              </div>
                            )}
                          </div>
                          <div className="col-12">
                            <label
                              htmlFor="inputChoosePassword"
                              className="form-label"
                            >
                              Contraseña
                            </label>
                            <div
                              className="input-group"
                              id="show_hide_password"
                            >
                              <input
                                type={showPassword ? "text" : "password"}
                                className="form-control border-end-0"
                                id="inputChoosePassword"
                                placeholder="******"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                              />
                              <span
                                className="input-group-text"
                                style={{ cursor: "pointer" }}
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                <i
                                  className={`bx ${
                                    showPassword ? "bx-show" : "bx-hide"
                                  }`}
                                ></i>
                              </span>
                            </div>
                            {passwordError && (
                              <div style={{ color: "red", fontSize: "0.9em" }}>
                                {passwordError}
                              </div>
                            )}
                          </div>
                          <div className="col-md-6">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="flexSwitchCheckChecked"
                              />
                              <label
                                className="form-check-label"
                                htmlFor="flexSwitchCheckChecked"
                              >
                                Recuérdame
                              </label>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="d-grid">
                              <button type="submit" className="btn btn-primary">
                                Iniciar sesión
                              </button>
                            </div>
                            {errorMessage && (
                              <div
                                style={{
                                  color: "red",
                                  marginTop: "10px",
                                  textAlign: "center",
                                }}
                              >
                                {errorMessage}
                              </div>
                            )}
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
    </>
  );
}
