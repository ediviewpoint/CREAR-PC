"use client";
import { useEffect, useState } from "react";
import { SettingsSchema } from "@/lib/admin-settings";
import Link from "next/link";
type User = {
  id: string;
  nombre: string;
  email: string;
  rol: "ADMIN" | "EDITOR" | "VENDEDOR" | "LECTOR";
  activo: boolean;
};
type Data = {
  settings: Record<string, unknown>;
  users: User[];
  aliases: { id: string; tipo: string; valor: string; normalizado: string }[];
  usage: {
    usuarioId: string;
    funcion: string;
    _sum: { costoUsd: string; tokensIn: number; tokensOut: number };
    _count: number;
  }[];
  created: { creadoPorId: string; _count: number }[];
  edits: { usuarioId: string; _count: number }[];
};
export function ConfiguracionPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [user, setUser] = useState<Partial<User> & { password?: string }>({
    nombre: "",
    email: "",
    rol: "EDITOR",
    activo: true,
  });
  const [alias, setAlias] = useState({ tipo: "marca", valor: "", normalizado: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function reload() {
    const response = await fetch("/api/configuracion");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "No se pudo cargar");
    setData(result);
    setSettings(result.settings);
  }
  useEffect(() => {
    void Promise.resolve()
      .then(reload)
      .catch((e) => setMessage(e.message));
  }, []);
  async function save(url: string, body: unknown) {
    setBusy(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "No se pudo guardar");
      setMessage("Configuración guardada");
      await reload();
      return true;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "No se pudo guardar");
      return false;
    } finally {
      setBusy(false);
    }
  }
  const fx = (settings.tipoCambio || {
    valor: 6.96,
    fecha: null,
    fuente: "Configuración inicial; verificar",
    verificado: false,
  }) as { valor: number | string; fecha: string | null; fuente: string; verificado: boolean };
  return (
    <>
      <div className="elite-page-header">
        <h1>Configuración</h1>
      </div>
      {message && (
        <div className="elite-notice" role="status">
          {message}
        </div>
      )}
      <div className="elite-form-columns elite-settings">
        <section className="elite-card">
          <h2>Precios, stock y límites IA</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const parsed = SettingsSchema.safeParse(settings);
              if (!parsed.success) {
                setMessage(parsed.error.issues[0]?.message || "Revisa los valores");
                return;
              }
              void save("/api/configuracion", parsed.data);
            }}
          >
            {[
              ["recargoConFactura", "Recargo con factura %"],
              ["umbralStockBajo", "Umbral de stock bajo"],
              ["limiteDiarioIA", "Llamadas IA por usuario por día"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type="number"
                  min={0}
                  value={Number(settings[key!] ?? 0)}
                  onChange={(e) => setSettings((v) => ({ ...v, [key!]: Number(e.target.value) }))}
                />
              </label>
            ))}
            <label>
              <input
                type="checkbox"
                checked={settings.redondearDecena !== false}
                onChange={(e) => setSettings((v) => ({ ...v, redondearDecena: e.target.checked }))}
              />
              Redondear precios a la decena
            </label>
            <label>
              Prefijo SKU
              <input
                maxLength={1}
                value={String(settings.prefijoSku || "Z")}
                onChange={(e) =>
                  setSettings((v) => ({ ...v, prefijoSku: e.target.value.toUpperCase() }))
                }
              />
            </label>
            <h2>Tipo de cambio de respaldo</h2>
            <label>
              Valor Bs por USD
              <input
                inputMode="decimal"
                value={String(fx.valor)}
                onChange={(e) =>
                  setSettings((v) => ({
                    ...v,
                    tipoCambio: { ...fx, valor: e.target.value.replace(",", ".") },
                  }))
                }
              />
            </label>
            <label>
              Fuente
              <input
                value={fx.fuente}
                onChange={(e) =>
                  setSettings((v) => ({ ...v, tipoCambio: { ...fx, fuente: e.target.value } }))
                }
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={fx.verificado}
                onChange={(e) =>
                  setSettings((v) => ({
                    ...v,
                    tipoCambio: {
                      ...fx,
                      verificado: e.target.checked,
                      fecha: e.target.checked ? new Date().toISOString() : fx.fecha,
                    },
                  }))
                }
              />
              Confirmé el valor y su fuente
            </label>
            <h2>Plantilla de WhatsApp</h2>
            <p>
              Campos disponibles: SKU, TITULO, PRECIO_SF, PRECIO_CF y DESTACADO_1 a DESTACADO_4
              entre llaves.
            </p>
            <textarea
              rows={9}
              value={String(settings.plantillaWhatsApp || "")}
              onChange={(e) => setSettings((v) => ({ ...v, plantillaWhatsApp: e.target.value }))}
            />
            <button className="elite-button" disabled={busy}>
              Guardar configuración
            </button>
          </form>
          <p>
            <Link href="/admin/categorias">Editar plantillas de título y specs por categoría</Link>
          </p>
          <p>
            <Link href="/admin/wordpress">Configurar WordPress</Link>
          </p>
        </section>
        <div>
          <section className="elite-card">
            <h2>Usuarios y roles</h2>
            <select
              aria-label="Editar usuario"
              onChange={(e) => {
                const found = data?.users.find((v) => v.id === e.target.value);
                setUser(
                  found
                    ? { ...found, password: "" }
                    : { nombre: "", email: "", rol: "EDITOR", activo: true },
                );
              }}
            >
              <option value="">Crear usuario</option>
              {data?.users
                .filter((v) => v.id !== "sistema")
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre} · {v.rol}
                  </option>
                ))}
            </select>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void save("/api/configuracion/usuarios", {
                  ...user,
                  password: user.password || undefined,
                });
              }}
            >
              <label>
                Nombre
                <input
                  required
                  value={user.nombre || ""}
                  onChange={(e) => setUser((v) => ({ ...v, nombre: e.target.value }))}
                />
              </label>
              <label>
                Correo
                <input
                  type="email"
                  required
                  value={user.email || ""}
                  onChange={(e) => setUser((v) => ({ ...v, email: e.target.value }))}
                />
              </label>
              <label>
                Rol
                <select
                  value={user.rol || "EDITOR"}
                  onChange={(e) => setUser((v) => ({ ...v, rol: e.target.value as User["rol"] }))}
                >
                  {["ADMIN", "EDITOR", "VENDEDOR", "LECTOR"].map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </label>
              <label>
                Contraseña nueva
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  value={user.password || ""}
                  onChange={(e) => setUser((v) => ({ ...v, password: e.target.value }))}
                  placeholder={user.id ? "Deja vacío para conservarla" : "Al menos 12 caracteres"}
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={user.activo !== false}
                  onChange={(e) => setUser((v) => ({ ...v, activo: e.target.checked }))}
                />
                Usuario activo
              </label>
              <button className="elite-button" disabled={busy}>
                Guardar usuario
              </button>
            </form>
          </section>
          <section className="elite-card">
            <h2>Alias de marcas y abreviaturas</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void save("/api/configuracion/alias", alias);
              }}
            >
              <select
                aria-label="Tipo de alias"
                value={alias.tipo}
                onChange={(e) => setAlias((v) => ({ ...v, tipo: e.target.value }))}
              >
                <option value="marca">Marca</option>
                <option value="abreviatura">Abreviatura</option>
              </select>
              <label>
                Texto de entrada
                <input
                  required
                  value={alias.valor}
                  onChange={(e) => setAlias((v) => ({ ...v, valor: e.target.value }))}
                />
              </label>
              <label>
                Valor normalizado
                <input
                  required
                  value={alias.normalizado}
                  onChange={(e) => setAlias((v) => ({ ...v, normalizado: e.target.value }))}
                />
              </label>
              <button className="elite-button" disabled={busy}>
                Guardar alias
              </button>
            </form>
            <details>
              <summary>Ver {data?.aliases.length || 0} alias</summary>
              {data?.aliases.map((v) => (
                <p key={v.id}>
                  {v.valor} → {v.normalizado}
                </p>
              ))}
            </details>
          </section>
        </div>
      </div>
      <section className="elite-card" style={{ marginTop: 24 }}>
        <h2>Uso de IA del mes</h2>
        <table className="elite-products-table">
          <thead>
            <tr>
              {[
                "Usuario",
                "Función",
                "Llamadas",
                "Tokens entrada",
                "Tokens salida",
                "Costo estimado USD",
              ].map((v) => (
                <th key={v}>{v}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.usage.map((v, i) => (
              <tr key={i}>
                <td>{data.users.find((u) => u.id === v.usuarioId)?.nombre || v.usuarioId}</td>
                <td>{v.funcion}</td>
                <td>{v._count}</td>
                <td>{v._sum.tokensIn}</td>
                <td>{v._sum.tokensOut}</td>
                <td>$us {Number(v._sum.costoUsd || 0).toFixed(5)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2 style={{ marginTop: 20 }}>Actividad del mes</h2>
        {data?.users.map((user) => (
          <p key={user.id}>
            {user.nombre}: {data.created.find((v) => v.creadoPorId === user.id)?._count || 0}{" "}
            productos creados · {data.edits.find((v) => v.usuarioId === user.id)?._count || 0}{" "}
            cambios
          </p>
        ))}
      </section>
    </>
  );
}
