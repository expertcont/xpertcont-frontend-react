CREATE OR REPLACE FUNCTION public.fn_mve_transventa_grabar_encomienda(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_usuario              varchar(20);
  v_documento_id            varchar(20);
  v_periodo                 varchar(7);
  v_r_cod                   char(2);
  v_r_serie                 char(4);
  v_r_numero                varchar(10);
  v_exito_correlativo       boolean;
  v_elemento                integer;
  v_r_fecemi                date;

  v_cliente_documento_id    varchar(20);
  v_cliente_id_doc          varchar(2);
  v_destinatario_documento_id varchar(20);
  v_destinatario_id_doc     varchar(2);

  v_id_ruta                 varchar(15);
  v_id_punto_venta          varchar(10);
  v_id_punto_venta_dest     varchar(10);

  v_total                   numeric(14,2);
  v_porc_igv                numeric(5,2);
  v_r_gravado               numeric(14,2);
  v_r_exonerado             numeric(14,2);
  v_r_igv                   numeric(14,2);

  v_result                  jsonb;
BEGIN
  /*
    Contrato:
      SELECT public.fn_mve_transventa_grabar_encomienda($1::jsonb);

    p_data debe traer, como minimo:
      id_usuario, id_invitado, documento_id, periodo, r_fecemi,
      cliente_documento_id o cliente_documento,
      cliente, destinatario_documento_id o destinatario_documento,
      destinatario, id_ruta, descripcion, placa, licencia, r_monto_total.

    r_cod se deriva por documento del remitente:
      11 digitos => '01' factura
      otro caso  => '03' boleta
    r_serie se deriva desde mad_punto_venta.serie:
      serie='0001' => B001 o F001 segun r_cod
    r_numero se obtiene con fve_genera01_correl y se confirma con fve_genera02_correl.
  */

  v_id_usuario := COALESCE(NULLIF(p_data->>'id_usuario', ''), NULLIF(p_data->>'id_anfitrion', ''));
  v_documento_id := NULLIF(p_data->>'documento_id', '');
  v_periodo := NULLIF(p_data->>'periodo', '');
  v_r_fecemi := NULLIF(p_data->>'r_fecemi', '')::date;

  v_cliente_documento_id := COALESCE(NULLIF(p_data->>'cliente_documento_id', ''), NULLIF(p_data->>'cliente_documento', ''));
  v_destinatario_documento_id := COALESCE(NULLIF(p_data->>'destinatario_documento_id', ''), NULLIF(p_data->>'destinatario_documento', ''));

  v_r_cod := CASE WHEN length(regexp_replace(COALESCE(v_cliente_documento_id, ''), '\D', '', 'g')) = 11 THEN '01' ELSE '03' END;

  v_elemento := COALESCE(NULLIF(p_data->>'elemento', '')::integer, 1);
  v_id_ruta := NULLIF(p_data->>'id_ruta', '');

  v_cliente_id_doc := COALESCE(
    NULLIF(p_data->>'cliente_id_doc', ''),
    NULLIF(p_data->>'id_documento', ''),
    CASE WHEN length(regexp_replace(COALESCE(v_cliente_documento_id, ''), '\D', '', 'g')) = 11 THEN '6' ELSE '1' END
  );

  v_destinatario_id_doc := COALESCE(
    NULLIF(p_data->>'destinatario_id_doc', ''),
    CASE WHEN length(regexp_replace(COALESCE(v_destinatario_documento_id, ''), '\D', '', 'g')) = 11 THEN '6' ELSE '1' END
  );

  IF v_id_usuario IS NULL OR v_documento_id IS NULL OR v_periodo IS NULL OR v_r_fecemi IS NULL THEN
    RAISE EXCEPTION 'Faltan datos base: id_usuario, documento_id, periodo o r_fecemi';
  END IF;

  IF v_cliente_documento_id IS NULL OR NULLIF(p_data->>'cliente', '') IS NULL THEN
    RAISE EXCEPTION 'Faltan datos del remitente';
  END IF;

  IF v_destinatario_documento_id IS NULL OR NULLIF(p_data->>'destinatario', '') IS NULL THEN
    RAISE EXCEPTION 'Faltan datos del destinatario';
  END IF;

  IF v_id_ruta IS NULL THEN
    RAISE EXCEPTION 'La ruta/destino es requerida';
  END IF;

  IF NULLIF(p_data->>'placa', '') IS NULL THEN
    RAISE EXCEPTION 'La placa es requerida';
  END IF;

  IF NULLIF(p_data->>'licencia', '') IS NULL THEN
    RAISE EXCEPTION 'La licencia es requerida';
  END IF;

  SELECT r.id_punto_venta, r.id_punto_venta_dest
    INTO v_id_punto_venta, v_id_punto_venta_dest
    FROM public.mve_transruta r
   WHERE r.id_usuario = v_id_usuario
     AND r.documento_id = v_documento_id
     AND r.id_ruta = v_id_ruta;

  IF v_id_punto_venta IS NULL OR v_id_punto_venta_dest IS NULL THEN
    RAISE EXCEPTION 'La ruta indicada no existe para la empresa seleccionada';
  END IF;

  v_id_punto_venta := COALESCE(NULLIF(p_data->>'id_punto_venta', ''), v_id_punto_venta);
  v_id_punto_venta_dest := COALESCE(NULLIF(p_data->>'id_punto_venta_dest', ''), v_id_punto_venta_dest);

  SELECT CASE
           WHEN v_r_cod = '01' THEN 'F' || right(lpad(trim(pv.serie), 4, '0'), 3)
           ELSE 'B' || right(lpad(trim(pv.serie), 4, '0'), 3)
         END
    INTO v_r_serie
    FROM public.mad_punto_venta pv
   WHERE pv.id_usuario = v_id_usuario
     AND pv.documento_id = v_documento_id
     AND pv.id_punto_venta = v_id_punto_venta;

  IF v_r_serie IS NULL THEN
    RAISE EXCEPTION 'El punto de venta % no tiene serie configurada', v_id_punto_venta;
  END IF;

  v_total := COALESCE(
    NULLIF(p_data->>'r_monto_total', '')::numeric,
    NULLIF(p_data->>'precio_neto', '')::numeric,
    NULLIF(p_data->>'precio_unitario', '')::numeric,
    0
  );

  v_porc_igv := COALESCE(NULLIF(p_data->>'porc_igv', '')::numeric, 18);

  IF jsonb_exists(p_data, 'r_gravado') OR jsonb_exists(p_data, 'r_exonerado') OR jsonb_exists(p_data, 'r_igv') THEN
    v_r_gravado := COALESCE(NULLIF(p_data->>'r_gravado', '')::numeric, 0);
    v_r_exonerado := COALESCE(NULLIF(p_data->>'r_exonerado', '')::numeric, 0);
    v_r_igv := COALESCE(NULLIF(p_data->>'r_igv', '')::numeric, 0);
  ELSE
    v_r_gravado := round(v_total / (1 + (v_porc_igv / 100)), 2);
    v_r_igv := round(v_total - v_r_gravado, 2);
    v_r_exonerado := 0;
  END IF;

  v_r_numero := COALESCE(NULLIF(p_data->>'r_numero', ''), (
    SELECT public.fve_genera01_correl(v_id_usuario, v_documento_id, v_r_cod, v_r_serie)
  ));

  IF v_r_numero IS NULL THEN
    RAISE EXCEPTION 'No se pudo generar correlativo para %, serie %', v_r_cod, v_r_serie;
  END IF;

  INSERT INTO public.mve_transventa AS tv (
    id_usuario, documento_id, periodo,
    r_cod, r_serie, r_numero, elemento,
    r_fecemi, tipo_operacion,
    r_cod_ref, r_serie_ref, r_numero_ref, r_fecemi_ref,
    cliente_id_doc, cliente_documento_id, cliente,
    cliente_telefono, cliente_direccion_fact,
    cliente_zona, cliente_direccion,
    id_ruta, descripcion,
    id_punto_venta, id_punto_venta_dest,
    placa, licencia,
    asiento, pasajero_edad,
    destinatario_id_doc, destinatario_documento_id,
    destinatario, destinatario_telefono, destinatario_direccion,
    precio_neto,
    r_gravado, r_exonerado, r_igv, r_monto_total, porc_igv,
    condicion_pago, llegada_aprox,
    numero_rdi, estado_sunat,
    ctrl_crea, ctrl_crea_us
  )
  VALUES (
    v_id_usuario, v_documento_id, v_periodo,
    v_r_cod, v_r_serie, v_r_numero, v_elemento,
    v_r_fecemi, 'E',
    NULLIF(p_data->>'r_cod_ref', ''), NULLIF(p_data->>'r_serie_ref', ''),
    NULLIF(p_data->>'r_numero_ref', ''), NULLIF(p_data->>'r_fecemi_ref', '')::date,
    v_cliente_id_doc, v_cliente_documento_id, NULLIF(p_data->>'cliente', ''),
    NULLIF(p_data->>'cliente_telefono', ''), NULLIF(p_data->>'cliente_direccion_fact', ''),
    COALESCE(NULLIF(p_data->>'cliente_zona', ''), NULLIF(p_data->>'remitente_zona', '')),
    COALESCE(NULLIF(p_data->>'cliente_direccion', ''), NULLIF(p_data->>'remitente_direccion', '')),
    v_id_ruta, NULLIF(p_data->>'descripcion', ''),
    v_id_punto_venta, v_id_punto_venta_dest,
    NULLIF(p_data->>'placa', ''), NULLIF(p_data->>'licencia', ''),
    NULLIF(p_data->>'asiento', ''), NULLIF(p_data->>'pasajero_edad', '')::integer,
    v_destinatario_id_doc, v_destinatario_documento_id,
    NULLIF(p_data->>'destinatario', ''), NULLIF(p_data->>'destinatario_telefono', ''),
    NULLIF(p_data->>'destinatario_direccion', ''),
    v_total,
    v_r_gravado, v_r_exonerado, v_r_igv, v_total, v_porc_igv,
    NULLIF(p_data->>'condicion_pago', ''), NULLIF(p_data->>'llegada_aprox', '')::time,
    NULLIF(p_data->>'numero_rdi', ''), NULLIF(p_data->>'estado_sunat', '')::char(1),
    CURRENT_TIMESTAMP, COALESCE(NULLIF(p_data->>'id_invitado', ''), NULLIF(p_data->>'ctrl_crea_us', ''))
  )
  RETURNING to_jsonb(tv) INTO v_result;

  v_exito_correlativo := (
    SELECT public.fve_genera02_correl(v_id_usuario, v_documento_id, v_r_cod, v_r_serie)
  );

  IF NOT COALESCE(v_exito_correlativo, false) THEN
    RAISE EXCEPTION 'No se pudo confirmar correlativo para %, serie %, numero %', v_r_cod, v_r_serie, v_r_numero;
  END IF;

  RETURN v_result;
END;
$$;
