import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import numeral from 'numeral';
import QRCode from 'qrcode';
import { NumerosALetras } from 'numero-a-letras';

function base64ToUint8Array(base64) {
  const binaryString = window.atob(base64); // Decodificar Base64 a binario
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function createPdfTicket (options) {
  const {
    comprobante, documento_id, id_invitado,
    venta, ventadet, 
    logo, size
  } = options;

    const pdfDoc = await PDFDocument.create()

    // Definir el ancho según el tamaño del ticket
    const width = (size === '80mm') ? 226.77 : 164.41; // 80mm o 58mm
    const fontSize = (size === '80mm') ? 10 : 8; // 80mm o 58mm
    const marginLeftSize = (size === '80mm') ? 0 : 62.36; // 80mm o 58mm

    const lineHeight = fontSize * 1.2;

    //caso contrario restar 22mm a la izquierda y disminuir la fuente en 2 puntos, probando

    // Altura inicial (puedes ajustarla dinámicamente)
    let height = 800;
    const page = pdfDoc.addPage([width, height]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontNegrita = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add logo to the top of the page
    //const logoImage = pdfDoc.embedPng(logo);
    const pngImage = await pdfDoc.embedPng(logo);
    const pngDims = pngImage.scale(0.6)
    const margin = 5;

    page.drawImage(pngImage, {
      x: margin+50-(marginLeftSize/2),
      y: 730,
      width: pngDims.width,
      height: pngDims.height,
    })

    let x = margin;
    let y = 720;

    //Documento electronico y logo expertcont
    console.log('comprobante en pdf func',comprobante);
    const COD = comprobante.slice(0,2);
    const documentos = {
      '01': 'FACTURA ELECTRONICA',
      '03': 'BOLETA ELECTRONICA',
      '07': 'NOTA CRED. ELECTRONICA',
      '08': 'NOTA DEB. ELECTRONICA'
    };
    const sDocumento = documentos[COD] || 'DOCUMENTO'; // Manejo de caso por defecto

    const ticketWidth = 227; // Ancho del ticket en puntos (80mm)
   
    //////////////////
    let textWidth = fontNegrita.widthOfTextAtSize(sDocumento, fontSize);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText(sDocumento, { x, y, size: fontSize, font:fontNegrita });
    y=y-12; //aumentamos linea nueva

    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize(('RUC '+documento_id), fontSize+1);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText('RUC '+documento_id, { x, y, size: fontSize+1, font:fontNegrita });
    y=y-12; //aumentamos linea nueva

    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize(venta.razon_social, fontSize);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText(venta.razon_social, { x, y, size: fontSize });
    y=y-12; //aumentamos linea nueva

    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize(venta.direccion, fontSize);
    // Calcular el punto x para alinear a la derecha
    x = ((ticketWidth - textWidth)/2)>0 ? ((ticketWidth - textWidth)/2) : margin;
    page.drawText(venta.direccion, { x, y, size: 8 });
    y=y-12; //aumentamos linea nueva


    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize(comprobante.slice(3), 12);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText(comprobante.slice(3), { x, y, size: 12, font:fontNegrita });
    y=y-12; //aumentamos linea nueva

    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize("FECHA: " + venta.r_fecemi, fontSize);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText("FECHA: " + venta.r_fecemi, { x, y, size: fontSize });
    y=y-15 //aumentamos linea nueva
    //y=y-12; //aumentamos linea nueva

    page.drawRectangle({
      x: margin,
      y: y-2,
      width: (page.getWidth()-margin-5), //TODA ANCHO DE LA HOJA
      height: (lineHeight+2),
      borderWidth: 1,
      color: rgb(0.778, 0.778, 0.778),
      borderColor: rgb(0.8,0.8,0.8)
    });
    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize("DATOS CLIENTE: ", fontSize-1);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText("DATOS DEL CLIENTE: ", { x, y, size: fontSize-1 });
    y=y-12; //aumentamos linea nueva

    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize(venta.r_razon_social, fontSize);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText(venta.r_razon_social?.toString() ?? "", { x, y, size: fontSize});
    y=y-12; //aumentamos linea nueva

    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize("RUC/DNI: " + venta.r_documento_id, fontSize);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText("RUC/DNI: " + venta.r_documento_id?.toString() ?? "", { x, y, size: fontSize });
    y=y-12; //aumentamos linea nueva

    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize(venta.r_direccion, fontSize);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText(venta.r_direccion?.toString() ?? "", { x, y, size: fontSize });
    y=y-12; //aumentamos linea nueva

    ////////////////// cambiar por ctrl_us_crea correo que lo registro
    textWidth = fontNegrita.widthOfTextAtSize("VENTA: "+id_invitado.split('@')[0].slice(0,14), fontSize);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText("VENTA: "+id_invitado.split('@')[0].slice(0,14), { x, y, size: fontSize });
    y=y-12; //aumentamos linea nueva

    //////////////////
    textWidth = fontNegrita.widthOfTextAtSize("PAGO: CONTADO", fontSize);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - marginLeftSize)/2;
    page.drawText("PAGO: CONTADO", { x, y, size: fontSize });
    
    y=y-15; //aumentamos linea nueva
    //y=y-12; //aumentamos linea nueva
    
    ////////////////////////////////////////////////////////////////////
    // Draw table data
    let row = 1;
    let espaciadoDet = 0; //iniciamos en la 1era fila
    
    //let precio_total = 0;
    espaciadoDet = espaciadoDet+20; ///NEW

    page.drawRectangle({
      x: margin,
      y: y-2,
      width: (page.getWidth()-margin-5), //TODA ANCHO DE LA HOJA
      height: (lineHeight+2),
      borderWidth: 1,
      color: rgb(0.778, 0.778, 0.778),
      borderColor: rgb(0.8,0.8,0.8)
    });

    page.drawText("DESCRIPCION", { x:margin, y, size: fontSize-1 });

    textWidth = fontNegrita.widthOfTextAtSize('P.UNIT', fontSize-1);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - margin - 50 - marginLeftSize); //50 por columna IMPORTE
    page.drawText("P.UNIT", { x, y, size: fontSize-1 });    

    textWidth = fontNegrita.widthOfTextAtSize('IMPORTE', fontSize-1);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - margin - marginLeftSize);
    page.drawText("IMPORTE", { x, y, size: fontSize-1 });
    
    
    ventadet.forEach((person) => {
      const text = `${person.descripcion}`;
      const textY = y - lineHeight; //corregimos aca, porque se duplicaba espacio en cada grupo

      //1ERA LINEA
      //page.drawText(person.cont_und?.toString() ?? "", { x:x+40, y:y+4-espaciadoDet, size: 10, font }); //Actualizar urgente
      page.drawText(text, { x:margin, y:y+4-espaciadoDet, size: fontSize-1, font }); //Texto de Titulo de Barra ()

      //2da Linea
      espaciadoDet = espaciadoDet+10;
      page.drawText('Cant: '+person.cantidad, { x:margin, y:y+4-espaciadoDet, size: fontSize-1 });

      textWidth = fontNegrita.widthOfTextAtSize(numeral(person.precio_unitario).format('0,0.00'), fontSize);
      // Calcular el punto x para alinear a la derecha
      x = (ticketWidth - textWidth - margin - 50 - marginLeftSize); //50 por columna precio_neto
      page.drawText(person.precio_unitario, { x, y:y+4-espaciadoDet, size: fontSize-1 });
      
      textWidth = fontNegrita.widthOfTextAtSize(numeral(person.precio_neto).format('0,0.00'), fontSize);
      // Calcular el punto x para alinear a la derecha
      x = (ticketWidth - textWidth - margin - marginLeftSize);
      page.drawText(person.precio_neto, { x, y:y+4-espaciadoDet, size: fontSize-1 });

      page.drawLine({
        start: { x: margin, y: y + 2 - espaciadoDet }, // Punto inicial
        end: { x: page.getWidth() - margin - 5, y: y + 2 - espaciadoDet }, // Punto final
        thickness: 1, // Grosor de la línea
        color: rgb(0.778, 0.778, 0.778), // Color de la línea
      });

      //al final del bucle, aumentamos una linea simple :) claro pi ...
      espaciadoDet = espaciadoDet+10;
      row++;
    });
    
    y=y-15; //aumentamos linea nueva
    y=y-15; //aumentamos linea nueva

    let MontoEnLetras = NumerosALetras(venta.r_monto_total, {
      plural: 'SOLES', //pinches opciones no funcionan, tengo q arreglarlas en la siguiente linea
      singular: 'SOL', //todos mis movimientos estan friamente calculados
      centPlural: 'CÉNTIMOS', //siganme los buenos ...  :)
      centSingular: 'CÉNTIMO',
    });
    MontoEnLetras = 'SON: ' + MontoEnLetras.toUpperCase().replace('PESOS', 'SOLES CON').replace('PESO', 'SOL CON').replace('M.N.','');
    page.drawText(MontoEnLetras, { x:margin, y:y-espaciadoDet+30, size: 8 }); //Actualizar urgente


    const moneda = {
      'PEN': 'S/',
      'USD': '$ USD'
    };
    const sMoneda = moneda[venta.r_moneda] || ''; // Manejo de caso por defecto
    console.log(venta.r_moneda, sMoneda);

    //////////////////
    x = margin;
    page.drawText("BASE:",{ x, y:y-espaciadoDet+4, size: 9 });

    textWidth = fontNegrita.widthOfTextAtSize(numeral(venta.r_base002).format('0,0.00'), fontSize+2);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - margin - marginLeftSize);
    page.drawText(numeral(venta.r_base002).format('0,0.00')?.toString() ?? "", { x, y:y+4-espaciadoDet, size: 10, font }); //Actualizar urgente

    x = margin;
    page.drawText("IGV.: ",{ x, y:y-espaciadoDet+4-10, size: 9 });

    textWidth = fontNegrita.widthOfTextAtSize(numeral(venta.r_igv002).format('0,0.00'), fontSize+2);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - margin - marginLeftSize);
    page.drawText(numeral(venta.r_igv002).format('0,0.00')?.toString() ?? "", { x, y:y+4-espaciadoDet-10, size: 10, font }); //Actualizar urgente

    x = margin;
    page.drawText("TOTAL.:" + sMoneda,{ x, y:y-espaciadoDet+4-25, size: fontSize+2, font:fontNegrita });

    textWidth = fontNegrita.widthOfTextAtSize(numeral(venta.r_monto_total).format('0,0.00'), fontSize+2);
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - textWidth - margin - marginLeftSize);
    page.drawText(numeral(venta.r_monto_total).format('0,0.00')?.toString() ?? "", { x, y:y+4-espaciadoDet-25, size: fontSize+2, font:fontNegrita }); //Actualizar urgente

    
    //SeccionQR
    // Generar el código QR como base64
    const partes = comprobante.split('-');
    const numeroFormateado = partes[2].padStart(8, '0');
    const comprobanteConvertido = `${partes[0]}|${partes[1]}|${numeroFormateado}`;

    const qrImage = await QRCode.toDataURL(documento_id + '|' + comprobanteConvertido + '|' + venta.r_igv002 + '|' + venta.r_monto_total + '|' + venta.r_fecemi + '|' + venta.r_id_doc + '|' + venta.r_documento_id + '|');
    // Convertir la imagen base64 a formato compatible con pdf-lib
    const qrImageBytes = qrImage.split(',')[1]; // Eliminar el encabezado base64
    //const qrImageBuffer = Uint8Array.from(atob(qrImageBytes), (c) => c.charCodeAt(0));
    const qrImageBuffer = base64ToUint8Array(qrImageBytes);
    
    const qrImageEmbed = await pdfDoc.embedPng(qrImageBuffer);
    // Obtener dimensiones de la imagen
    const qrWidth = 45;
    const qrHeight = 45;
    // Calcular el punto x para alinear a la derecha
    x = (ticketWidth - 45 - marginLeftSize)/2;

    // Dibujar el código QR en el PDF
    page.drawImage(qrImageEmbed, {
      x,
      y: y-espaciadoDet-26-45,
      width: qrWidth,
      height: qrHeight,
    });

    const pdfBytes = await pdfDoc.save();

    // Crea un Blob con los bytes del PDF
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    // Genera una URL de objeto para el archivo Blob
    const url = URL.createObjectURL(blob);
    // Retorna la URL generada
    return url;    
}

export default createPdfTicket;