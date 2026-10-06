/* vznk.agency — інтерактив прототипу (без залежностей, ~7 КБ) */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // ищем блок подтверждения/ошибки в ближайшем контейнере формы
  const findBlock = (form, selector) => {
    let node = form.parentElement;
    while (node) {
      const found = node.querySelector(selector);
      if (found) return found;
      node = node.parentElement;
    }
    return null;
  };

  /* ---------- 1. Тема ---------- */
  const themeToggle = $('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('vznk-theme', next); } catch (e) {}
    });
  }

  /* ---------- 2. Хедер при скролі + прогрес читання ---------- */
  const header = $('#siteHeader');
  const progress = $('.scroll-progress span');
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3. Дропдаун послуг ---------- */
  const drop = $('.nav-drop');
  if (drop) {
    const btn = $('.nav-drop-btn', drop);
    const open = (state) => {
      drop.classList.toggle('is-open', state);
      btn.setAttribute('aria-expanded', String(state));
    };
    btn.addEventListener('click', (e) => { e.stopPropagation(); open(!drop.classList.contains('is-open')); });
    drop.addEventListener('mouseenter', () => open(true));
    drop.addEventListener('mouseleave', () => open(false));
    document.addEventListener('click', () => open(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') open(false); });
  }

  /* ---------- 4. Мобільне меню ---------- */
  const burger = $('.burger');
  const mobileMenu = $('.mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!isOpen));
      mobileMenu.hidden = isOpen;
      mobileMenu.classList.toggle('is-open', !isOpen);
      document.body.style.overflow = !isOpen ? 'hidden' : '';
    });
  }

  /* ---------- 5. Фільтри кейсів ---------- */
  $$('[data-filter-group]').forEach((group) => {
    const target = $(group.dataset.filterGroup);
    if (!target) return;
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter');
      if (!btn) return;
      $$('.filter', group).forEach((b) => b.classList.toggle('is-active', b === btn));
      const key = btn.dataset.filter;
      $$('[data-tags]', target).forEach((card) => {
        const show = key === 'all' || (card.dataset.tags || '').split(' ').includes(key);
        card.hidden = !show;
      });
      const counter = group.querySelector('[data-filter-count]');
      if (counter) {
        const visible = $$('[data-tags]', target).filter((c) => !c.hidden).length;
        counter.textContent = visible;
      }
    });
  });

  /* ---------- 6. Акордеон FAQ ---------- */
  $$('.faq-item').forEach((item) => {
    const q = $('.faq-q', item);
    const a = $('.faq-a', item);
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      const parent = item.parentElement;
      if (parent && parent.dataset.single !== undefined) {
        $$('.faq-item', parent).forEach((other) => {
          other.classList.remove('is-open');
          const oa = $('.faq-a', other);
          if (oa) oa.style.maxHeight = null;
          const oq = $('.faq-q', other);
          if (oq) oq.setAttribute('aria-expanded', 'false');
        });
      }
      item.classList.toggle('is-open', !isOpen);
      q.setAttribute('aria-expanded', String(!isOpen));
      a.style.maxHeight = !isOpen ? a.scrollHeight + 'px' : null;
    });
  });

  /* ---------- 7. Пошук по блогу ---------- */
  const blogSearch = $('[data-blog-search]');
  if (blogSearch) {
    blogSearch.addEventListener('input', () => {
      const q = blogSearch.value.trim().toLowerCase();
      let visible = 0;
      $$('[data-post]').forEach((card) => {
        const haystack = (card.dataset.post || '').toLowerCase();
        const show = !q || haystack.includes(q);
        card.hidden = !show;
        if (show) visible++;
      });
      const empty = $('[data-blog-empty]');
      if (empty) empty.hidden = visible !== 0;
    });
  }

  /* ---------- 8. Поява при скролі ---------- */
  const revealables = $$('.reveal');
  if ('IntersectionObserver' in window && revealables.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- 9. Зміст статті (scrollspy) ---------- */
  const tocLinks = $$('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const headings = tocLinks
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    headings.forEach((h) => spy.observe(h));
  }

  /* ---------- 10. Форми заявок: валідація + відправка ---------- */
  const IS_EN = (document.documentElement.lang || 'uk').toLowerCase().startsWith('en');
  const MSG = IS_EN ? {
    required: 'Please fill in this field',
    email: 'Check the email format',
    contact: 'Leave an email or a Telegram handle',
    sending: 'Sending…',
    localDemo: 'Local preview mode: the request was not sent. On the published site the form works.',
    noChannel: 'Request received. The delivery channel is not connected yet — we will get back to you.',
    tgIntro: 'Request from the vznk.agency website',
    labels: { name: 'Name', contact: 'Contact', service: 'Service', budget: 'Budget', site: 'Website', comment: 'Task', page: 'Page' },
  } : {
    required: 'Заповніть, будь ласка, це поле',
    email: 'Перевірте формат email',
    contact: 'Залиште Telegram або email',
    sending: 'Надсилаємо…',
    localDemo: 'Демо-режим локального перегляду: заявка не надіслана. На опублікованому сайті форма працює.',
    noChannel: 'Заявку прийнято. Канал доставки ще не підключено — ми зв\'яжемось із вами.',
    tgIntro: 'Заявка з сайту vznk.agency',
    labels: { name: 'Ім\'я', contact: 'Контакт', service: 'Послуга', budget: 'Бюджет', site: 'Сайт', comment: 'Задача', page: 'Сторінка' },
  };

  const CONFIG = Object.assign({
    formEndpoint: '/api/lead',
    ga4: '',
    telegram: 'https://t.me/vznk_rv',
  }, window.VZNK_CONFIG || {});

  // собираем текст заявки для отправки в Telegram, если серверная функция недоступна
  const telegramDraft = (payload) => {
    const parts = [
      MSG.tgIntro,
      payload.name ? `${MSG.labels.name}: ${payload.name}` : '',
      payload.contact ? `${MSG.labels.contact}: ${payload.contact}` : '',
      payload.service ? `${MSG.labels.service}: ${payload.service}` : '',
      payload.budget ? `${MSG.labels.budget}: ${payload.budget}` : '',
      payload.site ? `${MSG.labels.site}: ${payload.site}` : '',
      payload.comment ? `${MSG.labels.comment}: ${payload.comment}` : '',
      `${MSG.labels.page}: ${payload.page || '/'}`,
    ].filter(Boolean);
    return parts.join('\n');
  };

  const track = (event, params) => {
    if (typeof window.gtag === 'function') window.gtag('event', event, params || {});
  };

  const setFieldError = (field, message) => {
    const wrap = field.closest('.field') || field.parentElement;
    if (!wrap) return;
    let hint = wrap.querySelector('.field-error');
    if (!message) {
      if (hint) hint.remove();
      field.removeAttribute('aria-invalid');
      return;
    }
    if (!hint) {
      hint = document.createElement('span');
      hint.className = 'field-error';
      wrap.appendChild(hint);
    }
    hint.textContent = message;
    field.setAttribute('aria-invalid', 'true');
  };

  const validateForm = (form) => {
    let firstBad = null;
    form.querySelectorAll('[required]').forEach((field) => {
      const value = (field.value || '').trim();
      let error = '';
      if (!value) error = MSG.required;
      else if (field.type === 'email' && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(value)) error = MSG.email;
      else if (field.name === 'contact' && value.length < 5) error = MSG.contact;
      setFieldError(field, error);
      if (error && !firstBad) firstBad = field;
    });
    return firstBad;
  };

  $$('form[data-lead-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bad = validateForm(form);
      if (bad) { bad.focus(); return; }

      const button = form.querySelector('button[type="submit"]');
      const label = button ? button.innerHTML : '';
      if (button) { button.disabled = true; button.classList.add('is-loading'); button.innerHTML = MSG.sending; }

      const success = findBlock(form, '.form-success');
      const failure = findBlock(form, '.form-error');

      const payload = Object.fromEntries(new FormData(form).entries());
      payload.page = location.pathname + location.hash;
      payload.referrer = document.referrer || '';
      payload.sentAt = new Date().toISOString();

      const showSuccess = (message) => {
        if (success) {
          if (message) success.textContent = message;
          success.classList.add('is-visible');
        }
        form.hidden = true;
        track('generate_lead', { form_source: payload.source || payload.page });
      };

      // локальный просмотр (file://) — без бэкенда
      if (location.protocol === 'file:') {
        showSuccess(MSG.localDemo);
        return;
      }

      try {
        const response = await fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.ok === false) throw new Error(result.error || 'request failed');
        showSuccess(result.delivered === false ? MSG.noChannel : '');
      } catch (err) {
        // серверная функция недоступна — предлагаем отправить заявку в Telegram одним нажатием
        if (failure) {
          failure.hidden = false;
          const link = failure.querySelector('a[href*="t.me"]');
          if (link) {
            link.href = (CONFIG.telegram || 'https://t.me/vznk_rv') + '?text=' + encodeURIComponent(telegramDraft(payload));
            link.textContent = IS_EN ? 'Send the request via Telegram' : 'Надіслати заявку в Telegram';
          }
        }
        if (button) { button.disabled = false; button.classList.remove('is-loading'); button.innerHTML = label; }
        console.warn('lead submit failed:', err);
        track('lead_error', { message: String(err).slice(0, 120) });
      }
    });
  });

  /* ---------- 10.1 Аналітика: кліки по контактах і глибина скролу ---------- */
  $$('a[href*="t.me"], a[href^="mailto:"]').forEach((link) => {
    link.addEventListener('click', () => {
      track(link.href.startsWith('mailto:') ? 'click_email' : 'click_messenger', {
        link_url: link.href,
        page: location.pathname,
      });
    });
  });
  let deepest = 0;
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
    [25, 50, 75, 100].forEach((mark) => {
      if (pct >= mark && deepest < mark) {
        deepest = mark;
        track('scroll_' + mark, { page: location.pathname });
      }
    });
  }, { passive: true });

  if (CONFIG.ga4) {
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.ga4);
    document.head.appendChild(tag);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CONFIG.ga4, { anonymize_ip: true });
  }

  /* ---------- 11. Реакція карток кейсів на курсор ---------- */
  if (window.matchMedia('(hover: hover)').matches) {
    $$('.case-card, .card, .post-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
      });
    });
  }

  /* ---------- 12. Мультимовність (демо) ---------- */
  const I18N = {
    ru: {
      'nav.cases': 'Кейсы',
      'nav.services': 'Услуги',
      'nav.process': 'Процесс',
      'nav.blog': 'Блог',
      'nav.contacts': 'Контакты',
      'mega.acq': 'Привлечение клиентов',
      'mega.web': 'Сайты и аналитика',
      'mega.case': 'Новый кейс',
      'mega.all': 'Смотреть все кейсы →',
      'svc.target': 'Таргетированная реклама',
      'svc.context': 'Контекстная реклама',
      'svc.web': 'Сайт под ключ',
      'svc.audit': 'Аудит и стратегия',
      'svc.seo': 'SEO и контент',
      'cta.consult': 'Получить консультацию',
      'cta.consultShort': 'Консультация',
      'footer.about': 'Digital-агентство: реклама, которая приводит клиентов, и сайты, которые продают.',
      'footer.services': 'Услуги',
      'footer.company': 'Компания',
      'footer.contacts': 'Контакты',
      'footer.hours': 'Пн–Пт, 10:00–19:00 (EET)',
      'footer.rights': 'Все права защищены.',
      'footer.privacy': 'Политика конфиденциальности',
      'footer.terms': 'Условия сотрудничества',
      'hero.badge': 'Доступны для новых проектов',
      'hero.h1': 'Рекламные решения,<br>которые <span class="hl">приводят<br>клиентов</span>',
      'hero.h1b': 'Сайты, которые<br><span class="hl">продают</span>',
      'hero.lead': 'Настраиваем таргет и Google Ads, строим воронку и делаем сайт, который превращает трафик в заявки. Показываем цифры, а не обещания.',
      'hero.cta1': 'Получить стратегию роста',
      'hero.cta2': 'Смотреть кейсы',
      'hero.note': 'Ответим в течение 30 минут в рабочее время. Без навязчивых звонков.',
      'hero.kpi1': 'Проектов запущено',
      'hero.kpi2': 'Лет в digital',
      'hero.kpi3': 'Средний ROAS'
    },
    en: {
      'nav.cases': 'Cases',
      'nav.services': 'Services',
      'nav.process': 'Process',
      'nav.blog': 'Blog',
      'nav.contacts': 'Contacts',
      'mega.acq': 'Customer acquisition',
      'mega.web': 'Websites & analytics',
      'mega.case': 'New case study',
      'mega.all': 'View all cases →',
      'svc.target': 'Paid social ads',
      'svc.context': 'Google Ads / PPC',
      'svc.web': 'Website turnkey',
      'svc.audit': 'Audit & strategy',
      'svc.seo': 'SEO & content',
      'cta.consult': 'Get a free consultation',
      'cta.consultShort': 'Consultation',
      'footer.about': 'Digital agency: advertising that brings clients and websites that sell.',
      'footer.services': 'Services',
      'footer.company': 'Company',
      'footer.contacts': 'Contacts',
      'footer.hours': 'Mon–Fri, 10:00–19:00 (EET)',
      'footer.rights': 'All rights reserved.',
      'footer.privacy': 'Privacy policy',
      'footer.terms': 'Terms of cooperation',
      'hero.badge': 'Available for new projects',
      'hero.h1': 'Advertising that<br><span class="hl">brings you<br>clients</span>',
      'hero.h1b': 'Websites that<br><span class="hl">sell</span>',
      'hero.lead': 'We run paid social and Google Ads, build the funnel and ship a website that turns traffic into leads. Numbers first, promises later.',
      'hero.cta1': 'Get a growth strategy',
      'hero.cta2': 'See case studies',
      'hero.note': 'We reply within 30 minutes during business hours. No pushy calls.',
      'hero.kpi1': 'Projects launched',
      'hero.kpi2': 'Years in digital',
      'hero.kpi3': 'Average ROAS'
    }
  };
  const BASE = {};
  $$('[data-i18n]').forEach((el) => { BASE[el.dataset.i18n] = el.innerHTML; });

  const applyLang = (lang, silent) => {
    const dict = I18N[lang];
    $$('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const value = dict && dict[key] !== undefined ? dict[key] : BASE[key];
      if (value !== undefined) el.innerHTML = value;
    });
    document.documentElement.lang = lang;
    $$('[data-lang-switch]').forEach((group) => {
      const current = $('.lang-current', group) || null;
      if (current) current.textContent = lang.toUpperCase();
      $$('[data-lang]', group).forEach((btn) => {
        const active = btn.dataset.lang === lang;
        if (btn.hasAttribute('aria-selected')) btn.setAttribute('aria-selected', String(active));
        btn.classList.toggle('is-active', active);
      });
    });
    try { localStorage.setItem('vznk-lang', lang); } catch (e) {}
    if (!silent && lang !== 'uk') {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = lang === 'en'
        ? 'Prototype: interface + homepage translated. Full content lives in the CMS.'
        : 'Прототип: переведены интерфейс и главная. Остальной контент — в CMS.';
      document.body.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('is-visible'));
      setTimeout(() => { toast.classList.remove('is-visible'); setTimeout(() => toast.remove(), 300); }, 3600);
    }
  };

  $$('[data-lang-switch]').forEach((group) => {
    const btn = $('.lang-btn', group);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = group.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(isOpen));
      });
      document.addEventListener('click', () => group.classList.remove('is-open'));
    }
    group.addEventListener('click', (e) => {
      const option = e.target.closest('[data-lang]');
      if (!option) return;
      applyLang(option.dataset.lang);
      group.classList.remove('is-open');
    });
  });

  let saved = 'uk';
  try { saved = localStorage.getItem('vznk-lang') || 'uk'; } catch (e) {}
  if (saved !== 'uk') applyLang(saved, true);
})();
