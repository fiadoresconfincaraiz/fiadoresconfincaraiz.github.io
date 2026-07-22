/* ============================================================
   landing.js — Lógica exclusiva de landing.html
   Requiere que assets/js/base.js se cargue antes.
   ============================================================ */
(function(){
  'use strict';

  // ---------- Video del hero: activar sonido (el video ya autoreproduce silenciado desde que carga la página) ----------
  (function(){
    var boton = document.getElementById('hvSonido');
    var iframe = document.getElementById('heroVideoIframe');
    if(!boton || !iframe) return;
    var activado = false;
    boton.addEventListener('click', function(){
      activado = !activado;
      var comando = activado ? 'unMute' : 'mute';
      try{
        iframe.contentWindow.postMessage(JSON.stringify({event:'command', func:comando, args:[]}), '*');
        if(activado) iframe.contentWindow.postMessage(JSON.stringify({event:'command', func:'setVolume', args:[100]}), '*');
      }catch(err){}
      boton.textContent = activado ? '🔇 Silenciar' : '🔊 Activar sonido';
      boton.classList.toggle('activo', activado);
    });
  })();

  // ---------- Acordeón FAQ ----------
  document.querySelectorAll('.faq-item').forEach(function(item){
    var btn = item.querySelector('.faq-pregunta');
    var resp = item.querySelector('.faq-respuesta');
    if(!btn || !resp) return;
    btn.addEventListener('click', function(){
      var abierto = item.classList.contains('abierto');
      document.querySelectorAll('.faq-item.abierto').forEach(function(o){
        o.classList.remove('abierto');
        o.querySelector('.faq-respuesta').style.maxHeight = null;
      });
      if(!abierto){
        item.classList.add('abierto');
        resp.style.maxHeight = resp.scrollHeight + 'px';
      }
    });
  });

  // ---------- Selector de ciudad (landing regionalizada dinámica) ----------
  var FIADORES_POR_CIUDAD = {
    'Bogotá':27, 'Medellín':23, 'Cali':16, 'Barranquilla':8,
    'Bucaramanga':12, 'Pereira':12, 'Cartagena':8, 'Manizales':10,
    'Neiva':9, 'Ibagué':9, 'Melgar':6, 'Cúcuta':11
  };
  var chips = document.querySelectorAll('.chip-ciudad');
  var tituloCiudad = document.getElementById('tituloCiudad');
  var statFiadores = document.getElementById('statFiadores');
  var ctaWhatsappHero = document.getElementById('ctaWhatsappHero');
  if(chips.length && tituloCiudad && statFiadores && ctaWhatsappHero){
    chips.forEach(function(chip){
      chip.addEventListener('click', function(){
        var yaActivo = chip.classList.contains('activo');
        chips.forEach(function(c){ c.classList.remove('activo'); });

        if(yaActivo){
          tituloCiudad.textContent = '';
          statFiadores.textContent = '120+';
          ctaWhatsappHero.href = 'https://wa.me/573117285089?text=' + encodeURIComponent('Hola, necesito un fiador con finca raíz urgente');
          return;
        }

        chip.classList.add('activo');
        var ciudad = chip.getAttribute('data-ciudad');
        tituloCiudad.textContent = 'en ' + ciudad + ' ';
        statFiadores.textContent = (FIADORES_POR_CIUDAD[ciudad] || '120') + '+';
        ctaWhatsappHero.href = 'https://wa.me/573117285089?text=' + encodeURIComponent('Hola, necesito un fiador con finca raíz urgente en ' + ciudad);
      });
    });
  }

  /* ============================================================
     Ciudades flotantes — misma física de "globos en un cuarto" del index.
     Aquí los chips SIGUEN siendo el selector funcional de ciudad:
     la animación se pausa apenas el mouse entra al contenedor, para
     que se pueda hacer clic con precisión, y continúa al salir.
     ============================================================ */
  (function(){
    var contenedor = document.getElementById('chipsCiudad');
    if(!contenedor) return;
    var prefiereMenosMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(prefiereMenosMovimiento) return; // se queda en la cuadrícula estática (ver CSS)

    var pills = Array.prototype.slice.call(contenedor.querySelectorAll('.chip-ciudad'));
    if(!pills.length) return;

    var cuerpos = [];
    var activo = false;
    var enPausa = false;
    var idFrame = null;

    function iniciarCuerpos(){
      var anchoContenedor = contenedor.clientWidth;
      var altoContenedor = contenedor.clientHeight;
      cuerpos = pills.map(function(pill){
        var w = pill.offsetWidth, h = pill.offsetHeight;
        return {
          el: pill, w: w, h: h,
          x: Math.random() * Math.max(1, anchoContenedor - w),
          y: Math.random() * Math.max(1, altoContenedor - h),
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          giro: (Math.random() - 0.5) * 5
        };
      });
      cuerpos.forEach(function(c){
        if(Math.abs(c.vx) < 0.13) c.vx = c.vx < 0 ? -0.22 : 0.22;
        if(Math.abs(c.vy) < 0.13) c.vy = c.vy < 0 ? -0.22 : 0.22;
      });
    }

    function paso(){
      var anchoContenedor = contenedor.clientWidth;
      var altoContenedor = contenedor.clientHeight;

      cuerpos.forEach(function(c){
        c.x += c.vx;
        c.y += c.vy;
        if(c.x <= 0){ c.x = 0; c.vx = Math.abs(c.vx); }
        if(c.x + c.w >= anchoContenedor){ c.x = anchoContenedor - c.w; c.vx = -Math.abs(c.vx); }
        if(c.y <= 0){ c.y = 0; c.vy = Math.abs(c.vy); }
        if(c.y + c.h >= altoContenedor){ c.y = altoContenedor - c.h; c.vy = -Math.abs(c.vy); }
      });

      for(var i = 0; i < cuerpos.length; i++){
        for(var j = i + 1; j < cuerpos.length; j++){
          var a = cuerpos[i], b = cuerpos[j];
          var solapaX = a.x < b.x + b.w && a.x + a.w > b.x;
          var solapaY = a.y < b.y + b.h && a.y + a.h > b.y;
          if(solapaX && solapaY){
            var penX = Math.min(a.x + a.w - b.x, b.x + b.w - a.x);
            var penY = Math.min(a.y + a.h - b.y, b.y + b.h - a.y);
            if(penX < penY){
              var mediaX = penX / 2;
              if(a.x < b.x){ a.x -= mediaX; b.x += mediaX; } else { a.x += mediaX; b.x -= mediaX; }
              var tempVx = a.vx; a.vx = b.vx; b.vx = tempVx;
            } else {
              var mediaY = penY / 2;
              if(a.y < b.y){ a.y -= mediaY; b.y += mediaY; } else { a.y += mediaY; b.y -= mediaY; }
              var tempVy = a.vy; a.vy = b.vy; b.vy = tempVy;
            }
            a.el.classList.add('chocando'); b.el.classList.add('chocando');
            setTimeout(function(el1, el2){ return function(){ el1.classList.remove('chocando'); el2.classList.remove('chocando'); }; }(a.el, b.el), 250);
          }
        }
      }

      cuerpos.forEach(function(c){
        c.el.style.transform = 'translate3d(' + c.x.toFixed(1) + 'px,' + c.y.toFixed(1) + 'px,0) rotate(' + (Math.sin(Date.now()/1400 + c.x) * c.giro).toFixed(2) + 'deg)';
      });

      idFrame = requestAnimationFrame(paso);
    }

    function activar(){
      if(activo) return;
      activo = true;
      contenedor.classList.add('flotando');
      iniciarCuerpos();
      idFrame = requestAnimationFrame(paso);
    }
    function pausar(){
      if(idFrame) cancelAnimationFrame(idFrame);
      idFrame = null;
    }

    contenedor.addEventListener('mouseenter', function(){ enPausa = true; pausar(); });
    contenedor.addEventListener('mouseleave', function(){ enPausa = false; if(activo){ idFrame = requestAnimationFrame(paso); } });

    if('IntersectionObserver' in window){
      var obsCiudades = new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if(e.isIntersecting) activar(); });
      }, {threshold:.2});
      obsCiudades.observe(contenedor);
    } else {
      activar();
    }
    document.addEventListener('visibilitychange', function(){
      if(document.hidden){ pausar(); } else if(activo && !enPausa){ idFrame = requestAnimationFrame(paso); }
    });
    window.addEventListener('resize', function(){ if(activo) iniciarCuerpos(); });
  })();

  window.FiadorCarrusel.activar('viewportPasosLanding', 28);
  window.FiadorCarrusel.activar('viewportTestis', 32);

})();
