/* ============================================================
   base.js — Lógica compartida por TODAS las páginas de fiador.com
   (menú móvil, animaciones reveal, barra de progreso, header
   compacto y utilidades anti-spam para formularios).
   Se carga como archivo externo con la etiqueta script + defer.
   ============================================================ */
(function(){
  'use strict';

  // ---------- Menú móvil ----------
  var hambBtn = document.getElementById('hambBtn');
  var navLinks = document.getElementById('navLinks');
  if(hambBtn && navLinks){
    hambBtn.addEventListener('click', function(){
      var abierto = navLinks.classList.toggle('abierto');
      hambBtn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ navLinks.classList.remove('abierto'); });
    });
  }

  // ---------- Animaciones al hacer scroll (reveal) ----------
  (function(){
    var elementos = document.querySelectorAll('.reveal, .reveal-izq, .reveal-der, .reveal-escala, .reveal-arriba, .reveal-abajo, .reveal-pop, .reveal-sube-crece, .reveal-giro, .reveal-octagono');
    if(!elementos.length) return;
    if(!('IntersectionObserver' in window)){
      elementos.forEach(function(el){ el.classList.add('visible'); });
      return;
    }
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, {threshold:.15, rootMargin:'0px 0px -60px 0px'});
    elementos.forEach(function(el){ obs.observe(el); });
  })();

  // ---------- Barra de progreso de lectura (throttleada con rAF) ----------
  (function(){
    var barra = document.getElementById('barraProgreso');
    if(!barra) return;
    var pendiente = false;
    function actualizar(){
      var alto = document.documentElement.scrollHeight - window.innerHeight;
      var pct = alto > 0 ? (window.scrollY / alto) * 100 : 0;
      barra.style.width = pct + '%';
      pendiente = false;
    }
    window.addEventListener('scroll', function(){
      if(!pendiente){ pendiente = true; requestAnimationFrame(actualizar); }
    }, {passive:true});
    actualizar();
  })();

  // ---------- Header compacto al hacer scroll ----------
  (function(){
    var header = document.querySelector('header');
    var centinela = document.getElementById('centinelaHeader');
    if(!header || !centinela || !('IntersectionObserver' in window)) return;
    var obs = new IntersectionObserver(function(entries){
      header.classList.toggle('compacto', !entries[0].isIntersecting);
    }, {threshold:0});
    obs.observe(centinela);
  })();

  // ---------- Resaltado del enlace activo en el menú (solo si hay secciones con id) ----------
  (function(){
    var enlaces = document.querySelectorAll('.nav-links a[href^="#"]');
    if(!enlaces.length || !('IntersectionObserver' in window)) return;
    var secciones = Array.prototype.map.call(enlaces, function(a){
      return document.querySelector(a.getAttribute('href'));
    }).filter(Boolean);
    if(!secciones.length) return;
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var idx = secciones.indexOf(entry.target);
        if(idx === -1) return;
        if(entry.isIntersecting){
          enlaces.forEach(function(a){ a.classList.remove('activo'); });
          enlaces[idx].classList.add('activo');
        }
      });
    }, {threshold:.5, rootMargin:'-30% 0px -50% 0px'});
    secciones.forEach(function(s){ obs.observe(s); });
  })();

  // ---------- Año automático en el footer ----------
  var elAnio = document.getElementById('anio');
  if(elAnio) elAnio.textContent = new Date().getFullYear();

  /* ============================================================
     Protección anti-spam para formularios (FormSubmit)
     - Honeypot: campo oculto que solo un bot llenaría.
     - Trampa de tiempo: si el formulario se envía en menos de
       3 segundos desde que cargó la página, es casi seguro un bot.
     Se expone como window.FiadorAntiSpam para usarlo en cada
     página que tenga un formulario (cotizacion.html, solicitud.html).
     ============================================================ */
  window.FiadorAntiSpam = {
    cargaEn: Date.now(),
    valido: function(form){
      var honeypot = form.querySelector('input[name="_gotcha"]');
      if(honeypot && honeypot.value){ return false; } // un bot llenó el campo oculto
      var segundos = (Date.now() - this.cargaEn) / 1000;
      if(segundos < 3){ return false; } // envío demasiado rápido para ser humano
      return true;
    }
  };

  /* ---------- Submenú "Más" del menú principal ---------- */
  (function(){
    var boton = document.getElementById('navMasBtn');
    if(!boton) return;
    var contenedor = boton.closest('.nav-dropdown');
    boton.addEventListener('click', function(e){
      e.stopPropagation();
      contenedor.classList.toggle('abierto');
      boton.setAttribute('aria-expanded', contenedor.classList.contains('abierto'));
    });
    document.addEventListener('click', function(e){
      if(!contenedor.contains(e.target)){ contenedor.classList.remove('abierto'); boton.setAttribute('aria-expanded','false'); }
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){ contenedor.classList.remove('abierto'); boton.setAttribute('aria-expanded','false'); }
    });
  })();

  /* ============================================================
     Carrusel continuo compartido: duplica las tarjetas y las hace
     "pasar" en bucle infinito, solo en tablet/escritorio (≥768px)
     y solo si la persona no pidió reducir el movimiento.
     ============================================================ */
  window.FiadorCarrusel = {
    activar: function(idViewport, velocidadSeg){
      var viewport = document.getElementById(idViewport);
      if(!viewport) return;
      var pista = viewport.querySelector('.pista-carrusel');
      if(!pista) return;

      function activarSiCorresponde(){
        var anchoValido = window.matchMedia('(min-width:768px)').matches;
        var menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if(anchoValido && !menosMovimiento){
          if(!viewport.classList.contains('activo')){
            if(!viewport.dataset.duplicado){
              var original = Array.prototype.slice.call(pista.children);
              original.forEach(function(el){ pista.appendChild(el.cloneNode(true)); });
              viewport.dataset.duplicado = '1';
            }
            pista.style.animationDuration = velocidadSeg + 's';
            viewport.classList.add('activo');
          }
        } else {
          viewport.classList.remove('activo');
        }
      }
      activarSiCorresponde();
      window.addEventListener('resize', activarSiCorresponde);
    }
  };

})();
