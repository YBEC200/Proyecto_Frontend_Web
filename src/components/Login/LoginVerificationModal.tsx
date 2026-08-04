import { useEffect, useState } from "react";

type LoginVerificationModalProps = {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onVerified: (message: string) => Promise<void> | void;
};

const API_URL = import.meta.env.VITE_API_URL;

export default function LoginVerificationModal({
  isOpen,
  email,
  onClose,
  onVerified,
}: LoginVerificationModalProps) {
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setCodeError("");
      setInfoMessage("");
    }
  }, [isOpen]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError("");
    setInfoMessage("");

    if (!code.trim()) {
      setCodeError("Ingresa el código de verificación.");
      return;
    }

    if (code.trim().length !== 6) {
      setCodeError("El código debe tener 6 dígitos.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/verify-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: email,
          codigo: Number(code),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await onVerified(data.message || "Cuenta verificada correctamente.");
        onClose();
      } else {
        setCodeError(data.message || "El código es incorrecto o ya expiró.");
      }
    } catch {
      setCodeError("No pudimos verificar el código en este momento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setCodeError("");
    setInfoMessage("");
    setIsResending(true);

    try {
      const response = await fetch(`${API_URL}/api/reenviar-codigo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo: email }),
      });

      const data = await response.json();

      if (response.ok) {
        setInfoMessage(
          data.message ||
            "Hemos reenviado el código de verificación a tu correo.",
        );
      } else {
        setCodeError(data.message || "No se pudo reenviar el código.");
      }
    } catch {
      setCodeError("No pudimos reenviar el código en este momento.");
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div
        className="login-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="login-modal-header">
          <div>
            <h4 className="login-modal-title">Verificación de cuenta</h4>
            <p className="login-modal-subtitle">
              Ingresa el código de 6 dígitos que te enviamos a {email}.
            </p>
          </div>
          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar"
            onClick={onClose}
          ></button>
        </div>

        <form onSubmit={handleVerifyCode} className="login-modal-body">
          <label htmlFor="verificationCode" className="form-label">
            Código de verificación
          </label>
          <input
            id="verificationCode"
            type="text"
            className="form-control"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="******"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />

          {codeError && <div className="login-modal-error">{codeError}</div>}
          {infoMessage && <div className="login-modal-info">{infoMessage}</div>}

          <div className="d-grid gap-2 mt-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verificando..." : "Confirmar código"}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleResendCode}
              disabled={isResending}
            >
              {isResending ? "Reenviando..." : "Reenviar código"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
