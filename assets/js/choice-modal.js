(function () {
  'use strict';

  var modal = document.getElementById('choice-modal');
  if (!modal || window.__choiceModalInitialized) return;
  window.__choiceModalInitialized = true;

  var panel = modal.querySelector('.choice-modal__panel');
  var actions = modal.querySelector('.choice-modal__actions');
  var activeTrigger = null;
  var focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var allowedHosts = new Set([
    'mirrors.cqu.edu.cn',
    'mirrors-cqu-edu-cn.atrust.cqu.edu.cn',
    '172.19.1.50',
    '172-19-1-50.atrust.cqu.edu.cn',
    'lanunion.cqu.edu.cn',
    'lanunion-cqu-edu-cn.atrust.cqu.edu.cn'
  ]);

  function setPageInert(isInert) {
    Array.prototype.forEach.call(document.body.children, function (element) {
      if (element === modal || element.tagName === 'SCRIPT') return;
      element.inert = isInert;
      if (isInert) {
        element.dataset.modalAriaHidden = element.getAttribute('aria-hidden') || '';
        element.setAttribute('aria-hidden', 'true');
      } else if (element.dataset.modalAriaHidden) {
        element.setAttribute('aria-hidden', element.dataset.modalAriaHidden);
        delete element.dataset.modalAriaHidden;
      } else {
        element.removeAttribute('aria-hidden');
      }
    });
  }

  function validUrl(value) {
    try {
      var url = new URL(value, window.location.origin);
      var safeProtocol = url.protocol === 'http:' || url.protocol === 'https:';
      var cleanAuthority = !url.username && !url.password && !url.port;
      var cleanSuffix = !url.search && !url.hash;
      return safeProtocol && cleanAuthority && cleanSuffix && allowedHosts.has(url.hostname) ? url.href : null;
    } catch (error) {
      return null;
    }
  }

  function renderChoices(campusUrl, offcampusUrl) {
    actions.replaceChildren();
    [
      ['校内访问', campusUrl],
      ['校外访问', offcampusUrl]
    ].forEach(function (choice) {
      var link = document.createElement('a');
      link.className = 'choice-modal__button';
      link.href = choice[1];
      link.textContent = choice[0];
      actions.appendChild(link);
    });
  }

  function openModal(trigger) {
    var campusUrl = validUrl(trigger.dataset.choiceModalCampusUrl);
    var offcampusUrl = validUrl(trigger.dataset.choiceModalOffcampusUrl);
    if (!campusUrl || !offcampusUrl) return;

    activeTrigger = trigger;
    trigger.setAttribute('aria-expanded', 'true');
    renderChoices(campusUrl, offcampusUrl);
    modal.hidden = false;
    document.body.classList.add('is-modal-open');
    setPageInert(true);
    panel.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('is-modal-open');
    setPageInert(false);
    actions.replaceChildren();
    if (activeTrigger) {
      activeTrigger.setAttribute('aria-expanded', 'false');
      activeTrigger.focus();
      activeTrigger = null;
    }
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-choice-modal-open]');
    if (trigger) {
      event.preventDefault();
      openModal(trigger);
      return;
    }
    if (event.target.closest('[data-choice-modal-close]')) closeModal();
  });

  document.addEventListener('keydown', function (event) {
    if (modal.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;
    var focusable = Array.prototype.slice.call(modal.querySelectorAll(focusableSelector));
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}());
