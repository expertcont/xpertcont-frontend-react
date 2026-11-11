import { useEffect, useMemo, useState } from "react";
import { Alert, Autocomplete, Box, Button, CircularProgress, Divider, MenuItem, TextField, Typography } from "@mui/material";
import { Plus, Search, Trash2 } from "lucide-react";
import palette from "../../../theme/palette";
import { apiGre, fechaGre, greComprobante, rutaGreComercial } from "./greConsulta";

const sectionSx = { border: `1px solid ${palette.borderSoft}`, borderRadius: 2, p: 2, display: "grid", gap: 1.5 };
const gridSx = { display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,minmax(0,1fr))" }, gap: 1.5 };
const inputSx = { "& .MuiInputBase-root": { color: palette.text, bgcolor: palette.surfaceAlt }, "& .MuiInputLabel-root": { color: palette.muted }, "& .MuiOutlinedInput-notchedOutline": { borderColor: palette.border }, "& .MuiInputBase-root.Mui-disabled, & .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: palette.muted } };
const emptyDoc = () => ({ origen_dato: "MANUAL", doc_cod: "01", prov_tipo_doc: "6", prov_doc: "", prov_razon_social: "", doc_serie: "", doc_numero: "", fecha_emision: "", moneda: "PEN", total: "" });
const emptyItem = () => ({ doc_item: 1, id_producto: "", descripcion: "", cantidad: "1", cont_und: "", peso: "", cod_proveedor: "" });
const initialForm = (detalle) => ({
  serie: detalle?.serie || "", fecha_traslado: detalle?.fecha_traslado || "", guia_motivo_id: detalle?.guia_motivo_id || "",
  partida_ubigeo: detalle?.partida_ubigeo || "", partida_direccion: detalle?.partida_direccion || "",
  llegada_ubigeo: detalle?.llegada_ubigeo || "", llegada_direccion: detalle?.llegada_direccion || "",
  transp_ruc: detalle?.transp_ruc || "", transp_razon_social: detalle?.transp_razon_social || "", transp_mtc: detalle?.transp_mtc || "",
  destinatario_tipo: detalle?.destinatario_tipo || "6", destinatario_ruc_dni: detalle?.destinatario_ruc_dni || "", destinatario_razon_social: detalle?.destinatario_razon_social || "", glosa: detalle?.glosa || "",
});

export default function AdminGreCompraEditor({ detalle, backHost, idAnfitrion, idInvitado, documentoId, periodo, onSaved, onCancel }) {
  const [form, setForm] = useState(() => initialForm(detalle));
  const [documentos, setDocumentos] = useState(() => (detalle?.documentos || []).map((d) => ({ ...d, guardado: true })));
  const [items, setItems] = useState(() => detalle?.items || []);
  const [catalogos, setCatalogos] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [buscar, setBuscar] = useState("");
  const [periodoSire, setPeriodoSire] = useState(periodo);
  const [resultados, setResultados] = useState([]);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    apiGre(backHost, [...rutaGreComercial(idAnfitrion,idInvitado,documentoId), "catalogos"], { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setCatalogos(data);
        setForm((prev) => ({ ...prev, serie: prev.serie || data.series?.[0]?.codigo || "", fecha_traslado: prev.fecha_traslado || data.fecha }));
      }).catch((err) => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [backHost,idAnfitrion,idInvitado,documentoId]);

  const pesoTotal = useMemo(() => items.reduce((sum,item) => sum + (Number(item.peso) || 0),0).toFixed(3), [items]);
  const update = (key,value) => setForm((prev) => ({...prev,[key]:value}));
  const input = (key,label,extra = {}) => <TextField key={key} label={label} value={form[key]} onChange={(e) => update(key,e.target.value)} size="small" fullWidth sx={inputSx} {...extra} />;
  const selectCatalog = (key,label,options) => <Autocomplete key={key} options={options || []} value={(options || []).find((o) => String(o.codigo) === String(form[key])) || null} onChange={(_,option) => update(key,option?.codigo || "")} getOptionLabel={(o) => `${o.codigo} · ${o.descripcion}`} isOptionEqualToValue={(a,b)=>a.codigo===b.codigo} renderInput={(p) => <TextField {...p} label={label} size="small" sx={inputSx} required />} />;
  const changeDoc = (index,key,value) => setDocumentos((prev) => prev.map((doc,i) => i===index ? {...doc,[key]:value} : doc));
  const changeItem = (index,patch) => setItems((prev) => prev.map((item,i) => i===index ? {...item,...patch} : item));

  const agregarFactura = (doc) => {
    if (documentos.some((d) => d.prov_doc===doc.prov_doc && d.doc_serie===doc.doc_serie && d.doc_numero===doc.doc_numero)) { setError("La factura ya está agregada."); return; }
    setDocumentos((prev) => [...prev,doc]);
    setError("");
  };
  const quitarFactura = (index) => {
    if (items.some((item) => Number(item.doc_item)===index+1)) { setError("Quita primero los ítems asociados a esa factura."); return; }
    setDocumentos((prev) => prev.filter((_,i)=>i!==index));
    setItems((prev) => prev.map((item)=>({...item,doc_item:Number(item.doc_item)>index+1 ? Number(item.doc_item)-1 : item.doc_item})));
  };
  const buscarFacturas = async () => {
    setBuscando(true); setError(""); setResultados([]); setBusquedaRealizada(false);
    try {
      const data = await apiGre(backHost,[...rutaGreComercial(idAnfitrion,idInvitado,documentoId),"compras"],{ query:{periodo:periodoSire,buscar} });
      setResultados(data); setBusquedaRealizada(true);
    } catch(err) { setError(err.message); }
    finally { setBuscando(false); }
  };
  const guardar = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const path = [...rutaGreComercial(idAnfitrion,idInvitado,documentoId),"guias", ...(detalle ? [detalle.periodo,detalle.cod,detalle.serie,detalle.numero] : [])];
      const payload = { ...form, documentos: documentos.map(({guardado,...d},i)=>({...d,doc_item:i+1})),
        items: items.map(({item,doc_item,id_producto,descripcion,cantidad,cont_und,peso,cod_proveedor})=>({item,doc_item,id_producto,descripcion,cantidad,cont_und,peso,cod_proveedor})),
        ...(detalle ? {version:detalle.version} : {}) };
      const data = await apiGre(backHost,path,{method:detalle ? "PUT" : "POST",body:payload});
      onSaved(data);
    } catch(err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return <Box component="form" onSubmit={guardar} sx={{display:"grid",gap:2}}>
    {error && <Alert severity="error">{error}</Alert>}
    {!catalogos && !error && <CircularProgress size={24} aria-label="Cargando catálogos" />}
    {catalogos?.aviso && <Alert severity="warning">{catalogos.aviso}</Alert>}
    {catalogos && !catalogos.compras_disponibles && <Alert severity="warning">Falta habilitar el esquema de compras en esta base de datos.</Alert>}
    <Box component="fieldset" disabled={saving} sx={{border:0,p:0,m:0,minWidth:0,display:"grid",gap:2}}>
      <Box sx={sectionSx}>
        <Typography sx={{fontWeight:800}}>Datos del traslado</Typography>
        <Typography sx={{fontSize:12,color:palette.muted}}>Emisión: {fechaGre(detalle?.fecha_emision || catalogos?.fecha)} · El número se asigna al guardar · Transporte público</Typography>
        <Box sx={gridSx}>
          {input("serie","Serie GRE",{select:true,required:true,disabled:Boolean(detalle),children:[...new Set([form.serie,...(catalogos?.series || []).map((s)=>s.codigo)].filter(Boolean))].map((serie)=><MenuItem key={serie} value={serie}>{serie}</MenuItem>)})}
          {input("fecha_traslado","Fecha de traslado",{type:"date",required:true,InputLabelProps:{shrink:true},inputProps:{min:detalle?.fecha_emision || catalogos?.fecha}})}
          {selectCatalog("guia_motivo_id","Motivo de traslado",catalogos?.motivos)}
        </Box>
        <Box sx={{...gridSx,gridTemplateColumns:{xs:"1fr",md:"1fr 2fr"}}}>
          {selectCatalog("partida_ubigeo","Ubigeo de partida",catalogos?.ubigeos)}{input("partida_direccion","Dirección de partida",{required:true})}
          {selectCatalog("llegada_ubigeo","Ubigeo de llegada",catalogos?.ubigeos)}{input("llegada_direccion","Dirección de llegada",{required:true})}
        </Box>
      </Box>
      <Box sx={sectionSx}>
        <Typography sx={{fontWeight:800}}>Transportista y destinatario</Typography>
        <Box sx={gridSx}>
          {input("transp_ruc","RUC del transportista",{required:true,inputProps:{maxLength:11}})}
          {input("transp_razon_social","Razón social del transportista",{required:true})}{input("transp_mtc","Registro MTC")}
          {input("destinatario_tipo","Tipo de documento",{select:true,children:[<MenuItem key="6" value="6">RUC</MenuItem>,<MenuItem key="1" value="1">DNI</MenuItem>]})}
          {input("destinatario_ruc_dni","Documento del destinatario",{required:true})}{input("destinatario_razon_social","Nombre del destinatario",{required:true})}
        </Box>
      </Box>
      <Box sx={sectionSx}>
        <Typography sx={{fontWeight:800}}>Facturas de proveedores</Typography>
        <Box sx={gridSx}>
          <TextField type="month" label="Período SIRE" value={periodoSire} onChange={(e)=>setPeriodoSire(e.target.value)} size="small" InputLabelProps={{shrink:true}} sx={inputSx} />
          <TextField label="Proveedor, RUC, serie o número" value={buscar} onChange={(e)=>setBuscar(e.target.value)} size="small" sx={inputSx} />
          <Button type="button" onClick={buscarFacturas} disabled={buscando} startIcon={<Search size={16} />} sx={{color:palette.accent}}>{buscando ? "Buscando..." : "Buscar en SIRE"}</Button>
        </Box>
        {busquedaRealizada && !resultados.length && <Typography sx={{fontSize:13,color:palette.muted}}>No se encontraron facturas disponibles.</Typography>}
        {resultados.length>0 && <Box sx={{maxHeight:230,overflowY:"auto",display:"grid",gap:1}}>{resultados.map((doc)=><Box key={`${doc.prov_doc}-${doc.doc_serie}-${doc.doc_numero}`} sx={{p:1,bgcolor:palette.surfaceAlt,borderRadius:1,display:"flex",gap:1,alignItems:"center"}}>
          <Box sx={{flex:1}}><Typography sx={{fontSize:13}}>{doc.prov_razon_social} · {doc.doc_serie}-{doc.doc_numero}</Typography><Typography sx={{fontSize:12,color:palette.muted}}>{doc.prov_doc} · {fechaGre(doc.fecha_emision)} · {doc.moneda} {doc.total}</Typography>{doc.otras_guias && <Typography sx={{fontSize:12,color:palette.warning}}>Ya incluida en: {doc.otras_guias}</Typography>}</Box>
          <Button onClick={()=>agregarFactura(doc)} disabled={documentos.some((d)=>d.prov_doc===doc.prov_doc && d.doc_serie===doc.doc_serie && d.doc_numero===doc.doc_numero)} sx={{color:palette.accent}}>Agregar</Button>
        </Box>)}</Box>}
        <Divider sx={{borderColor:palette.borderSoft}} />
        {documentos.map((doc,index)=><Box key={index} sx={{...sectionSx,bgcolor:palette.surfaceAlt}}>
          <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><Typography sx={{fontSize:13,fontWeight:700}}>Factura {index+1} · {doc.origen_dato}</Typography><Button aria-label={`Quitar factura ${index+1}`} onClick={()=>quitarFactura(index)} sx={{minWidth:32,color:palette.muted}}><Trash2 size={16} /></Button></Box>
          {doc.origen_dato==="SIRE" ? <Typography sx={{fontSize:13}}>{doc.prov_doc} · {doc.prov_razon_social} · {doc.doc_serie}-{doc.doc_numero} · {fechaGre(doc.fecha_emision)} · {doc.moneda} {doc.total}</Typography>
            : <Box sx={gridSx}>{[["prov_doc","RUC proveedor"],["prov_razon_social","Razón social"],["doc_serie","Serie factura"],["doc_numero","Número factura"],["fecha_emision","Emisión factura"],["moneda","Moneda"],["total","Total factura"]].map(([key,label])=><TextField key={key} label={label} value={doc[key]} onChange={(e)=>changeDoc(index,key,e.target.value)} type={key==="fecha_emision" ? "date" : "text"} InputLabelProps={key==="fecha_emision" ? {shrink:true} : undefined} required size="small" sx={inputSx} />)}</Box>}
        </Box>)}
        <Button onClick={()=>setDocumentos((prev)=>[...prev,emptyDoc()])} startIcon={<Plus size={16} />} sx={{justifySelf:"start",color:palette.accent}}>Agregar factura manual</Button>
      </Box>
      <Box sx={sectionSx}>
        <Box sx={{display:"flex",justifyContent:"space-between",gap:1}}><Typography sx={{fontWeight:800}}>Ítems de la guía</Typography><Typography sx={{fontSize:13}}>Peso total: {pesoTotal} kg</Typography></Box>
        {items.map((item,index)=><Box key={index} sx={{...sectionSx,bgcolor:palette.surfaceAlt}}>
          <Box sx={gridSx}>
            <TextField label="Factura" select value={item.doc_item} onChange={(e)=>changeItem(index,{doc_item:Number(e.target.value)})} required size="small" sx={inputSx}>{documentos.map((doc,i)=><MenuItem key={i} value={i+1}>{i+1} · {doc.doc_serie}-{doc.doc_numero}</MenuItem>)}</TextField>
            <Autocomplete options={catalogos?.productos || []} value={(catalogos?.productos || []).find((p)=>p.id_producto===item.id_producto) || null} onChange={(_,p)=>changeItem(index,{id_producto:p?.id_producto || "",...(p ? {descripcion:p.descripcion || p.nombre,cont_und:p.cont_und || ""} : {})})} getOptionLabel={(p)=>`${p.id_producto} · ${p.nombre}`} isOptionEqualToValue={(a,b)=>a.id_producto===b.id_producto} renderInput={(p)=><TextField {...p} label="Producto del catálogo (opcional)" size="small" sx={inputSx} />} />
            <TextField label="Código del proveedor (opcional)" value={item.cod_proveedor || ""} onChange={(e)=>changeItem(index,{cod_proveedor:e.target.value})} size="small" sx={inputSx} />
            <TextField label="Descripción" value={item.descripcion} onChange={(e)=>changeItem(index,{descripcion:e.target.value})} required size="small" sx={inputSx} />
            <TextField label="Cantidad" type="number" inputProps={{min:0.01,step:0.01}} value={item.cantidad} onChange={(e)=>changeItem(index,{cantidad:e.target.value})} required size="small" sx={inputSx} />
            <Autocomplete options={catalogos?.unidades || []} value={(catalogos?.unidades || []).find((u)=>u.codigo===item.cont_und) || null} onChange={(_,u)=>changeItem(index,{cont_und:u?.codigo || ""})} getOptionLabel={(u)=>`${u.codigo} · ${u.descripcion}`} isOptionEqualToValue={(a,b)=>a.codigo===b.codigo} renderInput={(p)=><TextField {...p} label="Unidad" required size="small" sx={inputSx} />} />
            <TextField label="Peso del ítem (kg)" type="number" inputProps={{min:0.001,step:0.001}} value={item.peso ?? ""} onChange={(e)=>changeItem(index,{peso:e.target.value})} required size="small" sx={inputSx} />
            <Button onClick={()=>setItems((prev)=>prev.filter((_,i)=>i!==index))} startIcon={<Trash2 size={16} />} sx={{color:palette.muted}}>Quitar ítem</Button>
          </Box>
        </Box>)}
        <Button onClick={()=>setItems((prev)=>[...prev,emptyItem()])} disabled={!documentos.length} startIcon={<Plus size={16} />} sx={{justifySelf:"start",color:palette.accent}}>Agregar ítem</Button>
      </Box>
      {input("glosa","Observaciones",{multiline:true,minRows:2})}
    </Box>
    <Box sx={{display:"flex",justifyContent:"flex-end",gap:1}}>
      <Button onClick={onCancel} disabled={saving} sx={{color:palette.muted}}>Cancelar</Button>
      <Button type="submit" disabled={saving || !catalogos?.compras_disponibles || !catalogos?.motivos?.length || !documentos.length || !items.length} sx={{bgcolor:palette.accent,color:palette.onAccent,"&:hover":{bgcolor:palette.accent}}}>{saving ? "Guardando..." : detalle ? `Guardar ${greComprobante(detalle)}` : "Guardar guía por compras"}</Button>
    </Box>
  </Box>;
}
