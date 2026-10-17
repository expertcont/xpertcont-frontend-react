import React from 'react';
import '@testing-library/jest-dom';
import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import axios from 'axios';
import Personalizada from '../components/SireComprasPersonalizada';
const mockExportar=jest.fn();
jest.mock('../services/exportarCompras',()=>({exportarCompras:(...args)=>mockExportar(...args)}));
jest.mock('axios',()=>({__esModule:true,default:{get:jest.fn(),post:jest.fn(),put:jest.fn(),delete:jest.fn()}}));
jest.mock('react-data-table-component',()=>({__esModule:true,default:({data,columns})=><div>{data.map(r=><div key={r.id_compra} data-testid={'compra-'+r.id_compra}>{r.comprobante.proveedor}{columns.filter(c=>c.cell && (c.name==='Acciones' || c.name==='Estado')).map(c=><div key={c.name}>{c.cell(r)}</div>)}</div>)}</div>}));
const comprobante={fecha_emision:'2026-09-15',tipo_comprobante:'01',serie:'F001',numero:'123',tipo_doc_proveedor:'6',documento_proveedor:'20999999999',proveedor:'PROVEEDOR',moneda:'PEN',base001:100,igv001:18,total:118};
const fila=(id,estado='DECLARAR')=>({id_compra:String(id),version:1,estado,motivo:estado==='PENDIENTE'?'Falta constancia':'',origen:'SUNAT',periodo_origen:'2026-09',periodo_destino:estado==='PENDIENTE'?'2026-10':'2026-09',comprobante:{...comprobante,proveedor:'PROVEEDOR '+id}});
const props={idAnfitrion:'host@example.com',documentoId:'20123456789',periodo:'2026-09',valido:true,filtros:{dia:'*',busqueda:''}};
beforeEach(()=>{
 jest.clearAllMocks();
 axios.get.mockResolvedValue({data:{registros:[fila(1),fila(2,'PENDIENTE'),fila(3,'EXCLUIDO')]}});
 axios.post.mockResolvedValue({data:{message:'Cargado'}});axios.put.mockResolvedValue({data:{message:'Guardado'}});axios.delete.mockResolvedValue({data:{message:'Excluido correctamente'}});
});
test('visualiza todos, filtra estados y exporta solo por declarar del periodo',async()=>{
 render(<Personalizada {...props}/>);
 await screen.findByText('PROVEEDOR 1');expect(screen.getByText('PROVEEDOR 2')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Exportar por declarar'}));
 expect(mockExportar).toHaveBeenCalledWith([expect.objectContaining({id_compra:'1'})],5,props.documentoId,props.periodo);
 fireEvent.click(screen.getByRole('button',{name:/Pendiente de documentación \(1\)/}));
 expect(screen.queryByText('PROVEEDOR 1')).not.toBeInTheDocument();expect(screen.getByText('PROVEEDOR 2')).toBeInTheDocument();
});
test('al abrir sincroniza datos ya guardados sin un boton de carga separado',async()=>{
 render(<Personalizada {...props}/>);await screen.findByText('PROVEEDOR 1');
 expect(screen.queryByRole('button',{name:'Cargar propuesta SUNAT'})).not.toBeInTheDocument();
 expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/personalizada/importar'),expect.objectContaining({id_anfitrion:props.idAnfitrion,documento_id:props.documentoId,periodo:props.periodo,solo_guardada:true}));
});
test('editar comprobante conserva identidad de la fila y version',async()=>{
 render(<Personalizada {...props}/>);await screen.findByText('PROVEEDOR 1');
 fireEvent.click(within(screen.getByTestId('compra-1')).getByRole('button',{name:'Editar'}));
 const dialog=within(await screen.findByRole('dialog'));
 fireEvent.change(dialog.getByLabelText('Proveedor'),{target:{value:'PROVEEDOR EDITADO'}});
 fireEvent.click(dialog.getByRole('button',{name:'Guardar'}));
 await waitFor(()=>expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/personalizada/1'),expect.objectContaining({version:1,comprobante:expect.objectContaining({proveedor:'PROVEEDOR EDITADO'})})));
});
test('excluir exige motivo y usa eliminacion reversible',async()=>{
 render(<Personalizada {...props}/>);await screen.findByText('PROVEEDOR 1');
 fireEvent.click(within(screen.getByTestId('compra-1')).getByRole('button',{name:'Excluir'}));
 const dialog=within(await screen.findByRole('dialog'));
 fireEvent.click(dialog.getByRole('button',{name:'Excluir'}));expect(axios.delete).not.toHaveBeenCalled();
 fireEvent.change(dialog.getByLabelText(/Motivo \/ observación/),{target:{value:'Compra personal'}});
 fireEvent.click(dialog.getByRole('button',{name:'Excluir'}));
 await waitFor(()=>expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/personalizada/1'),{data:expect.objectContaining({version:1,motivo:'Compra personal'})}));
});
test('pendientes del periodo anterior se incluyen solo al pulsar incluir',async()=>{
 const pendiente={...fila(2,'PENDIENTE'),periodo_destino:'2026-10'};
 axios.get.mockResolvedValue({data:{registros:[pendiente]}});
 render(<Personalizada {...props} periodo="2026-10"/>);await screen.findByText('PROVEEDOR 2');
 expect(axios.put).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Exportar por declarar'})).toBeDisabled();
 fireEvent.click(screen.getByRole('button',{name:'Incluir en 2026-10'}));
 await waitFor(()=>expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/personalizada/2'),expect.objectContaining({estado:'DECLARAR',periodo:'2026-10',version:1})));
});
test('error de version mantiene el editor y muestra el mensaje del backend',async()=>{
 axios.put.mockRejectedValue({response:{data:{message:'El comprobante fue modificado por otra sesion.'}}});
 render(<Personalizada {...props}/>);await screen.findByText('PROVEEDOR 1');
 fireEvent.click(within(screen.getByTestId('compra-1')).getByRole('button',{name:'Editar'}));
 fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button',{name:'Guardar'}));
 await waitFor(()=>expect(within(screen.getByRole('dialog')).getByText('El comprobante fue modificado por otra sesion.')).toBeInTheDocument());
});

test('agregar compra manual envia datos al CRUD de la empresa',async()=>{
 render(<Personalizada {...props}/>);await screen.findByText('PROVEEDOR 1');
 fireEvent.click(screen.getByRole('button',{name:'Agregar comprobante'}));
 const dialog=within(await screen.findByRole('dialog'));
 for(const [label,value] of [['Serie','F002'],['Número','99'],['Documento proveedor','20888888888'],['Proveedor','NUEVO PROVEEDOR'],['Total','50']])fireEvent.change(dialog.getByLabelText(label),{target:{value}});
 fireEvent.click(dialog.getByRole('button',{name:'Guardar'}));
 await waitFor(()=>expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/personalizada$/),expect.objectContaining({estado:'DECLARAR',comprobante:expect.objectContaining({proveedor:'NUEVO PROVEEDOR',numero:'99',total:'50'})})));
});
test('guardar pendiente solicita motivo y envia periodo futuro',async()=>{
 render(<Personalizada {...props}/>);await screen.findByText('PROVEEDOR 1');
 fireEvent.click(within(screen.getByTestId('compra-2')).getByRole('button',{name:'Editar'}));
 const dialog=within(await screen.findByRole('dialog'));
 expect(dialog.getByLabelText('Período para revisar documentación')).toHaveValue('2026-10');
 fireEvent.change(dialog.getByLabelText('Período para revisar documentación'),{target:{value:'2026-11'}});
 fireEvent.click(dialog.getByRole('button',{name:'Guardar'}));
 await waitFor(()=>expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/personalizada/2'),expect.objectContaining({estado:'PENDIENTE',motivo:'Falta constancia',periodo_destino:'2026-11'})));
});
test('compra asignada a otro periodo no cuenta ni se exporta como por declarar',async()=>{
 axios.get.mockResolvedValue({data:{registros:[{...fila(1),periodo_destino:'2026-10'}]}});
 render(<Personalizada {...props}/>);await screen.findByText('PROVEEDOR 1');
 expect(screen.getByRole('button',{name:'Exportar por declarar'})).toBeDisabled();
 expect(screen.getByRole('button',{name:'Por declarar (0)'})).toBeInTheDocument();
 expect(within(screen.getByTestId('compra-1')).getByRole('button',{name:'Editar'})).toBeDisabled();
});

test('sin propuesta descargada muestra compras existentes sin generar ni consultar tickets',async()=>{
 axios.post.mockResolvedValue({data:{cantidad:0,sin_propuesta:true}});
 render(<Personalizada {...props}/>);await screen.findByText('PROVEEDOR 1');
 expect(axios.post).toHaveBeenCalledTimes(1);
 expect(axios.post.mock.calls[0][1].solo_guardada).toBe(true);
});