/* ============================================================
   cotizacion.js — Lógica exclusiva de cotizacion.html
   Requiere que assets/js/base.js se cargue antes.
   ============================================================ */
(function(){
  'use strict';

  // ---------- Contador de caracteres ----------
  var obsTexto = document.getElementById('observaciones');
  var contador = document.getElementById('contadorTexto');
  if(obsTexto && contador){
    obsTexto.addEventListener('input', function(){ contador.textContent = obsTexto.value.length; });
  }

  // ---------- Modales (Términos / Tratamiento de datos) ----------
  function configurarModal(idBoton, idModal){
    var btn = document.getElementById(idBoton);
    var modal = document.getElementById(idModal);
    if(btn && modal) btn.addEventListener('click', function(){ modal.classList.add('abierto'); });
  }
  configurarModal('abrirTerminos', 'modalTerminos');
  configurarModal('abrirDatos', 'modalDatos');
  document.querySelectorAll('[data-cerrar]').forEach(function(btn){
    btn.addEventListener('click', function(){ btn.closest('.modal-fondo').classList.remove('abierto'); });
  });
  document.querySelectorAll('.modal-fondo').forEach(function(fondo){
    fondo.addEventListener('click', function(e){ if(e.target === fondo) fondo.classList.remove('abierto'); });
  });

  /* ===================== CALCULADORA DE COTIZACIÓN ===================== */
  var CIUDADES_FIADORES = {
    'Neiva':8, 'Ibagué':8, 'Cali':16, 'Medellín':23, 'Pereira':12, 'Manizales':10,
    'Barranquilla':8, 'Cartagena':8, 'Cúcuta':8, 'Bucaramanga':12, 'Bogotá':27
  };

  var PRECIOS_FIJOS = {
    'menos1': {propietario:180000, inmobiliaria:200000, aseguradora:240000},
    '1-1.5':  {propietario:200000, inmobiliaria:240000, aseguradora:280000},
    '1.5-2':  {propietario:260000, inmobiliaria:300000, aseguradora:340000},
    '2-2.5':  {propietario:300000, inmobiliaria:360000, aseguradora:400000},
    '2.5-3':  {propietario:460000, inmobiliaria:500000, aseguradora:560000},
    '3-4':    {propietario:500000, inmobiliaria:600000, aseguradora:700000},
    '4-5':    {propietario:600000, inmobiliaria:700000, aseguradora:800000}
  };
  var PORCENTAJES_MAS6 = {propietario:0.14, inmobiliaria:0.16, aseguradora:0.20};
  var ETIQUETAS_CONTRATACION = {propietario:'Directamente con el propietario', inmobiliaria:'Con inmobiliaria', aseguradora:'Con aseguradora'};

  var selCiudad = document.getElementById('ciudad');
  var subOtraCiudad = document.getElementById('subOtraCiudad');
  var inputOtraCiudad = document.getElementById('otraCiudad');
  var selCanon = document.getElementById('canon');
  var subValorExacto = document.getElementById('subValorExacto');
  var inputValorExacto = document.getElementById('valorExacto');
  var selContratacion = document.getElementById('tipoContratacion');
  var selTipoServicio = document.getElementById('tipoServicioCotizacion');
  var ayudaTomadorFiador = document.getElementById('ayudaTomadorFiador');

  var camposCotizacion = document.getElementById('camposCotizacion');
  var grupoDatosPersonales = document.getElementById('grupoDatosPersonales');
  var grupoCiudad = document.getElementById('grupoCiudad');
  var grupoInfoAdicional = document.getElementById('grupoInfoAdicional');
  var grupoLegalesEnvio = document.getElementById('grupoLegalesEnvio');
  var tituloDatosCotizacion = document.getElementById('tituloDatosCotizacion');
  var cajaResultado = document.getElementById('cajaResultado');
  var resultadoPrecio = document.getElementById('resultadoPrecio');
  var resultadoCiudad = document.getElementById('resultadoCiudad');
  var resultadoTipoServicio = document.getElementById('resultadoTipoServicio');
  var notaTomadorFiador = document.getElementById('notaTomadorFiador');
  var resultadoFiadores = document.getElementById('resultadoFiadores');
  var resultadoContratacion = document.getElementById('resultadoContratacion');
  var hiddenCotizacion = document.getElementById('hiddenCotizacion');
  var hiddenFiadores = document.getElementById('hiddenFiadores');
  var estadoEnvio = document.getElementById('estadoEnvio');
  var form = document.getElementById('formCotizacion');
  var confirmada = false;

  if(!selCiudad || !selCanon || !selContratacion || !selTipoServicio || !form) return;

  // Mostrar la ayuda de "2 personas" cuando se elige Tomador y fiador
  selTipoServicio.addEventListener('change', function(){
    var esDoble = selTipoServicio.value === 'tomador_fiador';
    ayudaTomadorFiador.style.display = esDoble ? 'block' : 'none';
    if(confirmada) recalcularEnVivo();
  });

  // Mostrar/ocultar el campo de "otra ciudad" cuando se elige esa opción
  selCiudad.addEventListener('change', function(){
    var esOtra = selCiudad.value === 'Otra ciudad';
    subOtraCiudad.classList.toggle('abierto', esOtra);
    inputOtraCiudad.required = esOtra;
    if(!esOtra) inputOtraCiudad.value = '';
  });

  function formatoCOP(valor){
    return '$' + Math.round(valor).toLocaleString('es-CO');
  }

  // Mostrar/ocultar el campo de valor exacto cuando se elige "Más de 6 millones"
  selCanon.addEventListener('change', function(){
    var esMas6 = selCanon.value === 'mas6';
    subValorExacto.classList.toggle('abierto', esMas6);
    inputValorExacto.required = esMas6;
    if(!esMas6) inputValorExacto.value = '';
    if(confirmada) recalcularEnVivo();
  });

  // Calcula el precio y llena el bloque de resultado
  function calcular(){
    var ciudad = selCiudad.value;
    var canon = selCanon.value;
    var tipo = selContratacion.value;
    var esTomadorFiador = selTipoServicio.value === 'tomador_fiador';
    var precio;
    var esOtraCiudad = ciudad === 'Otra ciudad';
    var nombreCiudadMostrar = esOtraCiudad ? (inputOtraCiudad.value.trim() || 'Otra ciudad') : ciudad;

    if(canon === 'mas6'){
      var valor = parseFloat(inputValorExacto.value);
      precio = valor * PORCENTAJES_MAS6[tipo];
    } else {
      precio = PRECIOS_FIJOS[canon][tipo];
    }

    // Tomador y fiador = 2 personas, por eso se duplica el valor del servicio
    if(esTomadorFiador) precio = precio * 2;

    resultadoPrecio.textContent = formatoCOP(precio);
    resultadoCiudad.textContent = nombreCiudadMostrar;
    resultadoTipoServicio.textContent = esTomadorFiador ? 'Tomador y fiador' : 'Fiador con finca raíz';
    resultadoFiadores.textContent = esOtraCiudad ? 'Servicio virtual o fiador de la ciudad más cercana' : (CIUDADES_FIADORES[ciudad] + ' fiadores');
    resultadoContratacion.textContent = ETIQUETAS_CONTRATACION[tipo];
    notaTomadorFiador.style.display = esTomadorFiador ? 'block' : 'none';

    hiddenCotizacion.value = formatoCOP(precio);
    hiddenFiadores.value = esOtraCiudad ? 'Servicio virtual / fiador más cercano' : CIUDADES_FIADORES[ciudad];
  }

  // Después de confirmar, si el cliente cambia el canon o el tipo de contratación, recalcula al instante (sin reenviar el correo)
  function recalcularEnVivo(){
    if(selCanon.value === 'mas6'){
      var valor = parseFloat(inputValorExacto.value);
      if(!valor || valor <= 0) return;
    }
    calcular();
    cajaResultado.classList.remove('actualizado');
    void cajaResultado.offsetWidth;
    cajaResultado.classList.add('actualizado');
  }
  inputValorExacto.addEventListener('input', function(){ if(confirmada) recalcularEnVivo(); });
  selContratacion.addEventListener('change', function(){ if(confirmada) recalcularEnVivo(); });

  /* ===================== CONFIRMAR COTIZACIÓN ===================== */
  form.addEventListener('submit', function(e){
    e.preventDefault();

    if(!form.checkValidity()){
      form.reportValidity();
      return;
    }
    if(selCanon.value === 'mas6'){
      var valorDigitado = parseFloat(inputValorExacto.value);
      if(!valorDigitado || valorDigitado <= 0){
        alert('Por favor digita el valor exacto del canon para calcular tu cotización.');
        inputValorExacto.focus();
        return;
      }
    }

    // Protección anti-spam: honeypot + trampa de tiempo (ver assets/js/base.js)
    if(window.FiadorAntiSpam && !window.FiadorAntiSpam.valido(form)){
      estadoEnvio.textContent = '✓ Tu cotización fue enviada. Un asesor te contactará muy pronto.';
      calcular();
      confirmada = true;
      return; // no se envía nada a FormSubmit; a ojos del bot "funcionó"
    }

    calcular();
    confirmada = true;

    // Oculta nombre, teléfono, ciudad, observaciones y el bloque legal/botón; deja solo canon y tipo de contratación para consultar otros valores
    [grupoDatosPersonales, grupoCiudad, grupoInfoAdicional, grupoLegalesEnvio].forEach(function(g){ g.classList.add('oculto-transicion'); });
    setTimeout(function(){
      [grupoDatosPersonales, grupoCiudad, grupoInfoAdicional, grupoLegalesEnvio].forEach(function(g){ g.style.display = 'none'; });
      tituloDatosCotizacion.textContent = 'Consulta otros valores';
      cajaResultado.style.display = 'block';
      requestAnimationFrame(function(){ cajaResultado.classList.add('visible'); });
      cajaResultado.scrollIntoView({behavior:'smooth', block:'start'});
    }, 300);

    // Arma el correo con el resumen de la cotización que le llega al cliente a su propio correo
    var correoCliente = document.getElementById('correoCotizacion').value;
    var emailEspejo = document.getElementById('emailEspejoCotizacion');
    var autoresponseTexto = document.getElementById('autoresponseTextoCotizacion');
    if(emailEspejo) emailEspejo.value = correoCliente;
    if(autoresponseTexto){
      var nombreCliente = document.getElementById('nombre').value;
      autoresponseTexto.value = [
        'Hola ' + nombreCliente + ', gracias por cotizar tu servicio con fiador.com.',
        '',
        '===================================',
        '  RESUMEN DE TU COTIZACIÓN',
        '===================================',
        'Ciudad: ' + resultadoCiudad.textContent,
        'Servicio: ' + resultadoTipoServicio.textContent,
        'Tipo de contratación: ' + resultadoContratacion.textContent,
        'Fiadores disponibles: ' + resultadoFiadores.textContent,
        '-----------------------------------',
        'VALOR ESTIMADO DEL SERVICIO: ' + resultadoPrecio.textContent,
        '===================================',
        '',
        (selTipoServicio.value === 'tomador_fiador' ? 'Este valor incluye el costo de dos personas: una como titular o tomador del contrato, y otra como fiador con finca raíz.\n\n' : ''),
        'Este es un valor de referencia. El valor final puede variar según la revisión de nuestro equipo, y ya incluye la norma de finca raíz y solvencia económica exigida.',
        '',
        'Un asesor se pondrá en contacto contigo muy pronto. Si tienes dudas, escríbenos por WhatsApp: https://wa.me/573117285089'
      ].join('\n');
    }

    // Envía los datos por un iframe oculto (envío nativo, no AJAX) para que FormSubmit
    // procese el _autoresponse y le llegue el resumen al correo del cliente, sin salir de esta página.
    estadoEnvio.textContent = '✓ Tu cotización fue enviada. Un asesor te contactará muy pronto.';
    form.submit();
  });

})();
