/**
 * Abhinaya PDP – Interactive JS
 * Handles: Image carousel (swipe + zoom), floating CTA visibility, ATC/Buy Now, toast, similar products scroll
 */
(function () {
  'use strict';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  document.addEventListener('DOMContentLoaded', function () {

    /* ── 1. Image Carousel ── */
    var track = $('#abhinayaCarouselTrack');
    var dots = $$('.abhinaya-carousel__dot');
    var prevBtn = $('#abhinayaCarouselPrev');
    var nextBtn = $('#abhinayaCarouselNext');
    var currentSlide = 0;
    var slideCount = $$('.abhinaya-carousel__slide').length;

    function updateDots(index) {
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === index);
      });
      currentSlide = index;
      if (prevBtn) prevBtn.hidden = index === 0;
      if (nextBtn) nextBtn.hidden = index === slideCount - 1;
    }

    function goToSlide(index) {
      if (!track || index < 0 || index >= slideCount) return;
      var slide = track.children[index];
      if (slide) {
        track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
      }
    }

    // Sync dots on scroll
    if (track) {
      var scrollTimer;
      track.addEventListener('scroll', function () {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {
          var scrollLeft = track.scrollLeft;
          var slideWidth = track.offsetWidth;
          var index = Math.round(scrollLeft / slideWidth);
          updateDots(Math.max(0, Math.min(index, slideCount - 1)));
        }, 50);
      }, { passive: true });
    }

    // Dot clicks
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        goToSlide(parseInt(this.dataset.index));
      });
    });

    // Arrow clicks
    if (prevBtn) prevBtn.addEventListener('click', function () { goToSlide(currentSlide - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goToSlide(currentSlide + 1); });

    /* ── 2. Pinch-to-Zoom + Double-Tap ── */
    var zoomWraps = $$('.abhinaya-carousel__zoom-wrap');
    zoomWraps.forEach(function (wrap) {
      var img = wrap.querySelector('.abhinaya-carousel__img');
      if (!img) return;

      var scale = 1;
      var posX = 0, posY = 0;
      var lastTap = 0;
      var initialDist = 0;
      var initialScale = 1;
      var startX = 0, startY = 0;
      var startPosX = 0, startPosY = 0;

      function setTransform() {
        img.style.transform = 'scale(' + scale + ') translate(' + posX + 'px, ' + posY + 'px)';
      }

      function resetZoom() {
        scale = 1;
        posX = 0;
        posY = 0;
        setTransform();
        wrap.classList.remove('is-zoomed');
        if (track) track.style.overflowX = '';
      }

      function clampPos() {
        var maxX = (scale - 1) * wrap.offsetWidth / (2 * scale);
        var maxY = (scale - 1) * wrap.offsetHeight / (2 * scale);
        posX = Math.max(-maxX, Math.min(maxX, posX));
        posY = Math.max(-maxY, Math.min(maxY, posY));
      }

      // Double tap to zoom
      wrap.addEventListener('touchend', function (e) {
        if (e.touches.length > 0) return;
        var now = Date.now();
        if (now - lastTap < 300) {
          e.preventDefault();
          if (scale > 1) {
            resetZoom();
          } else {
            scale = 2.5;
            wrap.classList.add('is-zoomed');
            if (track) track.style.overflowX = 'hidden';
            setTransform();
          }
        }
        lastTap = now;
      });

      // Pinch to zoom
      wrap.addEventListener('touchstart', function (e) {
        if (e.touches.length === 2) {
          e.preventDefault();
          initialDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          initialScale = scale;
        } else if (e.touches.length === 1 && scale > 1) {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          startPosX = posX;
          startPosY = posY;
        }
      }, { passive: false });

      wrap.addEventListener('touchmove', function (e) {
        if (e.touches.length === 2) {
          e.preventDefault();
          var dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          scale = Math.max(1, Math.min(3, initialScale * (dist / initialDist)));
          if (scale > 1) {
            wrap.classList.add('is-zoomed');
            if (track) track.style.overflowX = 'hidden';
          }
          clampPos();
          setTransform();
        } else if (e.touches.length === 1 && scale > 1) {
          e.preventDefault();
          posX = startPosX + (e.touches[0].clientX - startX) / scale;
          posY = startPosY + (e.touches[0].clientY - startY) / scale;
          clampPos();
          setTransform();
        }
      }, { passive: false });

      wrap.addEventListener('touchend', function (e) {
        if (scale <= 1.05) {
          resetZoom();
        }
      });
    });

    /* ── 3. Floating CTA – Visibility Logic ── */
    var floatingCta = $('#abhinayaFloatingCta');
    var sentinel = $('#abhinayaFloatingCtaSentinel');

    if (floatingCta && sentinel) {
      var ctaObserver = new IntersectionObserver(function (entries) {
        var entry = entries[0];
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          floatingCta.classList.add('is-hidden');
        } else {
          floatingCta.classList.remove('is-hidden');
        }
      }, { threshold: 0 });
      ctaObserver.observe(sentinel);
    }

    /* ── 4. Add to Cart ── */
    var atcBtn = $('#abhinayaAtcBtn');
    var toast = $('#abhinayaToast');
    var toastText = $('#abhinayaToastText');
    var cartCount = $('#abhinayaCartCount');

    function showToast(msg) {
      if (!toast) return;
      if (toastText) toastText.textContent = msg || 'Added to cart!';
      toast.hidden = false;
      requestAnimationFrame(function () {
        toast.classList.add('is-visible');
      });
      setTimeout(function () {
        toast.classList.remove('is-visible');
        setTimeout(function () { toast.hidden = true; }, 300);
      }, 3000);
    }

    function updateCartBadge(count) {
      if (!cartCount) return;
      cartCount.textContent = count;
      cartCount.hidden = count === 0;
    }

    function addToCart(variantId, quantity, properties, callback) {
      var body = {
        items: [{
          id: parseInt(variantId),
          quantity: quantity || 1
        }]
      };
      if (properties) body.items[0].properties = properties;

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        // Update cart count
        fetch('/cart.js')
          .then(function (r) { return r.json(); })
          .then(function (cart) { updateCartBadge(cart.item_count); });
        if (callback) callback(null, data);
      })
      .catch(function (err) {
        if (callback) callback(err);
      });
    }

    if (atcBtn) {
      atcBtn.addEventListener('click', function () {
        var variantId = this.dataset.variantId;
        if (!variantId || this.disabled) return;

        var properties = {};
        var giftToggle = $('#abhinayaGiftToggle');
        if (giftToggle && giftToggle.checked) {
          properties._gift_packaging = 'Yes';
        }

        this.textContent = 'Adding...';
        this.disabled = true;

        addToCart(variantId, 1, Object.keys(properties).length ? properties : null, function (err) {
          atcBtn.textContent = 'Add to Cart';
          atcBtn.disabled = false;
          if (!err) {
            showToast('Added to cart!');
          } else {
            showToast('Could not add to cart');
          }
        });
      });
    }

    /* ── 5. Buy Now ── */
    var buyBtn = $('#abhinayaBuyNowBtn');
    if (buyBtn) {
      buyBtn.addEventListener('click', function () {
        var variantId = this.dataset.variantId;
        if (!variantId || this.disabled) return;

        this.textContent = 'Redirecting...';
        this.disabled = true;

        addToCart(variantId, 1, null, function (err) {
          if (!err) {
            window.location.href = '/checkout';
          } else {
            buyBtn.textContent = 'Buy Now';
            buyBtn.disabled = false;
            showToast('Something went wrong');
          }
        });
      });
    }

    /* ── 6. Rating link -> smooth scroll to reviews ── */
    var ratingLink = $('#abhinayaRatingLink');
    if (ratingLink) {
      ratingLink.addEventListener('click', function (e) {
        e.preventDefault();
        var reviews = $('#abhinayaReviews');
        if (reviews) {
          reviews.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    /* ── 7. Similar Products – Infinite Scroll ── */
    var similarGrid = $('#abhinayaSimilarGrid');
    var similarLoader = $('#abhinayaSimilarLoader');
    var similarEnd = $('#abhinayaSimilarEnd');

    if (similarGrid) {
      var collectionHandle = similarGrid.dataset.collection;
      var excludeId = similarGrid.dataset.productId;
      var maxItems = parseInt(similarGrid.dataset.max) || 80;
      var similarPage = 1;
      var similarLoading = false;
      var similarHasMore = true;
      var loadedCount = similarGrid.querySelectorAll('.abhinaya-card').length;

      function loadMoreSimilar() {
        if (similarLoading || !similarHasMore || !collectionHandle || loadedCount >= maxItems) {
          if (loadedCount >= maxItems && similarEnd) similarEnd.hidden = false;
          return;
        }
        similarLoading = true;
        if (similarLoader) similarLoader.hidden = false;
        similarPage++;

        fetch('/collections/' + collectionHandle + '?page=' + similarPage + '&view=ajax-products')
          .then(function (res) { return res.text(); })
          .then(function (html) {
            if (similarLoader) similarLoader.hidden = true;
            similarLoading = false;

            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            var cards = doc.querySelectorAll('.abhinaya-card');

            if (cards.length === 0) {
              similarHasMore = false;
              if (similarEnd) similarEnd.hidden = false;
              return;
            }

            cards.forEach(function (card) {
              if (loadedCount >= maxItems) return;
              // Skip current product
              if (card.getAttribute('href') && card.getAttribute('href').indexOf(excludeId) === -1) {
                similarGrid.appendChild(card.cloneNode(true));
                loadedCount++;
              }
            });

            if (loadedCount >= maxItems) {
              similarHasMore = false;
              if (similarEnd) similarEnd.hidden = false;
            }
          })
          .catch(function () {
            if (similarLoader) similarLoader.hidden = true;
            similarLoading = false;
          });
      }

      // IntersectionObserver for similar products infinite scroll
      var similarSentinel = document.createElement('div');
      similarSentinel.style.height = '1px';
      similarGrid.parentNode.appendChild(similarSentinel);

      var scrollObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) loadMoreSimilar();
      }, { rootMargin: '300px' });
      scrollObs.observe(similarSentinel);
    }

  });
})();
