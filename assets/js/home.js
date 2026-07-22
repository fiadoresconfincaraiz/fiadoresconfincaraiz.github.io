/* ============================================================
   home.js — Lógica exclusiva de la página de inicio (index.html)
   Requiere que assets/js/base.js se cargue antes.
   ============================================================ */
(function(){
  'use strict';

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

  // ---------- Video de fondo del hero (carga inteligente) ----------
  (function(){
    var contenedor = document.getElementById('heroVideoFondo');
    var video = document.getElementById('heroBgVideo');
    if(!contenedor || !video) return;

    var prefiereMenosMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var conexion = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
    var conexionLenta = conexion && (conexion.saveData || /^(slow-2g|2g|3g)$/.test(conexion.effectiveType || ''));

    // En modo "reducir movimiento" o datos limitados, nos quedamos con el degradado azul de respaldo (ya definido en .hero)
    if(prefiereMenosMovimiento || conexionLenta){
      contenedor.remove();
      return;
    }

    var cargado = false;
    function cargarYReproducir(){
      if(cargado) return;
      cargado = true;
      video.setAttribute('preload', 'auto');
      video.load();
      video.play().catch(function(){ /* el navegador bloqueó el autoplay; se queda el póster */ });
    }

    if('IntersectionObserver' in window){
      var obsVideo = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){ cargarYReproducir(); }
          else if(cargado){ video.pause(); }
        });
      }, {threshold:.15});
      obsVideo.observe(contenedor);
    } else {
      cargarYReproducir();
    }

    document.addEventListener('visibilitychange', function(){
      if(!cargado) return;
      if(document.hidden){ video.pause(); } else { video.play().catch(function(){}); }
    });

    // Si el archivo de video no existe o falla, no dejamos un recuadro roto: se retira y queda el degradado
    video.addEventListener('error', function(){ contenedor.remove(); });
  })();


  (function(){
    var boton = document.getElementById('hvPlay');
    var cont = document.getElementById('heroVideo');
    var thumb = document.getElementById('hvThumb');
    if(!boton) return;
    if(thumb){
      thumb.addEventListener('error', function(){
        thumb.src = 'https://img.youtube.com/vi/HVbiCyZa16s/hqdefault.jpg';
      }, {once:true});
    }
    boton.addEventListener('click', function(){
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/HVbiCyZa16s?autoplay=1&rel=0&playsinline=1';
      iframe.title = 'Cómo funciona el servicio de fiador';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      while(cont.firstChild){ cont.removeChild(cont.firstChild); }
      cont.appendChild(iframe);
    });
  })();

  // ---------- Contador animado de las cifras del hero ----------
  (function(){
    var nums = document.querySelectorAll('[data-contador]');
    if(!nums.length) return;
    var animado = false;
    function animar(){
      if(animado) return;
      animado = true;
      nums.forEach(function(el){
        var meta = parseInt(el.getAttribute('data-contador'), 10);
        var sufijo = el.getAttribute('data-sufijo') || '';
        var actual = 0;
        var pasos = 30;
        var incremento = meta / pasos;
        var iv = setInterval(function(){
          actual += incremento;
          if(actual >= meta){ actual = meta; clearInterval(iv); }
          el.textContent = Math.round(actual) + sufijo;
        }, 35);
      });
    }
    if(!('IntersectionObserver' in window)){ animar(); return; }
    var obsHero = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting) animar(); });
    }, {threshold:.4});
    var trust = document.querySelector('.hero-trust');
    if(trust) obsHero.observe(trust);
  })();

  // ---------- Parallax sutil del video del hero ----------
  (function(){
    var cont = document.getElementById('heroParallax');
    if(!cont) return;
    var pendiente = false;
    function mover(){
      var y = Math.min(window.scrollY, 400);
      cont.style.transform = 'translateY(' + (y * 0.06) + 'px)';
      pendiente = false;
    }
    window.addEventListener('scroll', function(){
      if(!pendiente){ pendiente = true; requestAnimationFrame(mover); }
    }, {passive:true});
  })();

  // ---------- Carrusel genérico (testimonios y fiadores) ----------
  function iniciarCarrusel(idPista, claseTarjeta, idPrev, idNext, intervaloMs){
    var pista = document.getElementById(idPista);
    var tarjetas = pista ? pista.querySelectorAll(claseTarjeta) : [];
    var btnPrev = document.getElementById(idPrev);
    var btnNext = document.getElementById(idNext);
    if(!tarjetas.length || !btnPrev || !btnNext) return;
    var pos = 0;
    var auto = null;
    function porVista(){
      var w = window.innerWidth;
      if(w <= 700) return 1;
      if(w <= 960) return 2;
      return 3;
    }
    function mover(){
      var visibles = porVista();
      var maximo = Math.max(0, tarjetas.length - visibles);
      if(pos > maximo) pos = maximo;
      var pct = (100 / visibles) * pos;
      pista.style.transform = 'translateX(-' + pct + '%)';
    }
    function siguiente(){
      var visibles = porVista();
      var maximo = Math.max(0, tarjetas.length - visibles);
      pos = pos >= maximo ? 0 : pos + 1;
      mover();
    }
    function anterior(){
      var visibles = porVista();
      var maximo = Math.max(0, tarjetas.length - visibles);
      pos = pos <= 0 ? maximo : pos - 1;
      mover();
    }
    function iniciarAuto(){
      detenerAuto();
      auto = setInterval(siguiente, intervaloMs);
    }
    function detenerAuto(){ if(auto){ clearInterval(auto); auto = null; } }

    btnNext.addEventListener('click', function(){ siguiente(); iniciarAuto(); });
    btnPrev.addEventListener('click', function(){ anterior(); iniciarAuto(); });
    window.addEventListener('resize', mover);
    // Pausa el auto-avance si el usuario tiene el cursor encima (evita saltos molestos al leer)
    pista.addEventListener('mouseenter', detenerAuto);
    pista.addEventListener('mouseleave', iniciarAuto);
    iniciarAuto();
  }

  // ---------- Respaldo visual si una foto no carga ----------
  document.querySelectorAll('.avatar-foto img.foto-testimonio').forEach(function(img){
    img.addEventListener('error', function(){
      var inicial = img.getAttribute('data-inicial') || '';
      var circulo = document.createElement('div');
      circulo.className = 'avatar';
      circulo.textContent = inicial;
      img.closest('.avatar-foto').replaceWith(circulo);
    }, {once:true});
  });
  document.querySelectorAll('.card-fiador img').forEach(function(img){
    img.addEventListener('error', function(){
      img.closest('.card-fiador').style.background = 'var(--azul-brillante)';
      img.style.display = 'none';
    }, {once:true});
  });

  iniciarCarrusel('tcPista', '.card-testi', 'tcPrev', 'tcNext', 5000);

  /* ============================================================
     Coverflow 3D — "Fiadores con los que contamos"
     Las tarjetas se acomodan como una caja en 3D: la del centro
     de frente y grande, las demás rotadas hacia los costados según
     su distancia, con profundidad (translateZ) y desvanecido.
     ============================================================ */
  (function(){
    var pista = document.getElementById('fcPista');
    var tarjetas = pista ? Array.prototype.slice.call(pista.querySelectorAll('.card-fiador')) : [];
    var btnPrev = document.getElementById('fcPrev');
    var btnNext = document.getElementById('fcNext');
    if(!tarjetas.length || !btnPrev || !btnNext) return;

    var centro = 0;
    var auto = null;
    var prefiereMenosMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function distanciaCircular(i, c, total){
      var d = i - c;
      if(d > total / 2) d -= total;
      if(d < -total / 2) d += total;
      return d;
    }

    function pintar(){
      var total = tarjetas.length;
      tarjetas.forEach(function(card, i){
        var d = distanciaCircular(i, centro, total);
        var abs = Math.abs(d);
        var x, z, ry, escala, opacidad, zi;

        if(abs === 0){ x = 0; z = 0; ry = 0; escala = 1; opacidad = 1; zi = 10; }
        else if(abs === 1){ x = d * 165; z = -120; ry = d * -38; escala = .82; opacidad = .9; zi = 6; }
        else if(abs === 2){ x = d * 205; z = -260; ry = d * -46; escala = .66; opacidad = .55; zi = 4; }
        else { x = d * 220; z = -380; ry = d * -50; escala = .5; opacidad = 0; zi = 1; }

        card.style.transform = 'translateX(' + x + 'px) translateZ(' + z + 'px) rotateY(' + ry + 'deg) scale(' + escala + ')';
        card.style.opacity = opacidad;
        card.style.zIndex = zi;
        card.style.pointerEvents = abs > 2 ? 'none' : 'auto';
      });
    }

    function siguiente(){ centro = (centro + 1) % tarjetas.length; pintar(); }
    function anterior(){ centro = (centro - 1 + tarjetas.length) % tarjetas.length; pintar(); }
    function iniciarAuto(){ detenerAuto(); if(!prefiereMenosMovimiento) auto = setInterval(siguiente, 3200); }
    function detenerAuto(){ if(auto){ clearInterval(auto); auto = null; } }

    btnNext.addEventListener('click', function(){ siguiente(); iniciarAuto(); });
    btnPrev.addEventListener('click', function(){ anterior(); iniciarAuto(); });
    tarjetas.forEach(function(card, i){
      card.addEventListener('click', function(){ centro = i; pintar(); iniciarAuto(); });
    });
    pista.addEventListener('mouseenter', detenerAuto);
    pista.addEventListener('mouseleave', iniciarAuto);
    window.addEventListener('resize', pintar);

    pintar();
    iniciarAuto();
  })();

  /* ============================================================
     Ciudades flotantes — física de "globos en un cuarto"
     Cada píldora flota con velocidad propia, rebota en los bordes
     del contenedor y choca elásticamente con las demás, sin parar.
     ============================================================ */
  (function(){
    var contenedor = document.getElementById('ciudadesFlotantes');
    if(!contenedor) return;
    var prefiereMenosMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(prefiereMenosMovimiento) return; // se queda en la grilla estática (ver CSS)

    var pills = Array.prototype.slice.call(contenedor.querySelectorAll('.ciudad-pill'));
    if(!pills.length) return;

    var cuerpos = [];
    var activo = false;
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
          vx: (Math.random() - 0.5) * 0.7,
          vy: (Math.random() - 0.5) * 0.7,
          giro: (Math.random() - 0.5) * 6
        };
      });
      // Evita velocidades casi nulas (que se "estrellen" y se mantengan en movimiento)
      cuerpos.forEach(function(c){
        if(Math.abs(c.vx) < 0.15) c.vx = c.vx < 0 ? -0.25 : 0.25;
        if(Math.abs(c.vy) < 0.15) c.vy = c.vy < 0 ? -0.25 : 0.25;
      });
    }

    function paso(){
      var anchoContenedor = contenedor.clientWidth;
      var altoContenedor = contenedor.clientHeight;

      // Mover y rebotar en los bordes del "cuarto"
      cuerpos.forEach(function(c){
        c.x += c.vx;
        c.y += c.vy;
        if(c.x <= 0){ c.x = 0; c.vx = Math.abs(c.vx); }
        if(c.x + c.w >= anchoContenedor){ c.x = anchoContenedor - c.w; c.vx = -Math.abs(c.vx); }
        if(c.y <= 0){ c.y = 0; c.vy = Math.abs(c.vy); }
        if(c.y + c.h >= altoContenedor){ c.y = altoContenedor - c.h; c.vy = -Math.abs(c.vy); }
      });

      // Colisiones elásticas simples entre globos (AABB)
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

      // Pintar (translate3d para acelerar por GPU) + leve giro tipo globo
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

    // Solo empieza a flotar cuando la sección entra en pantalla; se pausa si la pestaña no está visible (ahorra batería)
    if('IntersectionObserver' in window){
      var obsCiudades = new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if(e.isIntersecting) activar(); });
      }, {threshold:.2});
      obsCiudades.observe(contenedor);
    } else {
      activar();
    }
    document.addEventListener('visibilitychange', function(){
      if(document.hidden){ pausar(); } else if(activo){ idFrame = requestAnimationFrame(paso); }
    });
    window.addEventListener('resize', function(){ if(activo) iniciarCuerpos(); });
  })();

  window.FiadorCarrusel.activar('viewportServicios', 26);
  window.FiadorCarrusel.activar('viewportPasos', 30);

})();
