import { isAdmin } from "@/lib/auth/admin";
import { csvTemplate } from "@/lib/admin/product-csv";
import { PRODUCT_CATEGORIES,type ProductCategory } from "@/lib/admin/component-fields";
export async function GET(request:Request) {
  if(!await isAdmin())return new Response("No autorizado",{status:401});
  const category=new URL(request.url).searchParams.get("category");
  if(!PRODUCT_CATEGORIES.some((item)=>item.key===category))return new Response("Categoría no válida",{status:400});
  return new Response(csvTemplate(category as ProductCategory),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="productos-${category}.csv"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
