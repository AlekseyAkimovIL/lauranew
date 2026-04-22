/* =============================================================
   АВТОШКОЛА «ЛАУРА» — main.js
   Бургер · Модал · Formspree · Анимации
   ============================================================= */
(function () {
  'use strict';

  /* ── CONFIG ──────────────────────────────────────────────────
     Зарегистрируйтесь на https://formspree.io (бесплатно)
     Создайте форму → mail@lauraschool.ru → вставьте ID ниже   */
  var FORMSPREE_ID  = 'YOUR_FORM_ID';
  var FORMSPREE_URL = 'https://formspree.io/f/' + FORMSPREE_ID;

  /* ── ICONS ───────────────────────────────────────────────── */
  var ICO = {
    spin: '<svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
    ok:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    err:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };

  /* ── HEADER SCROLL ───────────────────────────────────────── */
  var header = document.getElementById('header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('header--scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── BURGER ──────────────────────────────────────────────── */
  var burger     = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');

  function closeBurger() {
    if (!burger) return;
    burger.classList.remove('burger--open');
    if (mobileMenu) mobileMenu.classList.remove('mobile-menu--open');
    burger.setAttribute('aria-expanded', 'false');
    if (mobileMenu) mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  window.closeBurger = closeBurger;

  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = burger.classList.toggle('burger--open');
      mobileMenu.classList.toggle('mobile-menu--open', open);
      burger.setAttribute('aria-expanded', String(open));
      mobileMenu.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeBurger);
    });
  }

  /* ── MODAL ───────────────────────────────────────────────── */
  window.openModal = function () {
    var overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    overlay.classList.add('modal-overlay--open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var first = overlay.querySelector('input');
    if (first) setTimeout(function () { first.focus(); }, 80);
  };

  window.closeModal = function () {
    var overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    overlay.classList.remove('modal-overlay--open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'modalOverlay') window.closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { window.closeModal(); closeBurger(); }
  });

  /* ── STATUS MESSAGES ─────────────────────────────────────── */
  function showMsg(container, type, text) {
    // Remove previous message
    var old = container.querySelector('.form-msg');
    if (old) old.remove();
    if (!text) return;
    var d = document.createElement('div');
    d.className = 'form-msg form-msg--' + type;
    d.setAttribute('role', type === 'err' ? 'alert' : 'status');
    d.innerHTML = (ICO[type] || '') + '<span>' + text + '</span>';
    // Insert before submit button so it appears above it
    var btn = container.querySelector('button[type="submit"]');
    if (btn) { container.insertBefore(d, btn); }
    else { container.appendChild(d); }
  }

  /* ── SPAM DETECTION ──────────────────────────────────────── */
  function isSpam(form, startTime) {
    var hp = form.querySelector('[name="website"]');
    if (hp && hp.value.trim()) return true;
    if (Date.now() - startTime < 1500) return true;
    return false;
  }

  /* ── HONEYPOT ─────────────────────────────────────────────── */
  function injectHoneypot(form) {
    if (!form || form.querySelector('[name="website"]')) return;
    var hp = document.createElement('div');
    hp.className = 'hp-field';
    hp.setAttribute('aria-hidden', 'true');
    hp.innerHTML = '<label>Не заполнять <input type="text" name="website" tabindex="-1" autocomplete="off"></label>';
    form.insertBefore(hp, form.firstChild);
  }

  /* ── FORMSPREE ────────────────────────────────────────────── */
  function postToFormspree(form, source) {
    var data = new FormData(form);
    data.delete('website');
    data.set('_subject', 'Новая заявка — lauraschool.ru (' + source + ')');
    return fetch(FORMSPREE_URL, {
      method: 'POST', body: data,
      headers: { 'Accept': 'application/json' }
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (j) { throw new Error(j.error || 'err'); });
      return r.json();
    });
  }

  /* ── MODAL FORM ───────────────────────────────────────────── */
  var modalT0   = Date.now();
  var modalForm = null;

  function initModalForm() {
    modalForm = document.querySelector('#modalOverlay .modal__form');
    if (!modalForm) return;
    injectHoneypot(modalForm);
    modalForm.addEventListener('focusin', function () { modalT0 = Date.now(); }, { once: true });
  }

  window.submitForm = function (e) {
    e.preventDefault();
    var form = e.target;
    var btn  = form.querySelector('button[type="submit"]');
    var orig = btn ? btn.textContent : '';

    // Remove old message
    var old = form.querySelector('.form-msg'); if (old) old.remove();

    if (isSpam(form, modalT0)) {
      showMsg(form, 'ok', 'Заявка принята! Мы перезвоним вам в ближайшее время.');
      form.reset();
      setTimeout(window.closeModal, 2500);
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Отправляем…'; }
    showMsg(form, 'wait', 'Отправляем заявку…');

    /* Demo mode — Formspree не настроен */
    if (FORMSPREE_ID === 'YOUR_FORM_ID') {
      setTimeout(function () {
        var m = form.querySelector('.form-msg'); if (m) m.remove();
        showMsg(form, 'ok', 'Заявка принята! Мы перезвоним вам в ближайшее время.');
        form.reset();
        if (btn) { btn.disabled = false; btn.textContent = orig; }
        setTimeout(window.closeModal, 2500);
      }, 900);
      return;
    }

    postToFormspree(form, 'modal')
      .then(function () {
        var m = form.querySelector('.form-msg'); if (m) m.remove();
        showMsg(form, 'ok', 'Заявка принята! Мы перезвоним вам в ближайшее время.');
        form.reset();
        if (btn) { btn.disabled = false; btn.textContent = orig; }
        setTimeout(window.closeModal, 2500);
      })
      .catch(function () {
        var m = form.querySelector('.form-msg'); if (m) m.remove();
        showMsg(form, 'err', 'Ошибка отправки. Позвоните нам: 8 (812) 338-10-08');
        if (btn) { btn.disabled = false; btn.textContent = orig; }
      });
  };

  /* ── CONTACT FORM ─────────────────────────────────────────── */
  var contactT0   = Date.now();
  var contactForm = null;

  function initContactForm() {
    contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;
    injectHoneypot(contactForm);
    contactForm.addEventListener('focusin', function () { contactT0 = Date.now(); }, { once: true });
  }

  window.submitContact = function (e) {
    e.preventDefault();
    var form = e.target;
    var btn  = form.querySelector('button[type="submit"]');
    var succ = document.getElementById('contactSuccess');
    var orig = btn ? btn.textContent : '';

    var old = form.querySelector('.form-msg'); if (old) old.remove();

    if (isSpam(form, contactT0)) {
      form.reset();
      if (btn) btn.style.display = 'none';
      if (succ) succ.hidden = false;
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Отправляем…'; }
    showMsg(form, 'wait', 'Отправляем…');

    if (FORMSPREE_ID === 'YOUR_FORM_ID') {
      setTimeout(function () {
        var m = form.querySelector('.form-msg'); if (m) m.remove();
        form.reset();
        if (btn) btn.style.display = 'none';
        if (succ) succ.hidden = false;
      }, 900);
      return;
    }

    postToFormspree(form, 'contacts')
      .then(function () {
        var m = form.querySelector('.form-msg'); if (m) m.remove();
        form.reset();
        if (btn) btn.style.display = 'none';
        if (succ) succ.hidden = false;
      })
      .catch(function () {
        var m = form.querySelector('.form-msg'); if (m) m.remove();
        showMsg(form, 'err', 'Не удалось отправить. Напишите: mail@lauraschool.ru');
        if (btn) { btn.disabled = false; btn.textContent = orig; }
      });
  };

  /* ── BRANCH TABS ──────────────────────────────────────────── */
  document.querySelectorAll('.branch-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.dataset.branch;
      document.querySelectorAll('.branch-tab').forEach(function (t) {
        t.classList.remove('branch-tab--active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('branch-tab--active');
      tab.setAttribute('aria-selected', 'true');
      document.querySelectorAll('.branch-card').forEach(function (c) {
        c.style.display = (target === 'all' || c.dataset.branch === target) ? '' : 'none';
      });
    });
  });

  /* ── SCROLL ANIMATIONS ────────────────────────────────────── */
  if (window.IntersectionObserver) {
    var els = document.querySelectorAll(
      '.adv-card, .instr-card, .stat-card, .info-block, .branch-card,' +
      '.rev-card, .office-card, .doc-item, .step-item, .cat-card, .note-card, .dl-link'
    );
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('js-fade--in');
          observer.unobserve(en.target);
        }
      });
    }, { threshold: .08 });
    els.forEach(function (el, i) {
      el.classList.add('js-fade');
      el.style.transitionDelay = (i % 4) * .07 + 's';
      observer.observe(el);
    });
  }

  /* ── BOOT ─────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initModalForm();
    initContactForm();
  });

})();
