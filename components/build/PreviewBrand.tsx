import Image from "next/image";
import { workedBrands } from "@/lib/brand-showcase";
import type { CatalogComponent } from "@/lib/catalog/types";
export function PreviewBrand({
  component,
  large = false,
}: {
  component: CatalogComponent;
  large?: boolean;
}) {
  const key = component.brand.toLowerCase().trim();
  const logo =
    key === "amd" && component.category === "cpu"
      ? workedBrands.find((b) => b.id === "amd-ryzen")
      : workedBrands.find((b) => b.name.toLowerCase() === key || b.id === key);
  return (
    <span className={"preview-brand" + (large ? " preview-brand--large" : "")} data-brand={key}>
      {logo?.logo ? (
        <Image src={logo.logo} width={132} height={42} alt={logo.name} />
      ) : (
        <span className="preview-brand__name">{component.brand}</span>
      )}
    </span>
  );
}
