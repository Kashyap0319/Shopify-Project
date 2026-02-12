/**
 * Abhinaya Saree Store – Interactive JS
 * Handles: nav drawer, language sheet, sort/filter sheets, sticky header, search clear, infinite scroll
 */
(function () {
  'use strict';

  /* ── Helpers ── */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function on(el, evt, fn) { if (el) el.addEventListener(evt, fn); }
  function toggleSheet(overlay, sheet, open) {
    if (open) {
      overlay.classList.add('is-open');
      sheet.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    } else {
      overlay.classList.remove('is-open');
      sheet.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {

    /* ── 1. Sticky header shadow ── */
    var header = $('#AbhinayaHeader');
    if (header) {
      var lastScroll = 0;
      window.addEventListener('scroll', function () {
        var y = window.scrollY;
        if (y > 10) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
        lastScroll = y;
      }, { passive: true });
    }

    /* ── 2. Navigation drawer ── */
    var menuBtn = $('#abhinayaMenuBtn');
    var navOverlay = $('#abhinayaNavOverlay');
    var navDrawer = $('#abhinayaNavDrawer');
    var navClose = $('#abhinayaNavClose');

    function openNav() {
      navOverlay && navOverlay.classList.add('is-open');
      navDrawer && navDrawer.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function closeNav() {
      navOverlay && navOverlay.classList.remove('is-open');
      navDrawer && navDrawer.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    on(menuBtn, 'click', openNav);
    on(navOverlay, 'click', closeNav);
    on(navClose, 'click', closeNav);

    /* ── 2b. Nav drawer accordions – only one open at a time ── */
    var navAccordions = document.querySelectorAll('.abhinaya-nav-drawer__accordion');
    navAccordions.forEach(function (details) {
      details.addEventListener('toggle', function () {
        if (this.open) {
          navAccordions.forEach(function (other) {
            if (other !== details && other.open) other.open = false;
          });
        }
      });
    });

    /* ── 3. Search clear button ── */
    var searchInput = $('.abhinaya-header__search-input');
    var searchClear = $('.abhinaya-header__search-clear');
    if (searchInput && searchClear) {
      searchInput.addEventListener('input', function () {
        searchClear.hidden = !this.value;
      });
      searchClear.addEventListener('click', function () {
        searchInput.value = '';
        searchClear.hidden = true;
        searchInput.focus();
      });
    }

    /* ── 4. Language bottom sheet ── */
    var langBtn = $('#abhinayaLangBtn');
    var langOverlay = $('#abhinayaLangOverlay');
    var langSheet = $('#abhinayaLangSheet');
    var langClose = $('#abhinayaLangClose');
    var langLabel = $('#abhinayaLangLabel');

    on(langBtn, 'click', function () { toggleSheet(langOverlay, langSheet, true); });
    on(langOverlay, 'click', function () { toggleSheet(langOverlay, langSheet, false); });
    on(langClose, 'click', function () { toggleSheet(langOverlay, langSheet, false); });

    // Language option click
    var langOpts = document.querySelectorAll('.abhinaya-lang-sheet__opt');
    var storedLang = localStorage.getItem('abhinaya_lang') || 'en';

    langOpts.forEach(function (opt) {
      if (opt.dataset.lang === storedLang) opt.classList.add('is-active');
      opt.addEventListener('click', function () {
        langOpts.forEach(function (o) { o.classList.remove('is-active'); });
        this.classList.add('is-active');
        localStorage.setItem('abhinaya_lang', this.dataset.lang);
        if (langLabel) langLabel.textContent = this.dataset.lang === 'te' ? 'తెలుగు' : 'EN';
        toggleSheet(langOverlay, langSheet, false);
      });
    });

    /* ── 5. Sort bottom sheet ── */
    var sortBtn = $('#abhinayaSortBtn');
    var sortOverlay = $('#abhinayaSortOverlay');
    var sortSheet = $('#abhinayaSortSheet');
    var sortClose = $('#abhinayaSortClose');

    on(sortBtn, 'click', function () { toggleSheet(sortOverlay, sortSheet, true); });
    on(sortOverlay, 'click', function () { toggleSheet(sortOverlay, sortSheet, false); });
    on(sortClose, 'click', function () { toggleSheet(sortOverlay, sortSheet, false); });

    // Sort selection
    var sortRadios = document.querySelectorAll('#abhinayaSortSheet input[name="sort"]');
    sortRadios.forEach(function (radio) {
      radio.addEventListener('change', function () {
        var val = this.value;
        // Update URL with sort parameter
        var url = new URL(window.location.href);
        url.searchParams.set('sort_by', val);
        window.location.href = url.toString();
      });
    });

    /* ── 6. Filter bottom sheet ── */
    var filterBtn = $('#abhinayaFilterBtn');
    var filterOverlay = $('#abhinayaFilterOverlay');
    var filterSheet = $('#abhinayaFilterSheet');
    var filterClose = $('#abhinayaFilterClose');
    var filterClear = $('#abhinayaFilterClear');
    var filterApply = $('#abhinayaFilterApply');

    on(filterBtn, 'click', function () { toggleSheet(filterOverlay, filterSheet, true); });
    on(filterOverlay, 'click', function () { toggleSheet(filterOverlay, filterSheet, false); });
    on(filterClose, 'click', function () { toggleSheet(filterOverlay, filterSheet, false); });

    on(filterClear, 'click', function () {
      var checks = filterSheet ? filterSheet.querySelectorAll('input[type="checkbox"]') : [];
      checks.forEach(function (c) { c.checked = false; });
      var priceMin = $('#abhinayaPriceMin');
      var priceMax = $('#abhinayaPriceMax');
      if (priceMin) priceMin.value = '';
      if (priceMax) priceMax.value = '';
      var badge = $('#abhinayaFilterBadge');
      if (badge) { badge.hidden = true; badge.textContent = '0'; }
    });

    on(filterApply, 'click', function () {
      // Count active filters
      var count = 0;
      var checks = filterSheet ? filterSheet.querySelectorAll('input[type="checkbox"]:checked') : [];
      count += checks.length;
      var priceMin = $('#abhinayaPriceMin');
      var priceMax = $('#abhinayaPriceMax');
      if (priceMin && priceMin.value) count++;
      if (priceMax && priceMax.value) count++;

      var badge = $('#abhinayaFilterBadge');
      if (badge) {
        badge.textContent = count;
        badge.hidden = count === 0;
      }

      toggleSheet(filterOverlay, filterSheet, false);
      // In a real implementation, this would filter products via AJAX or URL params
    });

    /* ── 7. Sticky sort/filter row ── */
    var sfRow = $('#abhinayaSortFilter');
    var ytStrip = $('#abhinayaYtStrip');
    if (sfRow && ytStrip) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            sfRow.classList.add('is-sticky');
          } else {
            sfRow.classList.remove('is-sticky');
          }
        });
      }, { threshold: 0, rootMargin: '-112px 0px 0px 0px' });
      observer.observe(ytStrip);
    }

    /* ── 8. Infinite scroll (basic) ── */
    var feedGrid = $('#abhinayaFeedGrid');
    var feedLoader = $('#abhinayaFeedLoader');
    var currentPage = 1;
    var loading = false;
    var hasMore = true;

    function loadMoreProducts() {
      if (loading || !hasMore || !feedGrid) return;
      loading = true;
      if (feedLoader) feedLoader.hidden = false;

      currentPage++;
      var url = window.location.pathname + '?page=' + currentPage + '&view=ajax-products';

      fetch(url)
        .then(function (res) { return res.text(); })
        .then(function (html) {
          if (feedLoader) feedLoader.hidden = true;
          loading = false;
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, 'text/html');
          var newCards = doc.querySelectorAll('.abhinaya-card');
          if (newCards.length === 0) {
            hasMore = false;
            return;
          }
          newCards.forEach(function (card) {
            feedGrid.appendChild(card.cloneNode(true));
          });
        })
        .catch(function () {
          if (feedLoader) feedLoader.hidden = true;
          loading = false;
          var error = $('#abhinayaFeedError');
          if (error) error.hidden = false;
        });
    }

    // Intersection observer for infinite scroll
    if (feedGrid) {
      var sentinel = document.createElement('div');
      sentinel.id = 'abhinayaFeedSentinel';
      sentinel.style.height = '1px';
      feedGrid.parentNode.appendChild(sentinel);

      var scrollObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          loadMoreProducts();
        }
      }, { rootMargin: '200px' });
      scrollObserver.observe(sentinel);
    }

    // Retry button
    on($('#abhinayaFeedRetry'), 'click', function () {
      var error = $('#abhinayaFeedError');
      if (error) error.hidden = true;
      loadMoreProducts();
    });

  });
})();
