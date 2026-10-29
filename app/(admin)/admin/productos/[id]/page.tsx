import {requireSession} from "@/lib/auth";
import {productFormData} from "@/lib/productos/form-data";
import {getProduct} from "@/lib/productos/guardar";
import {FormProducto} from "@/components/productos/FormProducto";
export default async function EditProduct({params}:{params:Promise<{id:string}>}){const session=await requireSession();const {id}=await params;const [data,product]=await Promise.all([productFormData(),getProduct(id,session.user.rol)]);return <FormProducto data={data} role={session.user.rol} id={id} initial={JSON.parse(JSON.stringify(product))}/>;}
