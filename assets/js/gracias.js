/* ============================================================
   gracias.js — Lógica exclusiva de gracias.html
   Requiere que assets/js/base.js se cargue antes.
   ============================================================ */
(function(){
  'use strict';

  // ---------- Resumen de la solicitud (leído de sessionStorage, guardado por solicitud.js) ----------
  (function(){
    var contenedor = document.getElementById('resumenSolicitud');
    var grid = document.getElementById('resumenGrid');
    if(!contenedor || !grid) return;

    var crudo;
    try{ crudo = sessionStorage.getItem('fiadorResumenSolicitud'); }catch(err){ crudo = null; }
    if(!crudo) return; // el visitante llegó aquí sin pasar por el formulario (o limpió su navegador): no mostramos el resumen

    var datos;
    try{ datos = JSON.parse(crudo); }catch(err){ return; }

    // Saludo personalizado ("Hola <nombre>") debajo de "¡Solicitud enviada!"
    var saludo = document.getElementById('saludoNombre');
    if(saludo && datos.nombre){
      var primerNombre = datos.nombre.trim().split(/\s+/)[0];
      saludo.textContent = '¡Hola, ' + primerNombre + '!';
      saludo.hidden = false;
    }

    function agregarDato(etiqueta, valor, destacado){
      if(!valor) return;
      var div = document.createElement('div');
      div.className = 'dato' + (destacado ? ' destacado' : '');
      var s1 = document.createElement('span'); s1.textContent = etiqueta;
      var s2 = document.createElement('span'); s2.textContent = valor;
      div.appendChild(s1); div.appendChild(s2);
      grid.appendChild(div);
    }

    agregarDato('Nombre', datos.nombre);
    agregarDato('Tipo de servicio', datos.tipoServicio);
    agregarDato('Ciudad', datos.ciudadServicio);
    agregarDato('Valor indicado', datos.valorServicio);
    agregarDato('Dirección del inmueble', datos.direccion);
    agregarDato('Con quién solicita el servicio', datos.entidad);
    agregarDato('Valor estimado del servicio', datos.estimado, true);

    if(grid.children.length){
      contenedor.hidden = false;
    }

    // Se limpia después de mostrarlo para no dejar datos personales acumulados en el navegador
    try{ sessionStorage.removeItem('fiadorResumenSolicitud'); }catch(err){}
  })();

  // ---------- Copiar la llave de pago ----------
  (function(){
    var btn = document.getElementById('btnCopiarLlave');
    var llave = document.getElementById('llaveValor');
    if(!btn || !llave) return;
    btn.addEventListener('click', function(){
      var texto = llave.textContent.trim();
      function marcarCopiado(){
        var original = btn.textContent;
        btn.textContent = '¡Copiada!';
        btn.classList.add('copiado');
        setTimeout(function(){ btn.textContent = original; btn.classList.remove('copiado'); }, 2000);
      }
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(texto).then(marcarCopiado).catch(function(){});
      } else {
        var temp = document.createElement('textarea');
        temp.value = texto; temp.style.position = 'fixed'; temp.style.opacity = '0';
        document.body.appendChild(temp); temp.select();
        try{ document.execCommand('copy'); marcarCopiado(); }catch(err){}
        document.body.removeChild(temp);
      }
    });
  })();

})();
