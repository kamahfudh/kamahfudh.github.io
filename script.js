(function () {
  var nav = document.querySelector('.site-nav');
  var sentinel = document.querySelector('.scroll-sentinel');
  if (nav && sentinel && 'IntersectionObserver' in window) {
    var navIo = new IntersectionObserver(function (entries) {
      nav.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }, { threshold: 0 });
    navIo.observe(sentinel);
  }

  var burger = document.querySelector('[data-nav-burger]');
  var sheet = document.querySelector('[data-mobile-sheet]');
  if (burger && sheet) {
    var setMenu = function (open) {
      burger.classList.toggle('is-open', open);
      sheet.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    burger.addEventListener('click', function () {
      setMenu(!sheet.classList.contains('is-open'));
    });
    sheet.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contactForm.name.value.trim();
      var email = contactForm.email.value.trim();
      var company = contactForm.company.value.trim();
      var message = contactForm.message.value.trim();
      var subject = 'Project enquiry from ' + (name || 'website visitor');
      var bodyLines = [
        'Name: ' + name,
        'Email: ' + email
      ];
      if (company) bodyLines.push('Company: ' + company);
      bodyLines.push('', message);
      var mailto = 'mailto:mahfudhkhoiri2906@gmail.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(bodyLines.join('\n'));
      window.location.href = mailto;
    });
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    document.querySelectorAll('.reel video, .device-screen video').forEach(function (v) {
      v.removeAttribute('autoplay');
      v.pause();
    });
  }

  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!reduce && canHover) {
    document.querySelectorAll('.mockup').forEach(function (el) {
      var maxTilt = 6;
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var rx = (0.5 - py) * maxTilt * 2;
        var ry = (px - 0.5) * maxTilt * 2;
        el.style.transition = 'box-shadow .45s ease';
        el.style.transform = 'perspective(1200px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-6px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1), box-shadow .45s ease';
        el.style.transform = '';
      });
    });
  }

  var typeEl = document.querySelector('.type-text');
  if (typeEl && !reduce) {
    var typeWords = (typeEl.getAttribute('data-words') || '')
      .split(',').map(function (w) { return w.trim(); }).filter(Boolean);
    if (typeWords.length > 1) {
      var typeSpeed = 90;
      var deleteSpeed = 45;
      var holdFull = 1700;
      var holdEmpty = 350;
      var wordIndex = 0;

      var typeChar = function () {
        var word = typeWords[wordIndex];
        var i = 0;
        var step = function () {
          typeEl.textContent = word.slice(0, i);
          if (i < word.length) {
            i++;
            setTimeout(step, typeSpeed);
          } else {
            setTimeout(deleteChar, holdFull);
          }
        };
        step();
      };

      var deleteChar = function () {
        var word = typeWords[wordIndex];
        var i = word.length;
        var step = function () {
          typeEl.textContent = word.slice(0, i);
          if (i > 0) {
            i--;
            setTimeout(step, deleteSpeed);
          } else {
            wordIndex = (wordIndex + 1) % typeWords.length;
            setTimeout(typeChar, holdEmpty);
          }
        };
        step();
      };

      setTimeout(deleteChar, holdFull);
    }
  }

  var pageTransition = document.querySelector('.page-transition');
  if (pageTransition && !reduce) {
    var ptCells = Array.prototype.slice.call(pageTransition.querySelectorAll('.pt-cell'));
    var PT_COLUMNS = 4;
    var PT_STAGGER = 130;
    var PT_HOLD = 350;

    ptCells.forEach(function (cell, i) {
      cell.style.setProperty('--pt-delay', (i % PT_COLUMNS) * PT_STAGGER + 'ms');
    });

    setTimeout(function () {
      ptCells.forEach(function (cell) { cell.classList.add('pt-out'); });
    }, PT_HOLD);
  }

  var revealEls = document.querySelectorAll('.reveal');
  if (!reduce && 'IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }
})();

(function () {
  var CV_API_URL = 'https://script.google.com/macros/s/AKfycbwd5uic5U1bJv--e2Q9VFFGYrEwz3PjRmE-379NRP-nCKr1G5_rvkRLR4jMdjJyRvvo/exec';

  var modal = document.querySelector('[data-cv-modal]');
  if (!modal) return;

  var openBtn = document.querySelector('[data-cv-modal-open]');
  var closeEls = modal.querySelectorAll('[data-cv-modal-close]');
  var steps = modal.querySelectorAll('[data-cv-step]');

  var showStep = function (name) {
    steps.forEach(function (s) { s.hidden = s.getAttribute('data-cv-step') !== name; });
  };
  var openModal = function () {
    showStep('request');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  var closeModal = function () {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  if (openBtn) openBtn.addEventListener('click', openModal);
  closeEls.forEach(function (el) { el.addEventListener('click', closeModal); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
  });

  modal.querySelectorAll('[data-cv-goto-verify]').forEach(function (el) {
    el.addEventListener('click', function () { showStep('verify'); });
  });
  modal.querySelectorAll('[data-cv-goto-request]').forEach(function (el) {
    el.addEventListener('click', function () { showStep('request'); });
  });

  var postToBackend = function (payload) {
    return fetch(CV_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function (res) { return res.json(); });
  };

  var setBusy = function (form, busy, idleLabel, busyLabel) {
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = busy;
    btn.textContent = busy ? busyLabel : idleLabel;
  };

  var requestForm = modal.querySelector('[data-cv-request-form]');
  var requestError = modal.querySelector('[data-cv-request-error]');
  if (requestForm) {
    requestForm.addEventListener('submit', function (e) {
      e.preventDefault();
      requestError.hidden = true;
      setBusy(requestForm, true, 'Request access', 'Sending…');
      postToBackend({
        action: 'request',
        name: requestForm.name.value.trim(),
        email: requestForm.email.value.trim()
      }).then(function (res) {
        if (res.ok) {
          showStep('sent');
        } else {
          requestError.textContent = res.error || 'Something went wrong. Please try again.';
          requestError.hidden = false;
        }
      }).catch(function () {
        requestError.textContent = 'Network error. Please try again.';
        requestError.hidden = false;
      }).then(function () {
        setBusy(requestForm, false, 'Request access', 'Sending…');
      });
    });
  }

  var verifyForm = modal.querySelector('[data-cv-verify-form]');
  var verifyError = modal.querySelector('[data-cv-verify-error]');
  if (verifyForm) {
    verifyForm.addEventListener('submit', function (e) {
      e.preventDefault();
      verifyError.hidden = true;
      setBusy(verifyForm, true, 'Unlock & download', 'Checking…');
      postToBackend({
        action: 'verify',
        email: verifyForm.email.value.trim(),
        passcode: verifyForm.passcode.value.trim()
      }).then(function (res) {
        if (res.ok) {
          var byteChars = atob(res.base64);
          var byteNumbers = new Array(byteChars.length);
          for (var i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
          var blob = new Blob([new Uint8Array(byteNumbers)], { type: res.mime || 'application/pdf' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = res.filename || 'CV.pdf';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
          closeModal();
        } else {
          verifyError.textContent = res.error || 'Invalid email or passcode.';
          verifyError.hidden = false;
        }
      }).catch(function () {
        verifyError.textContent = 'Network error. Please try again.';
        verifyError.hidden = false;
      }).then(function () {
        setBusy(verifyForm, false, 'Unlock & download', 'Checking…');
      });
    });
  }
})();
