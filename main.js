/* ============================================================
   MAKE IT SPAIN — main.js
   All scroll animations, interactions & effects
   ============================================================ */

/* ──────────────────────────────────────────────────────────
   PARTIAL INJECTION
   Fetches partials/header.html and partials/footer.html
   and injects them into every page automatically.
   Works on Hostinger (real server) and VS Code Live Server.
   ────────────────────────────────────────────────────────── */
const loadPartial = (url, placeholderId) => {
  const placeholder = document.getElementById(placeholderId);
  if (!placeholder) return Promise.resolve();
  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`Could not load ${url}`);
      return res.text();
    })
    .then(html => {
      placeholder.outerHTML = html;
    })
    .catch(err => console.warn('Partial load error:', err));
};

// Load header + footer, THEN initialise everything else
Promise.all([
  loadPartial('partials/header.html', 'header-placeholder'),
  loadPartial('partials/footer.html', 'footer-placeholder'),
]).then(() => {
  initSite();
});

/* ──────────────────────────────────────────────────────────
   All site logic wrapped in initSite() so it runs AFTER
   the header and footer are injected into the DOM
   ────────────────────────────────────────────────────────── */
function initSite() {

  // ============================================================
  // 1. HEADER — Transparent → Solid on scroll
  // ============================================================
  const header = document.querySelector('.site-header');

  if (header) {
    const onHeaderScroll = () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
    onHeaderScroll(); // run on load
  }


  // ============================================================
  // 2. HAMBURGER MENU — Mobile fullscreen open/close
  // ============================================================
  const hamburgerBtn  = document.querySelector('.hamburger-btn');
  const mobileMenu    = document.querySelector('.mobile-menu');
  const mobileLinks   = document.querySelectorAll('.mobile-menu-links a');

  if (hamburgerBtn && mobileMenu) {

    const openMenu = () => {
      hamburgerBtn.classList.add('is-open');
      mobileMenu.classList.add('is-open');
      document.body.style.overflow = 'hidden'; // prevent bg scroll
    };

    const closeMenu = () => {
      hamburgerBtn.classList.remove('is-open');
      mobileMenu.classList.remove('is-open');
      document.body.style.overflow = '';
    };

    hamburgerBtn.addEventListener('click', () => {
      hamburgerBtn.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    // Close on nav link click
    mobileLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }


  // ============================================================
  // 3. FADE UP — Scroll-triggered reveal animations
  //    Adds .is-visible when element enters viewport
  // ============================================================
  const fadeUpEls = document.querySelectorAll('.fade-up');

  if (fadeUpEls.length > 0) {
    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          fadeObserver.unobserve(entry.target); // animate once
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    });

    fadeUpEls.forEach(el => fadeObserver.observe(el));
  }


  // ============================================================
  // 4. NUMBER COUNTER — Counts up when stat section is visible
  // ============================================================
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');

  if (statNumbers.length > 0) {
    const countUp = (el) => {
      const target   = parseInt(el.dataset.target, 10);
      const suffix   = el.dataset.suffix || '';
      const duration = 1800; // ms
      const start    = performance.now();

      const tick = (now) => {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased    = 1 - Math.pow(1 - progress, 3);
        const current  = Math.round(eased * target);
        el.textContent = current.toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          countUp(entry.target);
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => statsObserver.observe(el));
  }


  // ============================================================
  // 5. STACKING SERVICE CARDS
  //    Cards stack one on top of each other as you scroll.
  //    Page only continues scrolling after all cards are stacked.
  //    Uses CSS sticky — JS just triggers the section height.
  // ============================================================
  const servicesCards = document.querySelectorAll('.service-card');

  // The stacking effect is driven purely by CSS `position: sticky`
  // with incrementing `top` values set in the stylesheet.
  // No extra JS needed for the basic stacking.
  // We DO add a scroll-reveal for each card entering from below:
  if (servicesCards.length > 0) {
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity    = '1';
          entry.target.style.transform  = 'translateY(0) scale(1)';
        }
      });
    }, { threshold: 0.1 });

    servicesCards.forEach((card, i) => {
      card.style.opacity   = '0';
      card.style.transform = 'translateY(40px) scale(0.97)';
      card.style.transition = `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`;
      cardObserver.observe(card);
    });
  }


  // ============================================================
  // 6. HORIZONTAL SCROLL-JACK GALLERY
  //    Page freezes → gallery scrolls left → page resumes
  // ============================================================
  const worksWrapper = document.querySelector('.works-scroll-wrapper');
  const worksTrack   = document.querySelector('.works-scroll-track');

  if (worksWrapper && worksTrack) {

    // Set wrapper height = extra scroll room for horizontal movement
    const setupWorksScroll = () => {
      const trackWidth    = worksTrack.scrollWidth;
      const viewportWidth = window.innerWidth;
      const scrollDistance = trackWidth - viewportWidth + 96; // 96 = padding
      // wrapper height = viewport height + total horizontal scroll distance
      worksWrapper.style.height = `${window.innerHeight + scrollDistance}px`;
      return scrollDistance;
    };

    let worksScrollDistance = setupWorksScroll();
    window.addEventListener('resize', () => {
      worksScrollDistance = setupWorksScroll();
    });

    const onWorksScroll = () => {
      if (!worksWrapper) return;
      const rect      = worksWrapper.getBoundingClientRect();
      const stickyTop = 0; // sticky top: 0

      // How far into the sticky zone are we?
      const scrolled = -rect.top;

      if (scrolled < 0 || scrolled > worksScrollDistance) return;

      // Map vertical scroll → horizontal translation
      const progress = scrolled / worksScrollDistance;
      const translateX = -progress * worksScrollDistance;

      worksTrack.style.transform = `translateX(${translateX}px)`;
    };

    window.addEventListener('scroll', onWorksScroll, { passive: true });
  }


  // ============================================================
  // 7. TICKER / RUNNING TEXT
  //    Pure CSS handles the animation (defined in styles.css).
  //    JS just duplicates the ticker content to make it seamless.
  // ============================================================
  const tickerTrack = document.querySelector('.ticker-track');

  if (tickerTrack) {
    // Duplicate content so the loop is seamless
    const original = tickerTrack.innerHTML;
    tickerTrack.innerHTML = original + original;
  }


  // ============================================================
  // 8. ROTATING CONTACT BADGE
  //    Handled by CSS @keyframes rotateBadge.
  //    JS adds a click → navigate to contact page.
  // ============================================================
  const badge = document.querySelector('.rotating-badge-inner');
  if (badge) {
    badge.addEventListener('click', () => {
      const contactPage = badge.dataset.href || 'contact.html';
      window.location.href = contactPage;
    });
    badge.style.cursor = 'pointer';
  }


  // ============================================================
  // 9. LOGO MARQUEE — Duplicate rows for seamless loop
  // ============================================================
  const marqueeTracks = document.querySelectorAll('.logo-marquee-track');

  marqueeTracks.forEach(track => {
    const original = track.innerHTML;
    track.innerHTML = original + original; // duplicate for seamless loop
  });


  // ============================================================
  // 10. SMOOTH ANCHOR SCROLL
  //     For same-page links like #about, #services
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 80;
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });


  // ============================================================
  // 11. ACTIVE NAV LINK — Highlights current page link
  // ============================================================
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks    = document.querySelectorAll('.nav-links a, .mobile-menu-links a');

  navLinks.forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage) {
      link.style.color = 'var(--color-accent)';
    }
  });


  // ============================================================
  // 12. PARALLAX — Subtle parallax on hero media
  // ============================================================
  const heroMedia = document.querySelector('.hero-media');

  if (heroMedia) {
    const onParallax = () => {
      const scrollY  = window.scrollY;
      const heroH    = heroMedia.offsetHeight;
      if (scrollY < heroH * 1.5) {
        const img = heroMedia.querySelector('img, video');
        if (img) {
          img.style.transform = `translateY(${scrollY * 0.2}px)`;
        }
      }
    };
    window.addEventListener('scroll', onParallax, { passive: true });
  }


  // ============================================================
  // 13. WORK CARD LABELS — Animate in on hover
  // ============================================================
  const workCards = document.querySelectorAll('.work-card');

  workCards.forEach(card => {
    const label = card.querySelector('.work-card-label');
    if (label) {
      label.style.transform  = 'translateY(8px)';
      label.style.opacity    = '0.85';
      label.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

      card.addEventListener('mouseenter', () => {
        label.style.transform = 'translateY(0)';
        label.style.opacity   = '1';
      });
      card.addEventListener('mouseleave', () => {
        label.style.transform = 'translateY(8px)';
        label.style.opacity   = '0.85';
      });
    }
  });


  // ============================================================
  // 14. CTA GRADIENT — Mouse-tracking gradient shift
  // ============================================================
  const ctaBanner = document.querySelector('.cta-banner');

  if (ctaBanner) {
    ctaBanner.addEventListener('mousemove', (e) => {
      const rect = ctaBanner.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      ctaBanner.style.setProperty('--mouse-x', `${x}%`);
      ctaBanner.style.setProperty('--mouse-y', `${y}%`);
    });
  }


  // ============================================================
  // 15. PAGE LOAD — Stagger hero elements in on load
  // ============================================================
  const heroHeading = document.querySelector('.hero-heading');
  const heroRight   = document.querySelector('.hero-right');
  const heroMediaEl = document.querySelector('.hero-media');

  const animateIn = (el, delay) => {
    if (!el) return;
    el.style.opacity   = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.8s ease ${delay}s, transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity   = '1';
        el.style.transform = 'translateY(0)';
      });
    });
  };

  animateIn(heroHeading, 0.1);
  animateIn(heroRight,   0.3);
  animateIn(heroMediaEl, 0.5);

} // end initSite()

// Kick everything off when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // partials are loaded and initSite() called inside the Promise.all above
});
