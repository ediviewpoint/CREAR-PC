"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
type Data = {
  configurado: boolean;
  url: string;
  usuario: string;
  productos: {
    id: string;
    sku: string;
    titulo: string;
    wpSyncEstado: string;
    wpSyncFecha: string;
    wpSyncError: string | null;
  }[];
};
export function WordpressPanel({ admin }: { admin: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [url, setUrl] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    const response = await fetch("/api/wordpress");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "No se pudo cargar");
    setData(result);
    setUrl(result.url);
    setUser(result.usuario);
  }
  useEffect(() => {
    void Promise.resolve()
      .then(load)
      .catch((e) => setMessage(e.message));
  }, []);
  return (
    <>
      <div className="elite-page-header">
        <div>
          <h1>WordPress</h1>
          <p>Publica y actualiza el catálogo en WooCommerce.</p>
        </div>
      </div>
      {message && (
        <p role="status" className="elite-notice">
          {message}
        </p>
      )}
      <section className="elite-card elite-settings">
        <h2>Conexión</h2>
        <p>
          {data?.configurado
            ? `Conexión configurada: ${data.url}`
            : "Conexión pendiente. Agrega los datos de WordPress para habilitar la publicación."}
        </p>
        {admin && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                const response = await fetch("/api/wordpress", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ url, usuario: user, password }),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error?.message || "No se pudo conectar");
                setMessage("Conexión comprobada");
                setPassword("");
                await load();
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "No se pudo conectar");
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              URL de WordPress
              <input
                type="url"
                required
                placeholder="https://tu-tienda.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </label>
            <label>
              Usuario
              <input required value={user} onChange={(e) => setUser(e.target.value)} />
            </label>
            <label>
              Contraseña de aplicación
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="elite-button" disabled={busy}>
              {busy ? "Comprobando" : "Guardar y comprobar conexión"}
            </button>
          </form>
        )}
      </section>
      <section className="elite-card" style={{ marginTop: 24 }}>
        <h2>Productos enviados</h2>
        <table className="elite-products-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Estado</th>
              <th>Último envío</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.productos.map((product) => (
              <tr key={product.id}>
                <td>
                  <Link href={`/admin/productos/${product.id}`}>
                    {product.sku} {product.titulo}
                  </Link>
                </td>
                <td>
                  {product.wpSyncEstado}
                  {product.wpSyncError && <small>{product.wpSyncError}</small>}
                </td>
                <td>
                  {product.wpSyncFecha
                    ? new Date(product.wpSyncFecha).toLocaleString("es-BO")
                    : "—"}
                </td>
                <td>
                  <button
                    className="elite-button secondary"
                    disabled={busy || !data.configurado}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        const response = await fetch(`/api/productos/${product.id}/wordpress`, {
                          method: "POST",
                        });
                        const result = await response.json();
                        if (!response.ok)
                          throw new Error(result.error?.message || "No se pudo publicar");
                        await load();
                        setMessage("Producto sincronizado");
                      } catch (e) {
                        setMessage(e instanceof Error ? e.message : "Error de sincronización");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Actualizar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
