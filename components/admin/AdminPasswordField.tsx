"use client";
import { useState } from "react";

export function AdminPasswordField() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <label htmlFor="admin-password">Contraseña de administración</label>
      <div className="admin-password-control">
        <input
          id="admin-password"
          name="password"
          type={visible ? "text" : "password"}
          required
          autoComplete="current-password"
          autoCapitalize="none"
          spellCheck={false}
        />
        <button
          type="button"
          className="button button--ghost"
          aria-controls="admin-password"
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
    </>
  );
}
