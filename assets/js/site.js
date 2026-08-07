(function () {
  'use strict';

  var scriptPromises = {};

  function loadScript(src) {
    if (scriptPromises[src]) return scriptPromises[src];

    scriptPromises[src] = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = function () {
        reject(new Error('Unable to load ' + src));
      };
      document.body.appendChild(script);
    });

    return scriptPromises[src];
  }

  function setupSearch() {
    var toggle = document.querySelector('.search__toggle');
    var search = document.querySelector('.search-content');
    if (!toggle || !search) return;
    var initialContent = document.querySelector('.initial-content');
    var input = search.querySelector('.search-input');

    function setSearchOpen(isOpen) {
      search.classList.toggle('is--visible', isOpen);
      if (initialContent) initialContent.classList.toggle('is--hidden', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      if (input) {
        input.tabIndex = isOpen ? 0 : -1;
        if (isOpen) window.setTimeout(function () { input.focus(); }, 0);
      }
    }

    function loadSearch() {
      if (search.dataset.searchReady === 'true' || search.dataset.searchLoading === 'true') return;

      search.dataset.searchLoading = 'true';
      search.setAttribute('aria-busy', 'true');
      loadScript('/assets/js/lunr/lunr.min.js')
        .then(function () { return loadScript('/assets/js/lunr/lunr-store.js'); })
        .then(function () { return loadScript('/assets/js/search-app.js'); })
        .then(function () {
          search.dataset.searchReady = 'true';
        })
        .catch(function () {
          search.dataset.searchError = 'true';
          var input = search.querySelector('.search-input');
          if (input) input.placeholder = '搜索暂时不可用，请稍后重试';
        })
        .finally(function () {
          search.dataset.searchLoading = 'false';
          search.removeAttribute('aria-busy');
        });
    }

    toggle.addEventListener('click', function () {
      var isOpen = !search.classList.contains('is--visible');
      setSearchOpen(isOpen);
      if (isOpen) loadSearch();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && search.classList.contains('is--visible')) {
        event.preventDefault();
        setSearchOpen(false);
        toggle.focus();
      }
    });
  }

  function setupGreedyNavigation() {
    var nav = document.querySelector('nav.greedy-nav');
    if (!nav) return;
    var visible = nav.querySelector('.visible-links');
    var hidden = nav.querySelector('.hidden-links');
    var toggle = nav.querySelector('.greedy-nav__toggle');
    if (!visible || !hidden || !toggle) return;

    function closeMenu() {
      hidden.classList.add('hidden');
      toggle.classList.remove('close');
      toggle.setAttribute('aria-expanded', 'false');
    }

    function fitNavigation() {
      closeMenu();
      while (hidden.firstElementChild) visible.appendChild(hidden.firstElementChild);
      toggle.classList.remove('hidden');
      var forceMenu = window.matchMedia('(max-width: 48em)').matches;
      if (forceMenu) {
        while (visible.lastElementChild) hidden.prepend(visible.lastElementChild);
        return;
      }

      function requiredWidth() {
        var fixed = ['.site-logo', '.site-title', '.search__toggle', '.greedy-nav__toggle'];
        var width = fixed.reduce(function (total, selector) {
          var element = nav.querySelector(selector);
          return total + (element ? element.getBoundingClientRect().width : 0);
        }, 0);
        Array.prototype.forEach.call(visible.children, function (item) {
          width += item.getBoundingClientRect().width;
        });
        return width + 48;
      }

      while (requiredWidth() > nav.clientWidth && visible.lastElementChild) {
        hidden.prepend(visible.lastElementChild);
      }
      if (!hidden.firstElementChild) toggle.classList.add('hidden');
    }

    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', function () {
      var open = hidden.classList.contains('hidden');
      hidden.classList.toggle('hidden', !open);
      toggle.classList.toggle('close', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    hidden.addEventListener('click', closeMenu);
    document.addEventListener('click', function (event) {
      if (!nav.contains(event.target)) closeMenu();
    });

    if ('ResizeObserver' in window) {
      new ResizeObserver(fitNavigation).observe(nav);
    } else {
      window.addEventListener('resize', fitNavigation);
    }
    fitNavigation();
  }

  function setupAuthorProfile() {
    document.querySelectorAll('.author__urls-wrapper').forEach(function (wrapper) {
      var toggle = wrapper.querySelector('button');
      var urls = wrapper.querySelector('.author__urls');
      if (!toggle || !urls) return;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', function () {
        var open = urls.classList.toggle('is--visible');
        toggle.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
      });
    });
  }

  function setupHeaderLinks() {
    var namespace = 'http://www.w3.org/2000/svg';
    document.querySelectorAll('.page__content h2[id], .page__content h3[id], .page__content h4[id], .page__content h5[id], .page__content h6[id]').forEach(function (heading) {
      var link = document.createElement('a');
      var label = '链接到“' + heading.textContent.trim() + '”';
      link.className = 'header-link';
      link.href = '#' + encodeURIComponent(heading.id);
      link.title = label;
      link.setAttribute('aria-label', label);
      var icon = document.createElementNS(namespace, 'svg');
      icon.setAttribute('class', 'icon icon--link');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('aria-hidden', 'true');
      icon.setAttribute('focusable', 'false');
      var path = document.createElementNS(namespace, 'path');
      path.setAttribute('fill', 'currentColor');
      path.setAttribute('d', 'M10.59 13.41a2 2 0 0 0 2.82 0l3-3a2 2 0 1 0-2.82-2.82l-1.17 1.17-1.42-1.42 1.17-1.17a4 4 0 0 1 5.66 5.66l-3 3a4 4 0 0 1-5.66 0l-.59-.59L10 12.83l.59.58Zm2.82-2.82-1.42 1.42-.58-.58a2 2 0 0 0-2.82 0l-3 3a2 2 0 1 0 2.82 2.82l1.17-1.17L11 17.49l-1.17 1.17a4 4 0 0 1-5.66-5.66l3-3a4 4 0 0 1 5.66 0l.58.59Z');
      icon.appendChild(path);
      link.appendChild(icon);
      heading.appendChild(link);
    });
  }

  function setupShareLinks() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('[data-share-popup]');
      if (!link) return;
      event.preventDefault();
      window.open(link.href, 'share-window', 'left=20,top=20,width=500,height=500,toolbar=1,resizable=1');
    });
  }

  function setupCurrentYear() {
    var year = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      timeZone: 'Asia/Shanghai'
    }).format(new Date());
    document.querySelectorAll('[data-current-year]').forEach(function (element) {
      element.dateTime = year;
      element.textContent = year;
    });
  }

  function setupPageLoader() {
    function markPageReady() {
      window.requestAnimationFrame(function () {
        document.body.classList.add('is-page-ready');
      });
    }

    document.addEventListener('click', function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var link = event.target.closest('a[href]');
      if (!link || link.target || link.hasAttribute('download')) return;

      var destination = new URL(link.href, window.location.href);
      var isSameDocument = destination.pathname === window.location.pathname && destination.search === window.location.search;
      if (destination.origin !== window.location.origin || isSameDocument) return;

      document.body.classList.remove('is-page-ready');
    });

    window.addEventListener('pageshow', markPageReady);
    markPageReady();
  }

  setupGreedyNavigation();
  setupSearch();
  setupAuthorProfile();
  setupHeaderLinks();
  setupShareLinks();
  setupCurrentYear();
  setupPageLoader();
}());
