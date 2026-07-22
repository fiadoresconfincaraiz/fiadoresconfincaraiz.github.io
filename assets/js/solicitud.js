/* ============================================================
   solicitud.js — Lógica exclusiva de solicitud.html
   Requiere que assets/js/base.js se cargue antes.
   ============================================================ */
(function(){
  'use strict';

  // ---------- Campo "Otros" en Tipo de servicio ----------
  var tipoServicio = document.getElementById('tipoServicio');
  var subOtro = document.getElementById('subOtroServicio');
  if(tipoServicio && subOtro){
    tipoServicio.addEventListener('change', function(){
      var esOtro = tipoServicio.value === 'Otros';
      subOtro.classList.toggle('abierto', esOtro);
      subOtro.querySelector('input').required = esOtro;
      if(!esOtro) subOtro.querySelector('input').value = '';
    });
  }

  // ---------- Campo "Nombre de la entidad" cuando no es directo con el propietario ----------
  var entidad = document.getElementById('entidad');
  var subEntidad = document.getElementById('subNombreEntidad');
  if(entidad && subEntidad){
    entidad.addEventListener('change', function(){
      var necesita = ['Inmobiliaria','Aseguradora','Entidad de crédito'].indexOf(entidad.value) !== -1;
      subEntidad.classList.toggle('abierto', necesita);
      subEntidad.querySelector('input').required = necesita;
      if(!necesita) subEntidad.querySelector('input').value = '';
    });
  }

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

  /* ============================================================
     Calculadora de valor estimado (réplica de la de cotizacion.html)
     aplicada sobre el campo de texto libre "Valor de arriendo o
     crédito" y el selector "¿Con quién solicita el servicio?"
     ============================================================ */
  var PRECIOS_FIJOS = {
    'menos1': {propietario:180000, inmobiliaria:200000, aseguradora:240000},
    '1-1.5':  {propietario:200000, inmobiliaria:240000, aseguradora:280000},
    '1.5-2':  {propietario:260000, inmobiliaria:300000, aseguradora:340000},
    '2-2.5':  {propietario:300000, inmobiliaria:360000, aseguradora:400000},
    '2.5-3':  {propietario:460000, inmobiliaria:500000, aseguradora:560000},
    '3-4':    {propietario:500000, inmobiliaria:600000, aseguradora:700000},
    '4-5':    {propietario:600000, inmobiliaria:700000, aseguradora:800000}
  };
  var PORCENTAJE_MAS_DE_5 = {propietario:0.14, inmobiliaria:0.16, aseguradora:0.20};
  // "Entidad de crédito" no tiene tarifa propia definida en el sitio: se calcula como "aseguradora" (nivel más alto) por precaución
  var MAPA_ENTIDAD = {
    'Directamente con el propietario': 'propietario',
    'Inmobiliaria': 'inmobiliaria',
    'Aseguradora': 'aseguradora',
    'Entidad de crédito': 'aseguradora'
  };

  function bracketDeCanon(valor){
    if(valor < 1000000) return 'menos1';
    if(valor < 1500000) return '1-1.5';
    if(valor < 2000000) return '1.5-2';
    if(valor < 2500000) return '2-2.5';
    if(valor < 3000000) return '2.5-3';
    if(valor < 4000000) return '3-4';
    if(valor < 5000000) return '4-5';
    return 'mas5'; // 5 millones en adelante: se calcula por porcentaje
  }

  function formatoCOP(valor){ return '$' + Math.round(valor).toLocaleString('es-CO'); }

  function calcularEstimado(valorTexto, entidadTexto, tipoServicioTexto){
    var soloNumeros = (valorTexto || '').replace(/[^\d]/g, '');
    var valor = parseInt(soloNumeros, 10);
    if(!valor || valor <= 0) return null;
    var tier = MAPA_ENTIDAD[entidadTexto] || 'propietario';
    var bracket = bracketDeCanon(valor);
    var precio = bracket === 'mas5' ? valor * PORCENTAJE_MAS_DE_5[tier] : PRECIOS_FIJOS[bracket][tier];
    // Tomador y fiador = 2 personas, por eso se duplica el valor del servicio (misma regla que en cotizacion.js)
    if(tipoServicioTexto === 'Tomador y fiador') precio = precio * 2;
    return formatoCOP(precio);
  }

  /* ============================================================
     Construye el texto de autorespuesta que FormSubmit enviará
     automáticamente al correo del solicitante (_autoresponse solo
     admite texto plano, por eso el "recuadro" se simula con líneas).
     ============================================================ */
  function construirAutoresponse(form){
    var v = function(name){
      var el = form.querySelector('[name="' + name + '"]');
      return el ? (el.value || '').trim() : '';
    };
    var nombre = v('Nombre y apellidos');
    var tipoDoc = v('Tipo de documento');
    var numDoc = v('Número de documento');
    var edad = v('Edad');
    var correo = v('Correo electrónico');
    var telefono = v('Número de teléfono');
    var ciudadServicio = v('Ciudad donde solicita el servicio');
    var tipoServicioVal = v('Tipo de servicio');
    var valorServicio = v('Valor de arriendo o crédito');
    var direccion = v('Dirección del inmueble');
    var entidadVal = v('Entidad donde solicita el servicio');
    var observaciones = v('Observaciones');

    var estimado = calcularEstimado(valorServicio, entidadVal, tipoServicioVal);

    var lineas = [];
    lineas.push('Hola ' + (nombre || '') + ', gracias por solicitar tu servicio con fiador.com.');
    lineas.push('');
    lineas.push('===================================');
    lineas.push('  EJEMPLO DE COTIZACIÓN ESTIMADA');
    lineas.push('===================================');
    lineas.push('Ciudad: ' + (ciudadServicio || '-'));
    lineas.push('Tipo de servicio: ' + (tipoServicioVal || '-'));
    lineas.push('Con quién solicita el servicio: ' + (entidadVal || '-'));
    lineas.push('Valor de arriendo o crédito indicado: ' + (valorServicio || '-'));
    lineas.push('Dirección del inmueble: ' + (direccion || '-'));
    lineas.push('-----------------------------------');
    lineas.push('VALOR ESTIMADO DEL SERVICIO: ' + (estimado || 'Por confirmar con un asesor'));
    lineas.push('===================================');
    lineas.push('');
    if(tipoServicioVal === 'Tomador y fiador'){
      lineas.push('Este valor incluye el costo de dos personas: una como titular o tomador del contrato, y otra como fiador con finca raíz.');
      lineas.push('');
    }
    lineas.push('Este es un valor de referencia calculado con la información que indicaste. El valor final puede variar según la revisión de nuestro equipo, y ya incluye la norma de finca raíz y solvencia económica exigida.');
    lineas.push('');
    lineas.push('---- Tus datos registrados ----');
    lineas.push('Nombre: ' + nombre);
    lineas.push('Tipo de documento: ' + tipoDoc);
    lineas.push('Número de documento: ' + numDoc);
    lineas.push('Edad: ' + edad);
    lineas.push('Correo electrónico: ' + correo);
    lineas.push('Teléfono: ' + telefono);
    if(observaciones){
      lineas.push('');
      lineas.push('Observaciones que dejaste: ' + observaciones);
    }
    lineas.push('');
    lineas.push('Un asesor se pondrá en contacto contigo muy pronto. Si tienes dudas, escríbenos por WhatsApp: https://wa.me/573117285089');

    return lineas.join('\n');
  }

  // ---------- Envío del formulario ----------
  var form = document.getElementById('formSolicitud');
  if(!form) return;

  var campoCorreo = document.getElementById('correo');
  var emailEspejo = document.getElementById('emailEspejo');
  if(campoCorreo && emailEspejo){
    campoCorreo.addEventListener('input', function(){ emailEspejo.value = campoCorreo.value; });
  }

  form.addEventListener('submit', function(e){
    if(!form.checkValidity()){
      e.preventDefault();
      form.reportValidity();
      return;
    }

    // Protección anti-spam: honeypot + trampa de tiempo (ver assets/js/base.js)
    if(window.FiadorAntiSpam && !window.FiadorAntiSpam.valido(form)){
      e.preventDefault();
      form.style.display = 'none';
      var conf = document.getElementById('confirmacion');
      if(conf) conf.classList.add('activa');
      setTimeout(function(){ window.location.href = 'index.html'; }, 2500);
      return; // no se envía nada a FormSubmit; a ojos del bot "funcionó"
    }

    // Envío real: se completan los campos ocultos justo antes de que el navegador lo envíe de forma nativa
    // (el autoresponse de FormSubmit no funciona con envíos por AJAX, por eso ya no usamos fetch())
    if(emailEspejo) emailEspejo.value = campoCorreo ? campoCorreo.value : '';
    var autoresponseTexto = document.getElementById('autoresponseTexto');
    if(autoresponseTexto) autoresponseTexto.value = construirAutoresponse(form);

    // Guarda un resumen legible en sessionStorage (solo este navegador, se borra al cerrar la pestaña) para mostrarlo en gracias.html
    try{
      var v2 = function(name){ var el = form.querySelector('[name="' + name + '"]'); return el ? (el.value || '').trim() : ''; };
      var entidadTexto = v2('Entidad donde solicita el servicio');
      var resumen = {
        nombre: v2('Nombre y apellidos'),
        tipoServicio: v2('Tipo de servicio') === 'Otros' ? v2("Detalle 'Otros' servicio") : v2('Tipo de servicio'),
        ciudadServicio: v2('Ciudad donde solicita el servicio'),
        valorServicio: v2('Valor de arriendo o crédito'),
        direccion: v2('Dirección del inmueble'),
        entidad: entidadTexto === 'Directamente con el propietario' ? entidadTexto : (v2('Nombre de la entidad') ? entidadTexto + ' — ' + v2('Nombre de la entidad') : entidadTexto),
        estimado: calcularEstimado(v2('Valor de arriendo o crédito'), entidadTexto, v2('Tipo de servicio'))
      };
      sessionStorage.setItem('fiadorResumenSolicitud', JSON.stringify(resumen));
    }catch(err){ /* si el navegador bloquea sessionStorage, simplemente no se muestra el resumen en gracias.html */ }

    var boton = form.querySelector('.btn-enviar');
    if(boton){ boton.disabled = true; boton.textContent = 'Enviando...'; }
    // sin e.preventDefault(): el formulario se envía de forma normal y FormSubmit redirige a gracias.html
  });

})();
