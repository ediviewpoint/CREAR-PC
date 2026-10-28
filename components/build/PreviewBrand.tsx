import { BrandLogo } from "@/components/brand/BrandLogo";
import { findWorkedBrand } from "@/lib/brand-showcase";
import type { CatalogComponent } from "@/lib/catalog/types";
export function PreviewBrand({
  component,
  large = false,
}: {
  component: CatalogComponent;
  large?: boolean;
}) {
  const key = component.brand.toLowerCase().trim();
  const logo = findWorkedBrand(component.brand, component.category);
  return (
    <span className={"preview-brand" + (large ? " preview-brand--large" : "")} data-brand={key}>
      <BrandLogo logo={logo?.logo} name={logo?.name ?? component.brand} />
    </span>
  );
}
