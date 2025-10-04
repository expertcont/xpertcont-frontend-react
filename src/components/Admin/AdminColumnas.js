
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
      name: 'Ruc',
      selector: 'r_documento_id',
      width: '110px',
      sortable: true,
    },
    {//14
      name: 'Razon Social',
      selector: 'r_razon_social',
      sortable: true,
    },
    ///////////////cambio
  
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
  

  