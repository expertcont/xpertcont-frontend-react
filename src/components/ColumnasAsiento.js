//import React from 'react';
//import { ArrowDownward } from '@mui/icons-material';

export const VentasColumnas = [
  /*{//01 campos default ocultos
    name: 'Emisor',
    selector: 'documento_id',
    sortable: true,
    width: '0px',
  },
  {//02 campos default ocultos
    name: 'Razon Social',
    selector: 'razon_social',
    sortable: true,
    width: '0px',
    hidden:true
  },
  {//03 campos default ocultos
    name: 'Periodo',
    selector: 'periodo',
    sortable: true,
    width: '0px',
    hidden:true
  },
  {//04
    name: 'CAR sunat',
    selector: 'car',
    sortable: true,
    width: '0px',
    hidden:true
  },*/
  {//origen
    name: 'Origen',
    selector: 'origen',
    width: '90px',
    sortable: true,
  },
  {//05
    name: 'Emision',
    selector: 'r_fecemi',
    width: '100px',
    sortable: true,
  },
  {//06
    name: 'Vcto',
    selector: 'r_fecvcto',
    width: '100px',
    sortable: true,
  },
  /*{//07
    name: 'Doc',
    selector: 'r_cod',
    sortable: true,
  },
  {//08
    name: 'Serie',
    selector: 'r_serie',
    sortable: true,
  },
  {//09
    name: 'Num',
    selector: 'r_numero',
    sortable: true,
  },*/
  {//07-08-10
    name: 'Comprobante',
    selector: 'comprobante', //campo unido
    width: '150px',
    sortable: true,
  },
  {//10
    name: 'NumF',
    selector: 'r_numero2',
    width: '90px',
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
  {//14
    name: 'Valor Export',
    selector: 'export',
    sortable: true,
  },
  {//15
    name: 'Base Gravada',
    selector: 'base',
    sortable: true,
  },
  {//16 Preguntar a contadores, aplicacion de este campo
    name: 'Desc Base',
    selector: 'r_base_desc',
    sortable: true,
  },
  {//17
    name: 'IGV',
    selector: 'igv',
    sortable: true,
  },
  {//18 Preguntar a contadores, aplicacion de este campo
    name: 'Desc Igv',
    selector: 'r_igv_desc',
    sortable: true,
  },
  {//19
    name: 'Exonerado',
    selector: 'exonera',
    sortable: true,
  },
  {//20
    name: 'Inafecto',
    selector: 'inafecta',
    sortable: true,
  },
  {//21
    name: 'ISC',
    selector: 'r_monto_isc',
    sortable: true,
  },
  {//22 arroz pilado
    name: 'Base IVAP',
    selector: 'r_base_ivap',
    sortable: true,
  },
  {//23 arroz pilado
    name: 'Igv IVAP',
    selector: 'r_igv_ivap',
    sortable: true,
  },
  {//24
    name: 'ICBP',
    selector: 'r_monto_icbp',
    sortable: true,
  },
  {//25
    name: 'OTROS',
    selector: 'r_monto_otros',
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
    name: 'ID.PROY',
    selector: 'r_contrato_id',
    sortable: true,
  },

  // Otras columnas específicas para la vista de Ventas
];

export const ComprasColumnas = [
  /*{//01 campos default ocultos
    name: 'Emisor',
    selector: 'documento_id',
    sortable: true,
    width: '80px',
  },
  {//02 campos default ocultos
    name: 'Razon Social',
    selector: 'razon_social',
    sortable: true,
    width: '80px',
  },
  {//03 campos default ocultos
    name: 'Periodo',
    selector: 'periodo',
    sortable: true,
    width: '80px',
  },
  {//04
    name: 'CAR sunat',
    selector: 'car',
    sortable: true,
    width: '90px',
  },*/
  {//origen
    name: 'Origen',
    selector: 'origen',
    width: '90px',
    sortable: true,
  },
  {//05
    name: 'Emision',
    selector: 'r_fecemi',
    width: '100px',
    sortable: true,
  },
  {//06
    name: 'Vcto',
    selector: 'r_fecvcto',
    width: '100px',
    sortable: true,
  },
  /*{//07
    name: 'Doc',
    selector: 'r_cod',
    width: '60px',
    sortable: true,
  },
  {//08
    name: 'Serie',
    selector: 'r_serie',
    width: '60px',
    sortable: true,
  },
  {//10
    name: 'Num',
    selector: 'r_numero',
    width: '90px',
    sortable: true,
  },*/
  {//07-08-10
    name: 'Comprobante',
    selector: 'comprobante', //campo unido
    width: '150px',
    sortable: true,
  },
  {//11
    name: 'NumF',
    selector: 'r_numero2',
    width: '90px',
    sortable: true,
  },
  {//09 cambioooo
    name: 'A.Dua',
    selector: 'r_ano_dua',
    width: '90px',
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
  {//34 vacio, no comun
    name: 'ID.CONTRATO',
    selector: 'r_contrato_id',
    sortable: true,
  },
  {//35 vacio, no comun
    name: '%.CONTRATO',
    selector: 'r_contrato_porc',
    sortable: true,
  },
  {//36 vacio, no comun
    name: 'IMPUESTO.MAT',
    selector: 'r_impuesto_mat',
    sortable: true,
  },
  {//37 vacio, no comun
    name: 'CAR.CP',
    selector: 'r_car_cp',
    sortable: true,
  },
  //Ya no se usa datos detraccion, pero se podria manejar en campos auxiliar no obligatorios
  //numero_constancia
  //fecha_constancia
  //como en algun tutorial lo sugieren
];

export const CajaColumnas = [
  {//05
    name: 'Asiento',
    selector: 'num_asiento',
    sortable: true,
  },
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

export const DiarioColumnas = [
  {//05
    name: 'Asiento',
    selector: 'num_asiento',
    sortable: true,
  },
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

export const HojaTrabColumnas = [
  {//01
    name: 'Cuenta',
    selector: 'id_master',
    sortable: true,
  },
  {//02
    name: 'Descripcion',
    selector: 'descripcion',
    sortable: true,
  },
  {//03
    name: 'Debe',
    selector: 'debe',
    sortable: true,
    cell: row => (
      <div>
        {row.debe !== null ? parseFloat(row.debe).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    ) 
  },
  {//04
    name: 'Haber',
    selector: 'haber',
    sortable: true,
    cell: row => (
      <div>
        {row.haber !== null ? parseFloat(row.haber).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    ) 
  },
  {//05
    name: 'Balance.D',
    selector: 'balance_debe',
    sortable: true,
    cell: row => (
      <div>
        {row.balance_debe !== null ? parseFloat(row.balance_debe).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    ) 
  },
  {//06
    name: 'Balance.H',
    selector: 'balance_haber',
    sortable: true,
    cell: row => (
      <div>
        {row.balance_haber !== null ? parseFloat(row.balance_haber).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    )
  },
  {//07
    name: 'Gestion.D',
    selector: 'gestion_debe',
    sortable: true,
    cell: row => (
      <div>
        {row.gestion_debe !== null ? parseFloat(row.gestion_debe).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    )
  },
  {//08
    name: 'Gestion.H',
    selector: 'gestion_haber',
    sortable: true,
    cell: row => (
      <div>
        {row.gestion_haber !== null ? parseFloat(row.gestion_haber).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    )
  },
  {//09
    name: 'Func.D',
    selector: 'funcion_debe',
    sortable: true,
    cell: row => (
      <div>
        {row.funcion_debe !== null ? parseFloat(row.funcion_debe).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    )
  },
  {//10
    name: 'Func.H',
    selector: 'funcion_haber',
    sortable: true,
    cell: row => (
      <div>
        {row.funcion_haber !== null ? parseFloat(row.funcion_haber).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    )
  },
  {//11
    name: 'Nat.D',
    selector: 'naturaleza_debe',
    sortable: true,
    cell: row => (
      <div>
        {row.naturaleza_debe !== null ? parseFloat(row.naturaleza_debe).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    )
  },
  {//12
    name: 'Nat.H',
    selector: 'naturaleza_haber',
    sortable: true,
    cell: row => (
      <div>
        {row.naturaleza_haber !== null ? parseFloat(row.naturaleza_haber).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    )
  },
];

export const AnalisisCuentaColumnas = [
  {//01
    name: 'Periodo',
    selector: 'periodo',
    sortable: true,
    width: '90px',
  },
  {//01
    name: 'Libro',
    selector: 'nombre_corto',
    sortable: true,
    width: '90px',
  },
  {//01
    name: 'Asiento',
    selector: 'num_asiento',
    sortable: true,
    width: '90px',
  },
  {//01
    name: 'Item',
    selector: 'item',
    sortable: true,
    width: '70px',
  },
  {//01
    name: 'F.Conta',
    selector: 'fecha_asiento',
    sortable: true,
    width: '100px',
  },
  {//01
    name: 'Cuenta',
    selector: 'id_cuenta',
    sortable: true,
    width: '100px',
  },
  {//01
    name: 'ID',
    selector: 'r_id_doc',
    sortable: true,
    width: '40px',
  },
  {//01
    name: 'Documento',
    selector: 'r_documento_id',
    sortable: true,
    width: '110px',
  },
  {//02
    name: 'RSocial',
    selector: 'r_razon_social',
    sortable: true,
  },
  {//02
    name: 'Glosa',
    selector: 'r_glosa',
    sortable: true,
  },

  {//02
    name: 'Emision',
    selector: 'r_fecemi',
    sortable: true,
    width: '100px',
  },
  {//02
    name: 'Vcto',
    selector: 'r_fecvcto',
    sortable: true,
    width: '100px',
  },
  {//02
    name: 'Comprobante',
    selector: 'r_comprobante',
    sortable: true,
    width: '120px',
  },

  {//02
    name: 'R.Emision',
    selector: 'r_fecemi_ref',
    sortable: true,
    width: '100px',
  },
  {//02
    name: 'R.Vcto',
    selector: 'r_fecvcto_ref',
    sortable: true,
    width: '100px',
  },
  {//02
    name: 'R.Comprobante',
    selector: 'r_comprobante_ref',
    sortable: true,
    width: '120px',
  },
  
  {//03
    name: 'Debe',
    selector: 'debe_nac',
    sortable: true,
    width: '100px',
    cell: row => (
      <div>
        {row.debe_nac !== null ? parseFloat(row.debe_nac).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    ) 
  },
  {//04
    name: 'Haber',
    selector: 'haber_nac',
    sortable: true,
    width: '100px',
    cell: row => (
      <div>
        {row.haber_nac !== null ? parseFloat(row.haber_nac).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    ) 
  },
  {//04
    name: 'TC',
    selector: 'r_tc',
    sortable: true,
    width: '100px',
    cell: row => (
      <div>
        {row.r_tc !== null ? parseFloat(row.r_tc).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    ) 
  },  
  {//03
    name: 'Debe $',
    selector: 'debe_me',
    sortable: true,
    width: '100px',
    cell: row => (
      <div>
        {row.debe_me !== null ? parseFloat(row.debe_me).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    ) 
  },
  {//04
    name: 'Haber $',
    selector: 'haber_nac',
    sortable: true,
    cell: row => (
      <div>
        {row.haber_me !== null ? parseFloat(row.haber_me).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    ) 
  },
];

export const CuentasCorrientesColumnas = [
  {//01
    name: 'Cuenta',
    selector: 'id_cuenta',
    sortable: true,
    width: '100px',
  },
  {//01
    name: 'ID',
    selector: 'r_id_doc',
    sortable: true,
    width: '40px',
  },
  {//01
    name: 'Documento',
    selector: 'r_documento_id',
    sortable: true,
    width: '110px',
  },
  {//02
    name: 'RSocial',
    selector: 'r_razon_social',
    sortable: true,
  },
  {//02
    name: 'Emision',
    selector: 'r_fecemi',
    sortable: true,
    width: '100px',
  },
  {//02
    name: 'Vcto',
    selector: 'r_fecvcto',
    sortable: true,
    width: '100px',
  },
  {//02
    name: 'Comprobante',
    selector: 'r_comprobante',
    sortable: true,
    width: '120px',
  },

  {//03
    name: 'Deudor S/',
    selector: 'saldo_deudor_mn',
    sortable: true,
    width: '110px',
    cell: row => (
      <div>
        {row.saldo_deudor_mn !== null ? parseFloat(row.saldo_deudor_mn).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    ) 
  },
  {//04
    name: 'Acreedor S/',
    selector: 'saldo_acreedor_mn',
    sortable: true,
    width: '120px',
    cell: row => (
      <div>
        {row.saldo_acreedor_mn !== null ? parseFloat(row.saldo_acreedor_mn).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    ) 
  },
  {//03
    name: 'Deudor $',
    selector: 'saldo_deudor_me',
    sortable: true,
    width: '110px',
    cell: row => (
      <div>
        {row.saldo_deudor_me !== null ? parseFloat(row.saldo_deudor_me).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    ) 
  },
  {//04
    name: 'Acreedor $',
    selector: 'saldo_acreedor_me',
    sortable: true,
    cell: row => (
      <div>
        {row.saldo_acreedor_me !== null ? parseFloat(row.saldo_acreedor_me).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    ) 
  },
];
export const CuentasCorrientesColumnasPopUp = [
  {//01
    name: 'Cuenta',
    selector: 'id_cuenta',
    sortable: true,
    width: '100px',
  },
  {//01
    name: 'Documento',
    selector: 'r_documento_id',
    sortable: true,
    width: '110px',
  },
  {//02
    name: 'RSocial',
    selector: 'r_razon_social',
    sortable: true,
  },
  {//02
    name: 'Emision',
    selector: 'r_fecemi',
    sortable: true,
    width: '100px',
  },
  {//02
    name: 'Comprobante',
    selector: 'r_comprobante',
    sortable: true,
    width: '120px',
  },

  {//03
    name: 'Deudor S/',
    selector: 'saldo_deudor_mn',
    sortable: true,
    width: '110px',
    cell: row => (
      <div>
        {row.saldo_deudor_mn !== null ? parseFloat(row.saldo_deudor_mn).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    ) 
  },
  {//04
    name: 'Acreedor S/',
    selector: 'saldo_acreedor_mn',
    sortable: true,
    width: '120px',
    cell: row => (
      <div>
        {row.saldo_acreedor_mn !== null ? parseFloat(row.saldo_acreedor_mn).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    ) 
  },
  {//03
    name: 'Deudor $',
    selector: 'saldo_deudor_me',
    sortable: true,
    width: '110px',
    cell: row => (
      <div>
        {row.saldo_deudor_me !== null ? parseFloat(row.saldo_deudor_me).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    ) 
  },
  {//04
    name: 'Acreedor $',
    selector: 'saldo_acreedor_me',
    sortable: true,
    cell: row => (
      <div>
        {row.saldo_acreedor_me !== null ? parseFloat(row.saldo_acreedor_me).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
      </div>
    ) 
  },
];

// Define más conjuntos de columnas para las otras vistas (caja, diario, etc.) si es necesario