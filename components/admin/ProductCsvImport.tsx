"use client";
import { useRef,useState,useTransition } from "react";
import { productCsvAction,type CsvActionState } from "@/app/_actions/import-products";
import Link from "next/link";
export function ProductCsvImport({categories}:{categories:{key:string;label:string}[]}) {
  const [category,setCategory]=useState("ram"),[state,setState]=useState<CsvActionState>({ok:false,message:""});
  const [pending,start]=useTransition();const form=useRef<HTMLFormElement>(null),running=useRef(false);
  function run(confirm:boolean){if(!form.current||running.current)return;running.current=true;const data=new FormData(form.current);start(async()=>{try{setState(await productCsvAction(data,confirm));}catch{setState({ok:false,message:"No se pudo conectar. Volvé a intentar con el mismo archivo."});}finally{running.current=false;}});}
  return <div className="product-editor"><section className="product-editor__section">
    <h2>1. Prepará el archivo</h2><p>Descargá la plantilla de una categoría y abrila en Excel o LibreOffice. Conservá los encabezados y guardá como CSV UTF-8. Hasta 100 productos y 1 MB por archivo.</p>
    <label>Categoría de la plantilla<select value={category} onChange={(event)=>setCategory(event.target.value)}>{categories.map((item)=><option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
    <a className="button button--ghost" href={`/api/admin/product-template?category=${category}`}>Descargar plantilla CSV</a>
    <p className="small muted">Categoría: usá la clave seleccionada ({category}). Las columnas spec son opcionales para borradores. Números con punto decimal; listas separadas por comas; valores booleanos true o false. No agregues datos de clientes.</p>
  </section><form ref={form} onSubmit={(event)=>{event.preventDefault();run(false);}}><fieldset disabled={pending}><section className="product-editor__section">
    <h2>2. Revisá antes de importar</h2><label>Archivo CSV<input required name="csv" type="file" accept=".csv,text/csv" onChange={()=>setState({ok:false,message:""})}/></label>
    <button className="button" type="submit">{pending?"Procesando…":"Validar y previsualizar"}</button>
    {state.preview&&<><div className="admin-table-wrap"><table><thead><tr><th>Producto</th><th>Identificador</th><th>Categoría</th></tr></thead><tbody>{state.preview.map((row)=><tr key={row.slug}><td>{row.name}</td><td>{row.slug}</td><td>{row.category}</td></tr>)}</tbody></table></div><button className="button" type="button" onClick={()=>run(true)}>Confirmar importación como borradores</button></>}
    {!!state.imported&&<Link className="button" href="/admin/componentes">Revisar productos importados</Link>}
  </section></fieldset></form>{state.message&&<p className="product-editor__message" style={{whiteSpace:"pre-line"}} role={state.ok?"status":"alert"}>{state.message}</p>}</div>;
}
