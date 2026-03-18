(function () {
  var dataEl = document.getElementById('members-data');
  if (!dataEl) return;

  var membersJson;
  try { membersJson = JSON.parse(dataEl.textContent); } catch (e) { return; }

  var PER_PAGE = 4;
  var MAX_PAGES = 10;
  var INTERVAL = 20000;
  var members = membersJson.slice().sort(function () { return Math.random() - 0.5; });
  var pageCount = Math.min(Math.ceil(members.length / PER_PAGE), MAX_PAGES);
  var current = 0;
  var timer;

  var grid   = document.getElementById('members-grid');
  var dotsEl = document.getElementById('members-dots');
  if (!grid || !dotsEl) return;

  var ICON = {
    github:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>',
    twitter:  '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    linkedin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    website:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    ctftime:  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  };

  function buildCard(m) {
    var avatarHtml = m.avatarUrl
      ? '<div class="mc-avatar"><img src="' + m.avatarUrl + '" alt="' + m.name + '" class="mc-avatar-img" data-initials="' + m.initials + '"></div>'
      : '<div class="mc-avatar">' + m.initials + '</div>';

    var badge = m.verified
      ? '<svg class="mc-badge" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-label="Verified" role="img"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '';

    var skipRoles = ['verified', 'moderator', 'administrator'];
    var roles = m.roles
      .filter(function (r) { return !skipRoles.includes(r.toLowerCase()); })
      .slice(0, 3)
      .map(function (r) { return '<span class="mc-role">' + r + '</span>'; })
      .join('');

    var socials = [
      m.github   && { href: 'https://github.com/' + m.github,                                                    icon: ICON.github   },
      m.twitter  && { href: 'https://twitter.com/' + m.twitter,                                                  icon: ICON.twitter  },
      m.linkedin && { href: 'https://linkedin.com/in/' + m.linkedin,                                             icon: ICON.linkedin },
      m.website  && { href: m.website.startsWith('http') ? m.website : 'https://' + m.website,                  icon: ICON.website  },
      m.ctftime  && { href: m.ctftime.startsWith('http') ? m.ctftime : 'https://ctftime.org/user/' + m.ctftime, icon: ICON.ctftime  },
    ].filter(Boolean);

    var socialsHtml = socials.length
      ? '<div class="mc-socials">' + socials.map(function (s) {
          return '<a href="' + s.href + '" target="_blank" rel="noopener noreferrer" class="mc-social">' + s.icon + '</a>';
        }).join('') + '</div>'
      : '';

    var bio = m.bio ? '<p class="mc-bio">' + m.bio + '</p>' : '';

    return '<div class="mc-card">'
      + '<div class="mc-avatar-wrap">' + avatarHtml + '</div>'
      + '<div class="mc-body">'
      + '<div class="mc-header">'
      + '<div class="mc-name-row"><span class="mc-name">' + m.name + '</span>' + badge + '</div>'
      + '<span class="mc-handle">@' + m.handle + '</span>'
      + '</div>'
      + (roles ? '<div class="mc-roles">' + roles + '</div>' : '')
      + bio
      + socialsHtml
      + '</div>'
      + '</div>';
  }

  function attachAvatarFallbacks() {
    grid.querySelectorAll('img[data-initials]').forEach(function (img) {
      function fallback() {
        img.parentNode.textContent = img.dataset.initials || '?';
      }
      img.addEventListener('error', fallback);
      if (img.complete && img.naturalWidth === 0) fallback();
    });
  }

  function buildDots() {
    dotsEl.innerHTML = Array.from({ length: pageCount }, function (_, i) {
      return '<button class="mc-dot" data-i="' + i + '" aria-label="Page ' + (i + 1) + '" aria-pressed="' + (i === current) + '"></button>';
    }).join('');
    dotsEl.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        clearInterval(timer);
        goTo(+btn.dataset.i);
        startTimer();
      });
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { clearInterval(timer); goTo((current + 1) % pageCount); startTimer(); }
        if (e.key === 'ArrowLeft')  { clearInterval(timer); goTo((current - 1 + pageCount) % pageCount); startTimer(); }
      });
    });
  }

  function render() {
    var slice = members.slice(current * PER_PAGE, current * PER_PAGE + PER_PAGE);
    grid.innerHTML = slice.map(buildCard).join('');
    attachAvatarFallbacks();
    buildDots();
  }

  function goTo(page) {
    current = page;
    grid.setAttribute('aria-busy', 'true');
    grid.classList.add('opacity-0');
    setTimeout(function () {
      render();
      grid.classList.remove('opacity-0');
      grid.setAttribute('aria-busy', 'false');
    }, 300);
  }

  function startTimer() {
    timer = setInterval(function () { goTo((current + 1) % pageCount); }, INTERVAL);
  }

  goTo(0);
  if (pageCount > 1) startTimer();
})();
