/* ================================================================
   АВТОШКОЛА «ЛАУРА» — main.js
   EmailJS · Валидация · Маска телефона · Антиспам · Анимации
   ================================================================ */
(function () {
  'use strict';

  var EJS_PUBLIC_KEY  = 'WDCcnnUzYqPzTaLbD';
  var EJS_SERVICE_ID  = 'service_h1pm0cn';
  var EJS_TEMPLATE_ID = 'template_6owfu4x';
  var EJS_READY       = false;

  function loadEmailJS(cb) {
    if (window.emailjs) { EJS_READY = true; cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.onload  = function () { emailjs.init({ publicKey: EJS_PUBLIC_KEY }); EJS_READY = true; cb(); };
    s.onerror = function () { cb(); };
    document.head.appendChild(s);
  }

  /* ── ICONS ─────────────────────────────────────────────────── */
  var ICO = {
    spin: '<svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
    ok:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    err:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };

  /* ── STATUS MESSAGES ────────────────────────────────────────── */
  function showMsg(form, type, text) {
    var old = form.querySelector('.form-msg');
    if (old) old.remove();
    if (!text) return;
    var d = document.createElement('div');
    d.className = 'form-msg form-msg--' + type;
    d.setAttribute('role', type === 'err' ? 'alert' : 'status');
    d.innerHTML = (ICO[type] || '') + '<span>' + text + '</span>';
    var btn = form.querySelector('button[type="submit"]');
    if (btn) form.insertBefore(d, btn); else form.appendChild(d);
  }

  /* ── PHONE MASK ─────────────────────────────────────────────── */
  /* FIX: единая функция маски для любого поля телефона —
     как в модалке (без phone-wrap), так и в контактной форме    */
  function applyPhoneMask(input) {
    function fmt(raw) {
      var d = raw.replace(/\D/g, '');
      if (d.length && (d[0] === '7' || d[0] === '8')) d = d.slice(1);
      d = d.slice(0, 10);
      var out = '';
      if (d.length > 0)  out += '(' + d.slice(0, 3);
      if (d.length >= 3) out += ') ' + d.slice(3, 6);
      if (d.length >= 6) out += '-' + d.slice(6, 8);
      if (d.length >= 8) out += '-' + d.slice(8, 10);
      return out;
    }
    input.addEventListener('input', function () {
      var p = input.selectionStart;
      var before = input.value;
      input.value = fmt(input.value);
      clearFieldErr(input);
      var diff = input.value.length - before.length;
      try { input.setSelectionRange(p + diff, p + diff); } catch(e) {}
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && input.value === '') e.preventDefault();
    });
    input.addEventListener('paste', function (e) {
      e.preventDefault();
      var raw = (e.clipboardData || window.clipboardData).getData('text');
      input.value = raw;
      input.dispatchEvent(new Event('input'));
    });
  }

  function getFullPhone(input) {
    var d = input.value.replace(/\D/g, '');
    return d.length === 10 ? '+7' + d : null;
  }

  /* ── FIELD ERRORS ────────────────────────────────────────────── */
  function showFieldErr(input, msg) {
    if (!input) return;
    input.classList.add('field__inp--err');
    var wrap = input.closest('.phone-wrap');
    if (wrap) wrap.classList.add('phone-wrap--err');
    var errEl = input.id ? document.getElementById(input.id + '-err') : null;
    if (errEl) errEl.textContent = msg;
  }
  function clearFieldErr(input) {
    if (!input) return;
    input.classList.remove('field__inp--err');
    var wrap = input.closest('.phone-wrap');
    if (wrap) wrap.classList.remove('phone-wrap--err');
    var errEl = input.id ? document.getElementById(input.id + '-err') : null;
    if (errEl) errEl.textContent = '';
  }

  /* ── VALIDATORS ──────────────────────────────────────────────── */
  function vName(inp) {
    if (!inp) { console.warn('[Laura] vName: input not found'); return false; }
    var v = inp.value.trim();
    if (!v)          { showFieldErr(inp, 'Введите ваше имя'); return false; }
    if (v.length < 2){ showFieldErr(inp, 'Имя слишком короткое'); return false; }
    if (/\d/.test(v)){ showFieldErr(inp, 'Имя не должно содержать цифры'); return false; }
    clearFieldErr(inp); return true;
  }
  function vPhone(inp) {
    if (!inp) { console.warn('[Laura] vPhone: input not found'); return false; }
    if (!getFullPhone(inp)) {
      showFieldErr(inp, 'Введите 10 цифр: (9XX) XXX-XX-XX'); return false;
    }
    clearFieldErr(inp); return true;
  }
  function vEmail(inp) {
    if (!inp || !inp.value.trim()) return true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim())) {
      showFieldErr(inp, 'Некорректный email'); return false;
    }
    clearFieldErr(inp); return true;
  }

  /* ── ANTI-SPAM ───────────────────────────────────────────────── */
  function injectHoneypot(form) {
    if (form.querySelector('[name="_hp"]')) return;
    var d = document.createElement('div');
    d.setAttribute('aria-hidden','true');
    d.style.cssText = 'position:absolute;left:-9999px;top:-9999px;opacity:0;pointer-events:none;height:0;overflow:hidden';
    d.innerHTML = '<label>Leave empty <input type="text" name="_hp" tabindex="-1" autocomplete="off"></label>';
    form.insertBefore(d, form.firstChild);
  }
  function isBot(form, t0) {
    var hp = form.querySelector('[name="_hp"]');
    if (hp && hp.value.trim()) return true;
    if (Date.now() - t0 < 1500) return true;
    return false;
  }

  /* ── SEND EMAIL ──────────────────────────────────────────────── */
  function sendEmail(params) {
    if (!EJS_READY) {
      return Promise.reject('EmailJS not loaded');
    }
    /* FIX: убран to_email из params — адрес получателя задаётся
       в настройках шаблона/сервиса EmailJS, а не в параметрах  */
    return emailjs.send(EJS_SERVICE_ID, EJS_TEMPLATE_ID, params);
  }

  /* ── HEADER SCROLL ───────────────────────────────────────────── */
  var header = document.getElementById('header');
  if (header) {
    var onScroll = function () { header.classList.toggle('header--scrolled', window.scrollY > 20); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── BURGER ──────────────────────────────────────────────────── */
  var burger = document.getElementById('burger');
  var mMenu  = document.getElementById('mobileMenu');
  function closeBurger() {
    if (!burger) return;
    burger.classList.remove('burger--open');
    if (mMenu) mMenu.classList.remove('mobile-menu--open');
    burger.setAttribute('aria-expanded','false');
    if (mMenu) mMenu.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  window.closeBurger = closeBurger;
  if (burger && mMenu) {
    burger.addEventListener('click', function () {
      var open = burger.classList.toggle('burger--open');
      mMenu.classList.toggle('mobile-menu--open', open);
      burger.setAttribute('aria-expanded', String(open));
      mMenu.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mMenu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeBurger); });
  }

  /* ── MODAL ───────────────────────────────────────────────────── */
  var modalT0 = Date.now();

  window.openModal = function () {
    var o = document.getElementById('modalOverlay');
    if (!o) return;
    modalT0 = Date.now();
    o.classList.add('modal-overlay--open');
    o.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    var inp = o.querySelector('input');
    if (inp) setTimeout(function () { inp.focus(); }, 80);
  };
  window.closeModal = function () {
    var o = document.getElementById('modalOverlay');
    if (!o) return;
    o.classList.remove('modal-overlay--open');
    o.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  };
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'modalOverlay') window.closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { window.closeModal(); closeBurger(); }
  });

  /* ── MODAL FORM ──────────────────────────────────────────────── */
  function initModalForm() {
    var form = document.querySelector('#modalOverlay .modal__form');
    if (!form) return;
    injectHoneypot(form);
    var nameInp  = form.querySelector('#m-name');
    var phoneInp = form.querySelector('#m-phone');

    /* FIX: применяем маску к телефону модалки.
       Поле в HTML не обёрнуто в phone-wrap — маска всё равно
       работает, т.к. applyPhoneMask не требует phone-wrap.     */
    if (phoneInp) applyPhoneMask(phoneInp);

    if (nameInp)  nameInp.addEventListener('blur',  function () { vName(nameInp); });
    if (phoneInp) phoneInp.addEventListener('blur',  function () { vPhone(phoneInp); });
  }

  window.submitForm = function (e) {
    e.preventDefault();
    var form      = e.target;
    var nameInp   = form.querySelector('#m-name');
    var phoneInp  = form.querySelector('#m-phone');
    var catSel    = form.querySelector('#m-cat');
    var branchSel = form.querySelector('#m-branch');
    var btn       = form.querySelector('button[type="submit"]');
    var orig      = btn ? btn.textContent : '';

    var old = form.querySelector('.form-msg'); if (old) old.remove();

    if (isBot(form, modalT0)) {
      showMsg(form, 'ok', 'Заявка принята! Мы перезвоним вам в ближайшее время.');
      form.reset();
      setTimeout(window.closeModal, 2500);
      return;
    }

    var ok = vName(nameInp) && vPhone(phoneInp);
    if (!ok) { showMsg(form, 'err', 'Пожалуйста, исправьте ошибки выше.'); return; }

    if (btn) { btn.disabled = true; btn.textContent = 'Отправляем…'; }
showMsg(form, 'spin', 'Отправляем заявку…');

loadEmailJS(async function () {

  try {

    const res = await sendEmail({
      from_name: nameInp.value.trim(),
      phone: getFullPhone(phoneInp),
      email: emailInp.value.trim(),
      message: msgArea.value.trim(),
      branch: branchSel && branchSel.value
        ? branchSel.options[branchSel.selectedIndex].text
        : 'Не выбран',
      category: ''
    });

    console.log('SUCCESS', res);

    var m = form.querySelector('.form-msg');
    if (m) m.remove();

    form.reset();

    if (btn) btn.style.display = 'none';
    if (succ) succ.hidden = false;

  } catch (err) {

    console.error('EMAIL ERROR:', err);

    var m = form.querySelector('.form-msg');
    if (m) m.remove();

    showMsg(form, 'err', 'Ошибка отправки формы');

    if (btn) {
      btn.disabled = false;
      btn.textContent = orig;
    }
  }
});
};

  /* ── CONTACT FORM ────────────────────────────────────────────── */
  /* FIX: contactT0 сбрасывается при focusin на любое поле формы.
     Ранее сброс не работал надёжно если пользователь сразу
     кликал на submit не касаясь полей — теперь сброс при mousedown
     на форму, что срабатывает раньше submit.                     */
  var contactT0 = Date.now();

  function initContactForm() {
    var form = document.querySelector('.contact-form');
    if (!form) return;
    injectHoneypot(form);
    var nameInp  = form.querySelector('#cf-name');
    var phoneInp = form.querySelector('#cf-phone');
    var emailInp = form.querySelector('#cf-email');
    if (phoneInp) applyPhoneMask(phoneInp);
    if (nameInp)  nameInp.addEventListener('blur', function () { vName(nameInp); });
    if (phoneInp) phoneInp.addEventListener('blur', function () { vPhone(phoneInp); });
    if (emailInp) emailInp.addEventListener('blur', function () { vEmail(emailInp); });

    /* FIX: сбрасываем таймер при любом взаимодействии с формой  */
    form.addEventListener('focusin',   function () { contactT0 = Date.now(); }, { once: true });
    form.addEventListener('mousedown', function () { contactT0 = Date.now(); }, { once: true });
  }

  window.submitContact = function (e) {
    
    e.preventDefault();
    var form = e.target;
    var succ = document.getElementById('contactSuccess');
    if (succ) succ.hidden = true;
    var nameInp   = form.querySelector('#cf-name');
    var phoneInp  = form.querySelector('#cf-phone');
    var emailInp  = form.querySelector('#cf-email');
    var msgArea   = form.querySelector('#cf-msg');
    var branchSel = form.querySelector('#cf-branch');
    var btn       = form.querySelector('button[type="submit"]');
    var succ      = document.getElementById('contactSuccess');
    var orig      = btn ? btn.textContent : '';

    var old = form.querySelector('.form-msg'); if (old) old.remove();

    if (isBot(form, contactT0)) {
      form.reset();
      if (btn) btn.style.display = 'none';
      if (succ) succ.hidden = false;
      return;
    }

    var ok = vName(nameInp) && vPhone(phoneInp) && vEmail(emailInp);
    if (!ok) { showMsg(form, 'err', 'Пожалуйста, исправьте ошибки выше.'); return; }

    if (btn) { btn.disabled = true; btn.textContent = 'Отправляем…'; }
    showMsg(form, 'spin', 'Отправляем…');

    loadEmailJS(function () {
      sendEmail({
        from_name: nameInp  ? nameInp.value.trim()  : '',
        phone:     phoneInp ? (getFullPhone(phoneInp) || phoneInp.value) : '',
        email:     emailInp ? emailInp.value.trim() : '',
        message:   msgArea  ? msgArea.value.trim()  : '',
        branch:    branchSel && branchSel.value
                   ? branchSel.options[branchSel.selectedIndex].text : 'Не выбран',
        category:  '',
      }).then(function () {
        var m = form.querySelector('.form-msg'); if (m) m.remove();
        form.reset();
        if (btn) btn.style.display = 'none';
        if (succ) succ.hidden = false;
      }).catch(function (err) {
        console.error('[Laura] EmailJS error:', err);
        var m = form.querySelector('.form-msg'); if (m) m.remove();
        showMsg(form, 'err', 'Не удалось отправить. Напишите: mail@lauraschool.ru');
        if (btn) { btn.disabled = false; btn.textContent = orig; }
      });
    });
  };

  /* ── BRANCH TABS ─────────────────────────────────────────────── */
  document.querySelectorAll('.branch-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.dataset.branch;
      document.querySelectorAll('.branch-tab').forEach(function (t) {
        t.classList.remove('branch-tab--active'); t.setAttribute('aria-selected','false');
      });
      tab.classList.add('branch-tab--active'); tab.setAttribute('aria-selected','true');
      document.querySelectorAll('.branch-card').forEach(function (c) {
        c.style.display = (target==='all' || c.dataset.branch===target) ? '' : 'none';
      });
    });
  });

  /* ── SCROLL ANIMATIONS ───────────────────────────────────────── */
  if (window.IntersectionObserver) {
    var els = document.querySelectorAll(
      '.adv-card,.instr-card,.stat-card,.info-block,.branch-card,' +
      '.rev-card,.office-card,.doc-item,.step-item,.cat-card,.note-card,.dl-link,.ya-card'
    );
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('js-fade--in'); obs.unobserve(en.target); }
      });
    }, { threshold: .08 });
    els.forEach(function (el, i) {
      el.classList.add('js-fade');
      el.style.transitionDelay = (i % 4) * .07 + 's';
      obs.observe(el);
    });
  }

  /* ── BOOT ────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initModalForm();
      initContactForm();
    });
  } else {
    initModalForm();
    initContactForm();
  }

})();