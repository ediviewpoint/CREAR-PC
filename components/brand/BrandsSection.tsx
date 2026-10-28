import { BrandLogo } from "./BrandLogo";
import { workedBrands } from "@/lib/brand-showcase";
import { Reveal } from "@/components/motion/Reveal";
export function BrandsSection() {
  return (
    <section className="worked-brands shell" id="marcas" aria-labelledby="brands-heading">
      <header className="worked-brands__heading">
        <div>
          <p className="eyebrow">ELITEPC / Nuestra selección</p>
          <h2 id="brands-heading">
            Marcas que conocemos.
            <br />
            <span>Equipos que encajan.</span>
          </h2>
        </div>
        <p>
          Trabajamos con estas marcas para armar y actualizar tu equipo. Consultá los modelos y su
          disponibilidad.
        </p>
      </header>
      <div className="worked-brands__grid">
        {workedBrands.map((brand, index) => (
          <Reveal key={brand.id} index={index} className="worked-brand">
            <div className="worked-brand__identity" data-brand={brand.id}>
              <BrandLogo
                logo={brand.logo}
                name={brand.name}
                width={180}
                height={70}
                className="worked-brand__logo"
                fallbackClassName="worked-brand__name"
              />
            </div>
            <div className="worked-brand__caption">
              <h3>{brand.name}</h3>
              <p>{brand.category}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="worked-brands__foot">
        <span className="mono">Procesadores / Placas / Memoria / Almacenamiento</span>
        <p>
          Las marcas pertenecen a sus respectivos titulares. Su presencia identifica productos que
          trabajamos; no implica una alianza o certificación oficial.
        </p>
      </div>
    </section>
  );
}
