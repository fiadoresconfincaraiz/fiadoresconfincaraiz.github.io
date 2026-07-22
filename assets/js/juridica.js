/* ============================================================
   juridica.js — Lógica exclusiva de juridica.html
   Requiere que assets/js/base.js se cargue antes.
   ============================================================ */
(function(){
  'use strict';

  // ---------- Video: reproducir solo al hacer click (mejor rendimiento) ----------
  (function(){
    var boton = document.getElementById('hvPlay');
    var contenedor = document.getElementById('heroVideo');
    if(!boton || !contenedor) return;
    boton.addEventListener('click', function(){
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/ZBhMGke3qdU?autoplay=1&rel=0';
      iframe.title = 'Video: respaldo legal de fiador.com';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      contenedor.innerHTML = '';
      contenedor.appendChild(iframe);
    });
  })();

  // ---------- Modal de documentos (Cámara de Comercio / RUT) ----------
  (function(){
    var modal = document.getElementById('modalPdf');
    var iframe = document.getElementById('modalPdfIframe');
    var titulo = document.getElementById('modalPdfTitulo');
    var cerrar = document.getElementById('modalPdfCerrar');
    var btnCamara = document.getElementById('btnVerCamara');
    var btnRut = document.getElementById('btnVerRut');
    if(!modal || !iframe) return;

    function abrir(rutaPdf, tituloDoc){
      titulo.textContent = tituloDoc;
      // #toolbar=0&navpanes=0 oculta la barra de herramientas del visor de PDF integrado del navegador
      // (funciona en Chrome/Edge; no es una protección absoluta contra descarga, solo la desalienta)
      iframe.src = rutaPdf + '#toolbar=0&navpanes=0';
      modal.classList.add('abierto');
      document.body.style.overflow = 'hidden';
    }
    function cerrarModal(){
      modal.classList.remove('abierto');
      iframe.src = '';
      document.body.style.overflow = '';
    }

    if(btnCamara) btnCamara.addEventListener('click', function(){ abrir('assets/docs/camara-comercio.pdf', 'Certificado de Cámara de Comercio'); });
    if(btnRut) btnRut.addEventListener('click', function(){ abrir('assets/docs/rut.pdf', 'RUT — DIAN'); });
    if(cerrar) cerrar.addEventListener('click', cerrarModal);
    modal.addEventListener('click', function(e){ if(e.target === modal) cerrarModal(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && modal.classList.contains('abierto')) cerrarModal(); });
  })();

})();
