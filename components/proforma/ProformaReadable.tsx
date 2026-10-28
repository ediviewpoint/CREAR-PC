import { Brand } from "@/components/brand/Brand";
import type { ProformaData } from "@/lib/proforma/types";
import { proformaTotals, formatDate } from "@/lib/proforma/types";
import { formatBob } from "@/lib/utils/format";
export function ProformaReadable({
  data,
  qrDataUrl,
  url,
}: {
  data: ProformaData;
  qrDataUrl?: string;
  url: string;
}) {
  const pending = data.items.some((i) => i.pricePending);
  const t = proformaTotals(data);
  return (
    <article className="proforma-paper" aria-label="Contenido accesible de la proforma">
      <header>
        <Brand />
        <div>
          <p className="mono">{data.code}</p>
          <p>Emitida: {formatDate(data.issuedAt)}</p>
          <p>Válida hasta: {formatDate(data.validUntil)}</p>
        </div>
      </header>
      {data.example && (
        <p>EJEMPLO VISUAL · Importes ficticios. No constituye una cotización emitida.</p>
      )}
      {data.draft && (
        <p>BORRADOR · Sin numeración oficial. Pendiente de emisión por el vendedor.</p>
      )}
      <div className="proforma-parties">
        <div>
          <h3>Cliente</h3>
          <p>{data.client.name}</p>
          <p>CI/NIT: {data.client.ciNit ?? "No informado"}</p>
          <p>Teléfono: {data.client.phone ?? "No informado"}</p>
        </div>
        <div>
          <h3>Emisor</h3>
          <p>{data.issuer.name}</p>
          {data.issuer.nit && <p>NIT: {data.issuer.nit}</p>}
          <p>{data.issuer.city}</p>
          {data.issuer.phone && <p>{data.issuer.phone}</p>}
        </div>
      </div>
      <div
        className="proforma-table-wrap"
        tabIndex={0}
        role="region"
        aria-label="Detalle de componentes, desplazable"
      >
        <table>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Categoría</th>
              <th scope="col">Marca / modelo</th>
              <th scope="col">Cant.</th>
              <th scope="col" className="money">
                P. unitario Bs.
              </th>
              <th scope="col" className="money">
                Importe Bs.
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{item.category}</td>
                <td>
                  {item.name}
                  {item.warranty&&<p className="small">Garantía comercial: {item.warranty}</p>}
                  {item.sourceUrl && (
                    <p className="small">
                      <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                        {item.storeName ?? "Fuente"} ↗
                      </a>
                      {item.observedAt ? " · " + item.observedAt.slice(0, 10) : ""}
                    </p>
                  )}
                </td>
                <td>{item.quantity}</td>
                <td className="money">
                  {item.pricePending ? "Por cotizar" : formatBob(item.unitPriceBob)}
                </td>
                <td className="money">
                  {item.pricePending ? "Por cotizar" : formatBob(item.quantity * item.unitPriceBob)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="proforma-totals">
        <div>
          <span>Subtotal</span>
          <span>{pending ? "Por cotizar" : formatBob(t.subtotal)}</span>
        </div>
        <div>
          <span>Descuento</span>
          <span>{formatBob(t.discount)}</span>
        </div>
        <div>
          <strong>TOTAL</strong>
          <strong>{pending ? "Por cotizar" : formatBob(t.total)}</strong>
        </div>
      </div>
      <h3>Condiciones</h3>
      <ul>
        {data.terms.map((term) => (
          <li key={term}>{term}</li>
        ))}
      </ul>
      <footer>
        {qrDataUrl && !data.draft && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt="Código QR para consultar la versión web de esta proforma"
            width="96"
            height="96"
          />
        )}
        {data.draft ? (
          <span>Borrador local · sin enlace público</span>
        ) : (
          <a href={url}>Consultá la versión web</a>
        )}
        <span>Cotización no fiscal</span>
      </footer>
    </article>
  );
}
