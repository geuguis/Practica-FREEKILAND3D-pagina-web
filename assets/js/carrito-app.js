(() => {
  'use strict';

  const _base = document.querySelector('base')?.getAttribute('href') ?? '/';

  const STORAGE_KEY = 'freekiland_carrito_v2';
  const EMAIL_NEGOCIO = 'info@freekiland3d.com';

  const WEB3FORMS_KEY = '';

  /* ---------------- UTIL ---------------- */
  const esc = (str) => String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const sanitizeImagen = (url) => {
    if (!url || typeof url !== 'string') return '';
    const low = url.trim().toLowerCase();
    if (low.startsWith('javascript:') || low.startsWith('data:')) return '';
    return url;
  };

  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- TOAST ---------------- */
  const Toast = {
    container: null,
    init() {
      let c = document.getElementById('fk-toast-container');
      if (!c) {
        c = document.createElement('div');
        c.id = 'fk-toast-container';
        c.className = 'fk-toast-container';
        c.setAttribute('role', 'status');
        c.setAttribute('aria-live', 'polite');
        document.body.appendChild(c);
      }
      this.container = c;
    },
    show(message, type = 'info', duration = 3500) {
      if (!this.container) this.init();
      const t = document.createElement('div');
      t.className = `fk-toast fk-toast-${type}`;
      const icon = document.createElement('span');
      icon.className = 'fk-toast-icon';
      icon.textContent = this._icon(type);
      const msg = document.createElement('span');
      msg.className = 'fk-toast-message';
      msg.textContent = message;
      t.append(icon, msg);
      this.container.appendChild(t);
      requestAnimationFrame(() => t.classList.add('fk-toast-visible'));
      setTimeout(() => {
        t.classList.remove('fk-toast-visible');
        setTimeout(() => t.remove(), 350);
      }, duration);
    },
    _icon(type) {
      return ({ success: '✓', error: '✕', info: 'ℹ', warning: '!' })[type] || 'ℹ';
    }
  };

  /* ---------------- CONFIRM ---------------- */
  const Confirm = {
    open(message, { onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar' } = {}) {
      const lastFocus = document.activeElement;
      const overlay = document.createElement('div');
      overlay.className = 'fk-confirm-overlay';
      overlay.innerHTML = `
        <div class="fk-confirm-box" role="dialog" aria-modal="true" aria-label="Confirmación">
          <div class="fk-confirm-msg">${message}</div>
          <div class="fk-confirm-actions">
            <button type="button" class="fk-confirm-cancel"></button>
            <button type="button" class="fk-confirm-ok"></button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('visible'));

      const btnCancel = overlay.querySelector('.fk-confirm-cancel');
      const btnOk = overlay.querySelector('.fk-confirm-ok');
      btnCancel.textContent = cancelText;
      btnOk.textContent = confirmText;

      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        document.removeEventListener('keydown', keyHandler);
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 280);
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
      };

      const keyHandler = e => {
        if (e.key === 'Escape') { onCancel?.(); close(); }
        if (e.key === 'Tab') {
          e.preventDefault();
          (document.activeElement === btnOk ? btnCancel : btnOk).focus();
        }
      };

      btnCancel.addEventListener('click', () => { onCancel?.(); close(); });
      btnOk.addEventListener('click', () => { onConfirm?.(); close(); });
      overlay.addEventListener('click', e => { if (e.target === overlay) { onCancel?.(); close(); } });
      document.addEventListener('keydown', keyHandler);
      btnCancel.focus();
    }
  };

  /* ---------------- CART (estado + persistencia) ---------------- */
  const Cart = {
    items: [],

    load() {
      try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        this.items = (Array.isArray(raw) ? raw : [])
          .filter(i => i && i.id && i.nombre)
          .map(i => ({
            id: String(i.id),
            nombre: String(i.nombre),
            precio: Number(i.precio) || 0,
            imagen: sanitizeImagen(typeof i.imagen === 'string' ? i.imagen : ''),
            cantidad: Math.max(1, parseInt(i.cantidad, 10) || 1)
          }));
      } catch {
        this.items = [];
      }
    },

    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      this.render();
    },

    add(producto) {
      if (!producto || !producto.id || !producto.nombre) return;
      const existing = this.items.find(i => i.id === producto.id);
      if (existing) {
        existing.cantidad = (existing.cantidad || 1) + 1;
      } else {
        this.items.push({
          id: String(producto.id),
          nombre: producto.nombre,
          precio: parseFloat(producto.precio) || 0,
          imagen: sanitizeImagen(producto.imagen || ''),
          cantidad: 1
        });
      }
      this.save();
      Toast.show(`${producto.nombre} añadido al carrito`, 'success');
    },

    increase(id) {
      const i = this.items.find(x => x.id === id);
      if (i) { i.cantidad++; this.save(); }
    },

    decrease(id) {
      const i = this.items.find(x => x.id === id);
      if (!i) return;
      i.cantidad--;
      if (i.cantidad <= 0) this.items = this.items.filter(x => x.id !== id);
      this.save();
    },

    remove(id) {
      const item = this.items.find(x => x.id === id);
      this.items = this.items.filter(x => x.id !== id);
      this.save();
      if (item) Toast.show(`${item.nombre} eliminado`, 'info', 2500);
    },

    clear() {
      this.items = [];
      this.save();
    },

    total() {
      return this.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    },

    count() {
      return this.items.reduce((s, i) => s + i.cantidad, 0);
    },

    render() {
      const lista = document.getElementById('lista-carrito');
      const totalEl = document.getElementById('precio-total');
      const badges = document.querySelectorAll('#contador-carrito, #contador-badge, .contador-carrito');

      if (lista) {
        if (this.items.length === 0) {
          lista.innerHTML = `
            <li class="carrito-vacio">
              <svg class="carrito-vacio-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              <p>Tu carrito está vacío</p>
              <a href="${_base}paginas/galeria.html" class="carrito-vacio-cta">Ver el catálogo</a>
            </li>`;
          this._seen = new Set();
        } else {
          const prev = this._seen;
          lista.innerHTML = this.items.map(i => `
            <li class="item-carrito" data-id="${esc(i.id)}">
              <div class="item-info">
                ${i.imagen ? `<img src="${esc(i.imagen)}" alt="" class="item-img" width="52" height="52" loading="lazy">` : ''}
                <div>
                  <span class="item-nombre">${esc(i.nombre)}</span>
                  <span class="item-precio-unit">${i.precio.toFixed(2)}€ × ${i.cantidad}</span>
                </div>
              </div>
              <div class="item-controles">
                <button type="button" class="qty-btn" data-action="dec" data-id="${esc(i.id)}" aria-label="Restar una unidad de ${esc(i.nombre)}">−</button>
                <span class="qty-num">${i.cantidad}</span>
                <button type="button" class="qty-btn" data-action="inc" data-id="${esc(i.id)}" aria-label="Sumar una unidad de ${esc(i.nombre)}">+</button>
                <button type="button" class="btn-eliminar" data-action="rm" data-id="${esc(i.id)}" aria-label="Eliminar ${esc(i.nombre)}">×</button>
              </div>
            </li>`).join('');

          if (prev && !prefersReducedMotion()) {
            this.items.forEach(i => {
              if (!prev.has(i.id)) {
                const li = lista.querySelector(`.item-carrito[data-id="${CSS.escape(i.id)}"]`);
                if (!li) return;
                li.classList.add('item-entrando');
                li.addEventListener('animationend',
                  () => li.classList.remove('item-entrando'), { once: true });
              }
            });
          }
          this._seen = new Set(this.items.map(i => i.id));
        }
      }

      if (totalEl) totalEl.textContent = this.total().toFixed(2);

      const c = this.count();
      badges.forEach(b => {
        const prev = parseInt(b.textContent, 10) || 0;
        b.textContent = c;
        b.classList.toggle('badge-visible', c > 0);
        if (c > prev) {
          b.classList.add('bump');
          setTimeout(() => b.classList.remove('bump'), 400);
        }
      });
    },

    bind() {
      const lista = document.getElementById('lista-carrito');
      lista?.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const { id, action } = btn.dataset;
        const li = btn.closest('.item-carrito');

        const item = this.items.find(x => x.id === id);
        if (action === 'rm' || (action === 'dec' && item && item.cantidad <= 1)) {
          this._removeAnimated(id, li);
          return;
        }

        if (action === 'inc') this.increase(id);
        else if (action === 'dec') this.decrease(id);

        const again = lista.querySelector(`[data-action="${action}"][data-id="${CSS.escape(id)}"]`);
        (again || document.getElementById('btn-cerrar-carrito'))?.focus();
        this._pulseQty(lista, id);
      });
    },

    _removeAnimated(id, li) {
      if (!li || prefersReducedMotion()) {
        this.remove(id);
        document.getElementById('btn-cerrar-carrito')?.focus();
        return;
      }
      li.style.maxHeight = li.offsetHeight + 'px';
      void li.offsetHeight;
      li.classList.add('item-saliendo');
      requestAnimationFrame(() => { li.style.maxHeight = '0px'; });

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        this.remove(id);
        document.getElementById('btn-cerrar-carrito')?.focus();
      };
      li.addEventListener('transitionend', e => {
        if (e.propertyName === 'max-height') finish();
      });
      setTimeout(finish, 450);
    },

    _pulseQty(lista, id) {
      if (prefersReducedMotion()) return;
      const num = lista.querySelector(`.item-carrito[data-id="${CSS.escape(id)}"] .qty-num`);
      if (!num) return;
      num.classList.remove('qty-pop');
      void num.offsetWidth;
      num.classList.add('qty-pop');
    }
  };

  /* ---------------- CART MODAL (inyectado, compartido por todas las páginas) ---------------- */
  const CartModal = {
    ensure() {
      if (document.getElementById('modal-carrito')) return;
      const wrap = document.createElement('div');
      wrap.id = 'modal-carrito';
      wrap.className = 'modal-carrito';
      wrap.setAttribute('role', 'dialog');
      wrap.setAttribute('aria-modal', 'true');
      wrap.setAttribute('aria-labelledby', 'titulo-carrito-h');
      wrap.innerHTML = `
        <aside class="carrito-contenido">
          <div class="titulo-carrito">
            <span id="titulo-carrito-h">Tu Pedido</span>
            <button id="btn-cerrar-carrito" class="btn-cerrar" aria-label="Cerrar carrito">&times;</button>
          </div>
          <ul id="lista-carrito" class="lista-carrito"></ul>
          <div class="carrito-footer">
            <div class="info-total">
              <span>Total:</span>
              <span><span id="precio-total">0.00</span>€</span>
            </div>
            <div class="acciones-carrito">
              <button id="btn-vaciar" type="button" class="boton-vaciar">Vaciar carrito</button>
              <button type="button" class="boton-checkout">Solicitar pedido</button>
            </div>
          </div>
        </aside>`;
      document.body.appendChild(wrap);
    }
  };

  /* ---------------- CART UI (modal lateral) ---------------- */
  const CartUI = {
    _lastFocus: null,

    _setBackgroundInert(inerte) {
      document.querySelectorAll('main, .header, .footer').forEach(el => { el.inert = inerte; });
    },

    open() {
      this._lastFocus = document.activeElement;
      document.getElementById('modal-carrito')?.classList.add('mostrar');
      document.body.classList.add('no-scroll');
      this._setBackgroundInert(true);
      document.getElementById('btn-cerrar-carrito')?.focus();
    },

    close() {
      document.getElementById('modal-carrito')?.classList.remove('mostrar');
      document.body.classList.remove('no-scroll');
      this._setBackgroundInert(false);
      if (this._lastFocus && document.contains(this._lastFocus)) this._lastFocus.focus();
    },

    bind() {
      const trigger = document.getElementById('enlace-carrito');
      const modal = document.getElementById('modal-carrito');
      const cerrar = document.getElementById('btn-cerrar-carrito');

      trigger?.addEventListener('click', e => { e.preventDefault(); this.open(); });
      cerrar?.addEventListener('click', () => this.close());
      modal?.addEventListener('click', e => { if (e.target === modal) this.close(); });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal?.classList.contains('mostrar')) this.close();
      });

      document.getElementById('btn-vaciar')?.addEventListener('click', () => {
        if (Cart.items.length === 0) {
          Toast.show('El carrito ya está vacío', 'info');
          return;
        }
        Confirm.open('¿Seguro que quieres vaciar el carrito?', {
          confirmText: 'Vaciar',
          cancelText: 'Cancelar',
          onConfirm: () => {
            Cart.clear();
            Toast.show('Carrito vaciado', 'info');
          }
        });
      });

      document.querySelector('.boton-checkout')?.addEventListener('click', () => {
        if (Cart.items.length === 0) {
          Toast.show('Añade productos antes de solicitar el pedido', 'warning');
          return;
        }
        const total = Cart.total().toFixed(2);
        const resumenHtml = Cart.items
          .map(i => `<li>${esc(i.nombre)} × ${i.cantidad}</li>`)
          .join('');
        Confirm.open(
          `Tu pedido (total <strong>${total}€</strong>):<ul class="fk-confirm-lista">${resumenHtml}</ul>Te abrimos el correo con el pedido preparado para enviárnoslo. Te responderemos confirmando disponibilidad, plazo y forma de pago.`,
          {
            confirmText: 'Enviar pedido',
            cancelText: 'Seguir comprando',
            onConfirm: () => {
              const lineas = Cart.items
                .map(i => `- ${i.nombre} × ${i.cantidad} (${(i.precio * i.cantidad).toFixed(2)}€)`)
                .join('\n');
              const body = `Hola Freekiland 3D:\n\nQuiero hacer este pedido:\n${lineas}\n\nTotal: ${total}€\n\nMis datos:\n- Nombre:\n- Teléfono:\n- Recogida en tienda o envío:\n\n¡Gracias!`;
              location.href = `mailto:${EMAIL_NEGOCIO}?subject=${encodeURIComponent('Pedido desde la web')}&body=${encodeURIComponent(body)}`;
              Toast.show('Se abrirá tu correo con el pedido preparado. El carrito se conserva por si quieres cambiarlo.', 'info', 5000);
            }
          }
        );
      });
    }
  };

  /* ---------------- NAV (hamburguesa + active link) ---------------- */
  const Nav = {
    init() {
      const header = document.querySelector('.header');
      const nav = header?.querySelector('.seccion-nav');
      if (!header || !nav) return;

      let btn = header.querySelector('.nav-toggle');
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nav-toggle';
        btn.setAttribute('aria-label', 'Abrir menú');
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = '<span></span><span></span><span></span>';
        header.appendChild(btn);
      }

      btn.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        btn.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
        btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      });

      nav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          nav.classList.remove('open');
          btn.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        });
      });

      this.setActive();
    },

    setActive() {
      const nav = document.querySelector('.header .seccion-nav');
      if (!nav) return;
      const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
      nav.querySelectorAll('a').forEach(a => {
        const hrefFull = (a.getAttribute('href') || '').toLowerCase();
        const hrefFile = hrefFull.split('/').pop();
        a.classList.toggle('active', hrefFile === path || (path === '' && hrefFile === 'index.html'));
      });
    }
  };

  /* ---------------- HEADER scroll effect ---------------- */
  const HeaderFX = {
    init() {
      const h = document.querySelector('.header');
      if (!h) return;
      const onScroll = () => h.classList.toggle('scrolled', window.scrollY > 30);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  };

  /* ---------------- REVEAL on scroll ---------------- */
  const Reveal = {
    init() {
      const targets = document.querySelectorAll('.reveal');
      if (!targets.length) return;
      if (!('IntersectionObserver' in window)) {
        targets.forEach(el => el.classList.add('revealed'));
        return;
      }
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            en.target.classList.add('revealed');
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      targets.forEach(el => io.observe(el));
    }
  };

  /* ---------------- CONTACT FORM ---------------- */
  const ContactForm = {
    COOLDOWN_MS: 30000,
    _lastSubmit: 0,

    init() {
      const form = document.querySelector('form[data-fk-contacto]');
      if (!form) return;

      form.addEventListener('submit', async e => {
        e.preventDefault();

        const ahora = Date.now();
        const restante = this.COOLDOWN_MS - (ahora - this._lastSubmit);
        if (restante > 0) {
          Toast.show(`Espera ${Math.ceil(restante / 1000)} s antes de enviar otro mensaje`, 'warning');
          return;
        }

        const nombre = form.nombre.value.trim();
        const email = form.email.value.trim();
        const mensaje = form.mensaje.value.trim();

        if (!nombre || !email || !mensaje) {
          Toast.show('Por favor completa todos los campos', 'warning');
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          Toast.show('Introduce un email válido', 'error');
          return;
        }
        if (mensaje.length < 10) {
          Toast.show('Cuéntanos un poco más (mín. 10 caracteres)', 'warning');
          return;
        }

        this._lastSubmit = Date.now();

        if (!WEB3FORMS_KEY) {
          const body = `Nombre: ${nombre}\nEmail: ${email}\n\n${mensaje}`;
          location.href = `mailto:${EMAIL_NEGOCIO}?subject=${encodeURIComponent('Consulta desde la web')}&body=${encodeURIComponent(body)}`;
          Toast.show('Se abrirá tu aplicación de correo con el mensaje preparado.', 'info', 4500);
          return;
        }

        const btn = form.querySelector('button[type=submit]');
        const original = btn.textContent;
        btn.disabled = true;
        btn.classList.add('loading');
        btn.textContent = 'Enviando…';

        try {
          const res = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              access_key: WEB3FORMS_KEY,
              subject: 'Consulta desde la web Freekiland 3D',
              nombre,
              email,
              mensaje
            })
          });
          if (!res.ok) throw new Error(String(res.status));
          Toast.show(`Gracias ${nombre}, hemos recibido tu mensaje.`, 'success', 4500);
          form.reset();
        } catch {
          Toast.show(`No se pudo enviar. Escríbenos a ${EMAIL_NEGOCIO}`, 'error', 5000);
        } finally {
          btn.disabled = false;
          btn.classList.remove('loading');
          btn.textContent = original;
        }
      });
    }
  };

  /* ---------------- GALERIA · botones de añadir + acordeón ---------------- */
  const Galeria = {
    init() {
      document.addEventListener('click', e => {
        const addBtn = e.target.closest('[data-add-cart]');
        if (addBtn) {
          e.preventDefault();
          const card = addBtn.closest('[data-product]');
          if (!card) return;
          Cart.add({
            id: card.dataset.id,
            nombre: card.dataset.nombre,
            precio: card.dataset.precio,
            imagen: card.dataset.imagen || ''
          });
          addBtn.classList.add('added');
          setTimeout(() => addBtn.classList.remove('added'), 600);
          return;
        }

        const toggle = e.target.closest('[data-toggle-categoria]');
        if (toggle) {
          const cat = toggle.closest('.seccion-categoria');
          const target = cat?.querySelector('.contenido-oculto');
          if (!target) return;
          const open = target.classList.toggle('abierto');
          toggle.textContent = open ? 'Ocultar catálogo' : 'Ver catálogo completo';
          toggle.setAttribute('aria-expanded', String(open));
        }
      });
    }
  };

  /* ---------------- MARQUEE · cintas de imágenes con loop GSAP ---------------- */
  const Marquee = {
    _loading: false,
    init() {
      const tracks = document.querySelectorAll('.marquee-interno');
      if (!tracks.length) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const pendientes = [...tracks].filter(t => !t.classList.contains('gsap-on'));
      if (!pendientes.length) return;

      if (typeof gsap === 'undefined') {
        if (this._loading) return;
        this._loading = true;
        const s = document.createElement('script');
        s.src = _base + 'vendor/gsap.min.js';
        s.onload = () => { this._loading = false; this._start(pendientes); };
        s.onerror = () => { this._loading = false; };
        document.head.appendChild(s);
        return;
      }
      this._start(pendientes);
    },

    _start(tracks) {
      tracks.forEach(track => {
        track.classList.add('gsap-on');

        const speed = track.classList.contains('slow') ? 26
                    : track.classList.contains('fast') ? 60
                    : 40;
        const durationFor = () => (track.scrollWidth / 2) / speed;

        const loop = gsap.to(track, {
          xPercent: -50,
          ease: 'none',
          duration: durationFor(),
          repeat: -1
        });

        const wrapper = track.closest('.marquee-externo');
        if (wrapper) {
          const ease = (ts) => gsap.to(loop, { timeScale: ts, duration: 0.6, ease: 'power2.out', overwrite: true });
          wrapper.addEventListener('mouseenter', () => ease(0.15));
          wrapper.addEventListener('mouseleave', () => ease(1));
        }

        let rT;
        window.addEventListener('resize', () => {
          clearTimeout(rT);
          rT = setTimeout(() => loop.duration(durationFor()), 200);
        }, { passive: true });
      });
    }
  };

  /* ---------------- LEGACY GLOBAL ---------------- */
  window.agregarAlCarrito = (nombre, precio, imagen = '') => {
    Cart.add({
      id: `legacy-${nombre}`,
      nombre,
      precio,
      imagen
    });
  };

  /* ---------------- PAGE INIT ---------------- */
  function initPage() {
    Nav.setActive();
    Reveal.init();
    ContactForm.init();
    Marquee.init();
  }

  /* ---------------- BARBA · transiciones SPA con fundido ---------------- */
  function setupBarba() {
    if (typeof barba === 'undefined') return;

    const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fade = (el, from, to) => el.animate(
      [{ opacity: from }, { opacity: to }],
      { duration: reduced() ? 0 : 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
    ).finished;

    barba.hooks.before(() => CartUI.close());

    barba.init({
      transitions: [{
        name: 'fade',
        leave(data) {
          data.current.container.style.position = 'absolute';
          data.current.container.style.width = '100%';
          if (data.next && data.next.container) data.next.container.style.opacity = '0';
          return fade(data.current.container, 1, 0);
        },
        beforeEnter() {
          window.scrollTo(0, 0);
        },
        enter(data) {
          return fade(data.next.container, 0, 1);
        },
        afterEnter(data) {
          data.next.container.style.opacity = '1';
          initPage();
        }
      }]
    });
  }

  /* ---------------- BOOT ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    Toast.init();
    CartModal.ensure();
    Cart.load();
    Cart.bind();
    Cart.render();
    CartUI.bind();
    Nav.init();
    HeaderFX.init();
    Galeria.init();

    initPage();
    setupBarba();
  });
})();
