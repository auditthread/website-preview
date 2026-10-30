// Cookie choice and Google Analytics, loaded only after the visitor accepts.
//
// The GA measurement ID comes from <html data-ga-id="...">. The live site sets it;
// the draft preview doesn't, so the banner works there but nothing is sent to GA.
// The choice is kept in localStorage. Any element with [data-cookie-settings]
// (the privacy policy has one) reopens the banner.
(() => {
  const KEY = 'auditthread-cookies';
  const GA_ID = document.documentElement.dataset.gaId || '';
  const PRIVACY = '/legal/privacy/#cookies';

  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const save = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode: ask again next time */ } };

  function loadAnalytics() {
    if (!GA_ID || window.auditthreadGA) return;
    window.auditthreadGA = true;
    window['ga-disable-' + GA_ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  function stopAnalytics() {
    if (GA_ID) window['ga-disable-' + GA_ID] = true;
    const host = location.hostname;
    const parts = host.split('.');
    const domains = ['', host, '.' + host];
    if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      if (!name.startsWith('_ga')) return;
      domains.forEach((d) => {
        document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }

  let banner = null;

  function hide() {
    if (!banner) return;
    banner.classList.remove('is-visible');
    const b = banner;
    setTimeout(() => { b.hidden = true; }, 250);
  }

  function choose(value) {
    save(value);
    if (value === 'accepted') loadAnalytics(); else stopAnalytics();
    hide();
  }

  function build() {
    banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie choice');
    banner.hidden = true;

    const text = document.createElement('p');
    text.append('We use analytics cookies to see which pages are useful. ');
    const more = document.createElement('a');
    more.href = PRIVACY;
    more.textContent = 'More';
    text.append(more);

    const actions = document.createElement('div');
    actions.className = 'cookie-actions';
    const no = document.createElement('button');
    no.type = 'button';
    no.className = 'cookie-no';
    no.textContent = 'No thanks';
    no.addEventListener('click', () => choose('declined'));
    const yes = document.createElement('button');
    yes.type = 'button';
    yes.className = 'cookie-yes';
    yes.textContent = 'Accept';
    yes.addEventListener('click', () => choose('accepted'));
    actions.append(no, yes);

    banner.append(text, actions);
    document.body.append(banner);
  }

  function show(delay) {
    if (!banner) build();
    banner.hidden = false;
    setTimeout(() => banner.classList.add('is-visible'), delay);
  }

  function start() {
    const choice = read();
    if (choice === 'accepted') loadAnalytics();
    else if (choice !== 'declined') show(700);

    document.querySelectorAll('[data-cookie-settings]').forEach((el) => {
      el.addEventListener('click', (e) => { e.preventDefault(); show(20); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
