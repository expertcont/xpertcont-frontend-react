
export const AdminVentasColumnas = [
    {//05
      name: 'Emision',
      selector: 'r_fecemi',
      width: '100px',
      sortable: true,
    },
    {//07-08-10
      name: 'Comprobante',
      selector: 'comprobante', //campo unido
      width: '150px',
      sortable: true,
    },
    {//11
      name: 'Tp',
      selector: 'r_id_doc',
      width: '0px',
      sortable: true,
    },
    {//12
      name: 'Ruc/Dni',
      selector: 'r_documento_id',
      width: '100px',
      sortable: true,
    },
    {//13
      name: 'Razon Social',
      selector: 'r_razon_social',
      sortable: true,
    },
    {//26
      name: 'TOTAL',
      selector: 'r_monto_total',
      sortable: true,
    },
    {//27 PEN o USD
      name: 'MONEDA',
      selector: 'r_moneda',
      sortable: true,
      width: '90px',
    },
    {//nuevo
      name: 'EFECTIVO',
      selector: 'efectivo',
      sortable: true,
    },
    {//nuevo
      name: 'OTROS',
      selector: 'efectivo2',
      sortable: true,
    },
    {//nuevo
      name: 'PAGO',
      selector: 'forma_pago2',
      sortable: true,
    },

    {//28
      name: 'TC',
      selector: 'r_tc',
      sortable: true,
    },
    {//29
      name: 'REF.Emision',
      selector: 'r_fecemi_ref',
      sortable: true,
    },
    {//30
      name: 'REF.TP',
      selector: 'r_cod_ref',
      sortable: true,
    },
    {//31
      name: 'REF.SERIE',
      selector: 'r_serie_ref',
      sortable: true,
    },
    {//32
      name: 'REF.NUM',
      selector: 'r_numero_ref',
      sortable: true,
    },

    {//33
      name: 'GRE FIRMA',
      selector: 'gre_vfirmado',
      sortable: true,
    },
    {//34
      name: 'GRE',
      selector: 'gre_ref',
      sortable: true,
      width: '150px',
    },
    
    // Otras columnas específicas para la vista de Ventas
  ];

  /*export const AdminVentasDetColumnas = [
    {//05
      name: 'Emision',
      selector: 'emision',
      width: '100px',
      sortable: true,
    },
    {//13
      name: 'Egreso',
      selector: 'egreso',
      width: '100px',
      sortable: true,
    },
    {//13
      name: 'UN',
      selector: 'cont_und',
      width: '70px',
      sortable: true,
    },
    {//13
      name: 'Descripcion',
      selector: 'descripcion',
      width: '400px',
      sortable: true,
    },
    {//13
      name: 'Ingreso',
      selector: 'ingreso',
      width: '100px',
      sortable: true,
    },
    {//26
      name: 'IMPORTE',
      selector: 'precio_neto',
      sortable: true,
    },
    {//27 PEN o USD
      name: 'MONEDA',
      selector: 'r_moneda',
      sortable: true,
      width: '90px',
    },
    {//07-08-10
      name: 'Comprobante',
      selector: 'comprobante', //campo unido
      width: '150px',
      sortable: true,
    },
    {//13
      name: 'Id Producto',
      selector: 'id_producto',
      width: '120px',
      sortable: true,
    },    
    {//12
      name: 'Ruc',
      selector: 'r_documento_id',
      width: '100px',
      sortable: true,
    },
    {//13
      name: 'Razon Social',
      selector: 'r_razon_social',
      sortable: true,
    },
    {//13
      name: 'Id Almacen',
      selector: 'id_almacen',
      sortable: true,
    },    
    {//13
      name: 'Motivo',
      selector: 'nombre',
      sortable: true,
    },

    {//28
      name: 'TC',
      selector: 'r_tc',
      sortable: true,
    },
    
    // Otras columnas específicas para la vista de Ventas
  ];*/
// 📁 columnas.js

export const getColumnasDet = (tipo = 'ventas') => {
  const columnasBase0 = [
    { name: 'Emision', selector: 'emision', width: '100px', sortable: true },
  ];

  const columnasBase1 = [
    { name: 'UN', selector: 'cont_und', width: '40px', compact: true, sortable: true },
    { name: 'Descripcion', selector: 'descripcion', width: '400px', compact: true, sortable: true },
    { name: 'IMPORTE', selector: 'precio_neto', width: '100px', compact: true,sortable: true },
    { name: 'MONEDA', selector: 'r_moneda', width: '70px', compact: true,sortable: true },
    { name: 'Comprobante', selector: 'comprobante', width: '120px', compact: true,sortable: true },
    { name: 'Id Producto', selector: 'id_producto', width: '100px',compact: true, sortable: true },
    { name: 'Ruc', selector: 'r_documento_id', width: '100px', compact: true,sortable: true },
    { name: 'Razon Social', selector: 'r_razon_social', compact: true,sortable: true },
    { name: 'Id Almacen', selector: 'id_almacen', width: '80px', compact: true,sortable: true },
    { name: 'Motivo', selector: 'nombre', width: '80px', compact: true,sortable: true },
    { name: 'TC', selector: 'r_tc', compact: true,sortable: true },
  ];

  const columnaIngreso = { name: 'Ingreso', selector: 'ingreso', width: '80px', compact: true, sortable: true };
  const columnaEgreso = { name: 'Egreso', selector: 'egreso', width: '80px', compact: true, sortable: true };

  if (tipo === 'ventas') {
    // Solo agregamos la columna Egreso
    return [...columnasBase0, columnaEgreso, ...columnasBase1];
  }

  if (tipo === 'stocks') {
    // Mostramos ambas columnas (Ingreso y Egreso)
    return [...columnasBase0, columnaIngreso, columnaEgreso, ...columnasBase1];
  }

  // Tipo por defecto, todo
  return [...columnasBase0, columnaIngreso, columnaEgreso, ...columnasBase1];
};

  export const AdminInventarioColumnas = [
    {//01
      name: 'Id Producto',
      selector: 'id_producto',
      width: '0px',
      sortable: true,
    },    
    {//02
      name: 'Descripcion',
      selector: 'nombre_producto',
      width: '400px',
      sortable: true,
    },
    {//03
      name: 'Inicial',
      selector: 'saldo_inicial',
      width: '100px',
      sortable: true,
    },
    {//04
      name: 'Ingreso',
      selector: 'ingresos',
      width: '100px',
      sortable: true,
    },
    {//05
      name: 'Egreso',
      selector: 'egresos',
      width: '100px',
      sortable: true,
    },
    {//06
      name: 'Saldo',
      selector: 'saldo',
      width: '100px',
      sortable: true,
    },
    {//07
      name: 'Und',
      selector: 'cont_und',
      width: '80px',
      sortable: true,
    },
    {//08
      name: 'Almacen',
      selector: 'id_almacen',
      width: '80px',
      sortable: true,
    },

  ];

  export const AdminStocksColumnas = [
    {//05
      name: 'Emision',
      selector: 'fecha_emision',
      width: '100px',
      sortable: true,
    },
    {//07-08-10
      name: 'Comprobante',
      selector: 'comprobante', //campo unido
      width: '150px',
      sortable: true,
    },
    {//12
      name: 'D',
      selector: 'r_id_doc',
      width: '40px',
      sortable: true,
    },
    {//13
      name: 'Identidad',
      selector: 'r_documento_id',
      width: '110px',
      sortable: true,
    },
    {//14
      name: 'Razon Social',
      selector: 'r_razon_social',
      width: '200px',
      sortable: true,
    },
    ///////////////cambio
    {//07-08-10
      name: 'Motivo',
      selector: 'nombre', //campo unido
      width: '200px',
      sortable: true,
    },
 
    {//27
      name: 'TC',
      selector: 'r_tc',
      sortable: true,
    },
  
    // Otras columnas específicas para la vista de Compras
    //Ya no se usa datos detraccion, pero se podria manejar en campos auxiliar no obligatorios
    //numero_constancia
    //fecha_constancia
    //como en algun tutorial lo sugieren
  ];
  
  export const AdminCajaColumnas = [
    //por diseñar ;)
    {//06
      name: 'Glosa',
      selector: 'glosa',
      sortable: true,
    },
    {//28
      name: 'TC',
      selector: 'r_tc',
      sortable: true,
    },
  ];
  

  