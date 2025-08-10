
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
      width: '40px',
      sortable: true,
    },
    {//12
      name: 'Ruc',
      selector: 'r_documento_id',
      width: '110px',
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
  
    // Otras columnas específicas para la vista de Ventas
  ];
  
  export const AdminComprasColumnas = [
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
    {//15
      name: 'B-GRAV',
      selector: 'r_base001',
      sortable: true,
    },
    {//16
      name: 'IGV (A)',
      selector: 'r_igv001',
      sortable: true,
    },
  
    {//17
      name: 'B-DGNG',
      selector: 'r_base002',
      sortable: true,
    },
    {//18
      name: 'IGV (B)',
      selector: 'r_igv002',
      sortable: true,
    },
  
    {//19
      name: 'B-DNG',
      selector: 'r_base003',
      sortable: true,
    },
    {//20
      name: 'IGV (C)',
      selector: 'r_igv003',
      sortable: true,
    },
  
    {//21
      name: 'NoGRAV',
      selector: 'r_base004',
      sortable: true,
    },
    {//22
      name: 'ISC',
      selector: 'r_monto_isc',
      sortable: true,
    },
    {//23
      name: 'ICBP',
      selector: 'r_monto_icbp',
      sortable: true,
    },
    {//24
      name: 'OTROS',
      selector: 'r_monto_otros',
      sortable: true,
    },
    {//25
      name: 'TOTAL',
      selector: 'r_monto_total',
      sortable: true,
    },
    {//26 PEN o USD
      name: 'MONEDA',
      selector: 'r_moneda',
      sortable: true,
    },
    {//27
      name: 'TC',
      selector: 'r_tc',
      sortable: true,
    },
    {//28
      name: 'REF.Emision',
      selector: 'r_fecemi_ref',
      sortable: true,
    },
    {//29
      name: 'REF.TP',
      selector: 'r_cod_ref',
      sortable: true,
    },
    {//30
      name: 'REF.SERIE',
      selector: 'r_serie_ref',
      sortable: true,
    },
    {//31 cambioooo
      name: 'Aduana',
      selector: 'r_id_aduana',
      sortable: true,
    },
    {//32
      name: 'REF.NUM',
      selector: 'r_numero_ref',
      sortable: true,
    },
    {//33
      name: 'ID.BSS',
      selector: 'r_idbss',
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
  

  