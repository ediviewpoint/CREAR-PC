import {requireSession} from "@/lib/auth";
import {productHistory} from "@/lib/productos/historial";
import {HistorialProducto} from "@/components/productos/HistorialProducto";
export default async function History(){const session=await requireSession();return <><div className="elite-page-header"><h1>Historial</h1></div><HistorialProducto admin={session.user.rol==="ADMIN"} items={JSON.parse(JSON.stringify(await productHistory(session.user.rol)))}/></>;}
