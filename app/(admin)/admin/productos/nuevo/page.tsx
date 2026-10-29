import {requireSession} from "@/lib/auth";
import {productFormData} from "@/lib/productos/form-data";
import {FormProducto} from "@/components/productos/FormProducto";
export default async function NewProduct({searchParams}:{searchParams:Promise<{categoria?:string;nuevo?:string}>}){const session=await requireSession("EDITOR");const query=await searchParams;return <FormProducto key={query.nuevo||"inicial"} initial={query.categoria?{categoriaId:query.categoria}:undefined} data={await productFormData()} role={session.user.rol}/>;}
