import "../../app/styles/art-direction.css";

type ArtDirectionBoardProps = {
  theme?: "light" | "dark";
};

/** Static CDX-01 specimen. No catalog, prices or compatibility claims. */
export function ArtDirectionBoard({ theme }: ArtDirectionBoardProps) {
  return (
    <article className="art-board" data-theme={theme} lang="es-BO" aria-label="Dirección de arte de CREAR PC">
      <header className="art-board__header">
        <span className="art-board__wordmark">CREAR PC<span className="art-board__mark" aria-hidden="true"> /</span></span>
        <span className="art-board__caption">Santa Cruz · Bolivia</span>
      </header>

      <div className="art-board__intro">
        <div>
          <p className="art-board__caption">01 / Precisión en cada pieza</p>
          <h1>Potencia.<br /><span>Con criterio.</span></h1>
          <p className="art-board__lede">Una mesa de trabajo para armar tu próxima PC. Espacio para pensar. Detalles para decidir.</p>
          <a className="art-board__link" href="#art-materials">Explorar la dirección <span aria-hidden="true">↗</span></a>
        </div>
        <figure className="art-board__product">
          <svg viewBox="0 0 480 420" role="img" aria-label="Estudio técnico de un chasis abierto con placa, ventiladores y tarjeta gráfica, en azul marino sobre blanco" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
            <path d="m124 100 194-51 75 47v255l-194 49-75-47Z" />
            <path d="m124 100 75 48 194-52M199 148v252M318 49v255l75 47" />
            <path d="m139 125 47 30v216l-47-29Z" />
            <path d="m217 163 88-23v116l-88 23Z" />
            <path d="m235 177 49-13v46l-49 13ZM294 162v72M300 160v72" />
            <path d="m217 291 99-26 46 29-99 26Zm0 0v24l46 29 99-26v-24M263 320v24" />
            <path d="m217 345 70-18 48 30-70 18Z" />
            <ellipse cx="343" cy="155" rx="19" ry="29" />
            <ellipse cx="343" cy="226" rx="19" ry="29" />
            <ellipse cx="343" cy="155" rx="6" ry="9" />
            <ellipse cx="343" cy="226" rx="6" ry="9" />
            <path d="m327 139 32 32m-32-16 32 0m-16-27v54m-16 28 32 32m-32-16h32m-16-27v54" />
            <path d="m99 108-25 6v247l25-6M70 114h9m-9 247h9M212 408l166-42m-168 38 4 8m162-50 4 8" strokeDasharray="3 5" />
          </svg>
          <figcaption><span>Estudio de chasis / 001</span><span>Esquema conceptual</span></figcaption>
        </figure>
      </div>

      <section className="art-board__materials" id="art-materials" aria-label="Materiales del sistema visual">
        <div className="art-board__material">
          <p className="art-board__caption">02 / Color</p>
          <h2>Blanco. Marino. Nada sobra.</h2>
          <div className="art-board__swatches">
            <span className="art-board__swatch art-board__swatch--white">Blanco <code>#FFFFFF</code></span>
            <span className="art-board__swatch art-board__swatch--navy">Marino <code>#13284A</code></span>
            <span className="art-board__swatch art-board__swatch--deep">Profundo <code>#050F24</code></span>
          </div>
          <p>Superficies opacas. Bordes finos. La pieza tiene el protagonismo.</p>
        </div>
        <div className="art-board__material">
          <p className="art-board__caption">03 / Tipografía</p>
          <h2 className="art-board__type">Aa. 012</h2>
          <dl className="art-board__font-list">
            <div><dt>Display</dt><dd>Inter Tight / 600</dd></div>
            <div><dt>Interfaz</dt><dd>Inter / 400–600</dd></div>
            <div><dt>Ficha técnica</dt><dd className="art-board__mono">JetBrains Mono</dd></div>
          </dl>
        </div>
        <div className="art-board__material">
          <p className="art-board__caption">04 / Ritmo</p>
          <h2>Orden que se siente.</h2>
          <div className="art-board__ruler" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <p className="art-board__mono">8 px base / 12 columnas<br />24 px gutter / 1280 px máximo</p>
          <p>Encuadres amplios, datos alineados y movimiento breve.</p>
        </div>
      </section>

      <section className="art-board__specimen" aria-label="Muestras de interfaz">
        <div>
          <p className="art-board__caption">05 / Lenguaje de interfaz</p>
          <h2>Datos claros.<br />Decisiones propias.</h2>
          <p>Los estados se distinguen con símbolos y texto, dentro de la misma paleta.</p>
        </div>
        <div className="art-board__samples">
          <div className="art-board__pills"><span>ATX</span><span>DDR5</span><span>750 W</span></div>
          <ul className="art-board__statuses">
            <li><span aria-hidden="true">✓</span> Compatible</li>
            <li><span aria-hidden="true">!</span> Requiere revisión</li>
            <li><span aria-hidden="true">×</span> Incompatible</li>
          </ul>
          <label className="art-board__label">Nombre de tu build<input type="text" placeholder="Mi workstation" /></label>
          <div className="art-board__actions">
            <button className="art-board__button" type="button" disabled>Comenzar build</button>
            <button className="art-board__button art-board__button--ghost" type="button" disabled>Ya tengo componentes</button>
          </div>
          <p className="art-board__note">Muestra visual. El configurador se conectará en CDX-04.</p>
        </div>
      </section>
      <footer className="art-board__footer"><span>CREAR PC / Dirección de arte</span><span>CDX-01 · CDX-02</span></footer>
    </article>
  );
}