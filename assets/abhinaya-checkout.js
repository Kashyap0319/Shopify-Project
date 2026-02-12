/**
 * Abhinaya Pre-Checkout JS
 * Handles: Phone OTP flow, Pincode lookup, Address validation, Payment method, Checkout redirect
 */
(function () {
  'use strict';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  document.addEventListener('DOMContentLoaded', function () {

    /* ── State ── */
    var state = {
      phoneVerified: false,
      phone: '',
      codFee: parseInt($('#abhinayaCodFeeRow span:last-child')?.textContent?.replace(/[^\d]/g, '') || '99'),
      paymentMethod: 'online'
    };

    /* ── Elements ── */
    var phoneInput = $('#abhinayaPhone');
    var sendOtpBtn = $('#abhinayaSendOtp');
    var otpRow = $('#abhinayaOtpRow');
    var otpDigits = $$('.abhinaya-checkout__otp-digit');
    var verifyBtn = $('#abhinayaVerifyOtp');
    var resendBtn = $('#abhinayaResendBtn');
    var resendTimer = $('#abhinayaResendTimer');
    var phoneVerified = $('#abhinayaPhoneVerified');
    var verifiedNum = $('#abhinayaVerifiedNum');
    var changePhoneBtn = $('#abhinayaChangePhone');
    var addressSection = $('#abhinayaAddressSection');
    var paymentSection = $('#abhinayaPaymentSection');
    var paymentOptions = $$('.abhinaya-checkout__payment-option');
    var codFeeRow = $('#abhinayaCodFeeRow');
    var subtotalEl = $('#abhinayaSubtotal');
    var totalEl = $('#abhinayaTotal');
    var ctaTotalEl = $('#abhinayaCtaTotal');
    var ctaBtn = $('#abhinayaCheckoutBtn');
    var toast = $('#abhinayaCheckoutToast');
    var toastText = $('#abhinayaCheckoutToastText');
    var pincodeInput = $('#abhinayaPincode');
    var pincodeHint = $('#abhinayaPincodeHint');
    var cityInput = $('#abhinayaCity');
    var stateInput = $('#abhinayaState');

    /* ── Toast ── */
    function showToast(msg) {
      if (!toast) return;
      if (toastText) toastText.textContent = msg;
      toast.hidden = false;
      requestAnimationFrame(function () {
        toast.classList.add('is-visible');
      });
      setTimeout(function () {
        toast.classList.remove('is-visible');
        setTimeout(function () { toast.hidden = true; }, 300);
      }, 3000);
    }

    /* ── 1. Phone & OTP ── */
    var resendInterval;

    function startResendTimer() {
      var seconds = 30;
      if (resendTimer) resendTimer.textContent = seconds;
      if (resendBtn) resendBtn.disabled = true;
      clearInterval(resendInterval);
      resendInterval = setInterval(function () {
        seconds--;
        if (resendTimer) resendTimer.textContent = seconds;
        if (seconds <= 0) {
          clearInterval(resendInterval);
          if (resendBtn) {
            resendBtn.disabled = false;
            resendBtn.textContent = 'Resend OTP';
          }
        }
      }, 1000);
    }

    if (sendOtpBtn) {
      sendOtpBtn.addEventListener('click', function () {
        var phone = phoneInput ? phoneInput.value.replace(/\D/g, '') : '';
        if (phone.length !== 10) {
          showToast('Enter a valid 10-digit mobile number');
          if (phoneInput) phoneInput.classList.add('is-error');
          return;
        }
        if (phoneInput) phoneInput.classList.remove('is-error');
        state.phone = phone;

        // UI: show OTP inputs
        this.textContent = 'Sent!';
        this.disabled = true;
        if (phoneInput) phoneInput.readOnly = true;
        if (otpRow) otpRow.hidden = false;
        startResendTimer();

        // Focus first OTP digit
        if (otpDigits.length > 0) otpDigits[0].focus();

        showToast('OTP sent to +91 ' + phone);

        // NOTE: Actual OTP sending requires backend (Firebase/MSG91/Twilio)
        // For now this is a UI-only flow. Any 4-digit code will "verify."
      });
    }

    // OTP digit auto-advance
    otpDigits.forEach(function (digit, i) {
      digit.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 1);
        if (this.value && i < otpDigits.length - 1) {
          otpDigits[i + 1].focus();
        }
      });
      digit.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !this.value && i > 0) {
          otpDigits[i - 1].focus();
        }
      });
    });

    // Verify OTP
    if (verifyBtn) {
      verifyBtn.addEventListener('click', function () {
        var code = '';
        otpDigits.forEach(function (d) { code += d.value; });
        if (code.length !== 4) {
          showToast('Enter the 4-digit OTP');
          return;
        }

        // NOTE: In production, verify OTP against backend.
        // For now, accept any 4-digit code.
        state.phoneVerified = true;
        clearInterval(resendInterval);

        // Show verified state
        if (otpRow) otpRow.hidden = true;
        if (sendOtpBtn) sendOtpBtn.hidden = true;
        if (phoneInput) phoneInput.hidden = true;
        var countryCode = $('.abhinaya-checkout__country-code');
        if (countryCode) countryCode.hidden = true;
        if (phoneVerified) {
          phoneVerified.hidden = false;
          if (verifiedNum) verifiedNum.textContent = '+91 ' + state.phone;
        }

        // Unlock address section
        if (addressSection) addressSection.classList.remove('abhinaya-checkout__section--locked');
        if (paymentSection) paymentSection.classList.remove('abhinaya-checkout__section--locked');

        showToast('Phone verified successfully!');
        updateCheckoutBtn();

        // Focus name field
        var nameInput = $('#abhinayaName');
        if (nameInput) nameInput.focus();
      });
    }

    // Change phone
    if (changePhoneBtn) {
      changePhoneBtn.addEventListener('click', function () {
        state.phoneVerified = false;
        state.phone = '';

        if (phoneVerified) phoneVerified.hidden = true;
        if (phoneInput) {
          phoneInput.hidden = false;
          phoneInput.readOnly = false;
          phoneInput.value = '';
        }
        var countryCode = $('.abhinaya-checkout__country-code');
        if (countryCode) countryCode.hidden = false;
        if (sendOtpBtn) {
          sendOtpBtn.hidden = false;
          sendOtpBtn.textContent = 'Send OTP';
          sendOtpBtn.disabled = false;
        }
        if (otpRow) otpRow.hidden = true;
        otpDigits.forEach(function (d) { d.value = ''; });

        // Lock sections again
        if (addressSection) addressSection.classList.add('abhinaya-checkout__section--locked');
        if (paymentSection) paymentSection.classList.add('abhinaya-checkout__section--locked');

        updateCheckoutBtn();
        if (phoneInput) phoneInput.focus();
      });
    }

    // Resend OTP
    if (resendBtn) {
      resendBtn.addEventListener('click', function () {
        otpDigits.forEach(function (d) { d.value = ''; });
        if (otpDigits.length > 0) otpDigits[0].focus();
        startResendTimer();
        showToast('OTP resent to +91 ' + state.phone);
      });
    }

    /* ── 2. Pincode Lookup ── */
    var pincodeTimeout;
    if (pincodeInput) {
      pincodeInput.addEventListener('input', function () {
        var pin = this.value.replace(/\D/g, '');
        this.value = pin;
        clearTimeout(pincodeTimeout);

        if (pin.length === 6) {
          if (pincodeHint) {
            pincodeHint.textContent = 'Looking up...';
            pincodeHint.classList.remove('is-error');
          }
          pincodeTimeout = setTimeout(function () {
            fetch('https://api.postalpincode.in/pincode/' + pin)
              .then(function (r) { return r.json(); })
              .then(function (data) {
                if (data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
                  var po = data[0].PostOffice[0];
                  if (cityInput) cityInput.value = po.District || po.Division || '';
                  if (stateInput) {
                    // Try to match state option
                    var stateName = po.State || '';
                    for (var i = 0; i < stateInput.options.length; i++) {
                      if (stateInput.options[i].value === stateName) {
                        stateInput.value = stateName;
                        break;
                      }
                    }
                  }
                  if (pincodeHint) {
                    pincodeHint.textContent = po.Division + ', ' + po.State;
                    pincodeHint.classList.remove('is-error');
                  }
                } else {
                  if (pincodeHint) {
                    pincodeHint.textContent = 'Invalid pincode';
                    pincodeHint.classList.add('is-error');
                  }
                }
              })
              .catch(function () {
                if (pincodeHint) {
                  pincodeHint.textContent = '';
                }
              });
          }, 300);
        } else {
          if (pincodeHint) pincodeHint.textContent = '';
        }
      });
    }

    /* ── 3. Payment Method ── */
    paymentOptions.forEach(function (option) {
      option.addEventListener('click', function () {
        paymentOptions.forEach(function (o) { o.classList.remove('abhinaya-checkout__payment-option--active'); });
        this.classList.add('abhinaya-checkout__payment-option--active');
        var radio = this.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          state.paymentMethod = radio.value;
        }
        updateTotals();
        updateCtaLabel();
      });
    });

    function updateCtaLabel() {
      if (!ctaBtn) return;
      ctaBtn.textContent = state.paymentMethod === 'cod' ? 'Place Order (COD)' : 'Pay Now';
    }

    /* ── 4. Cart Totals ── */
    function formatMoney(paise) {
      return '₹' + (paise / 100).toLocaleString('en-IN');
    }

    var cartData = null;

    function loadCart() {
      fetch('/cart.js')
        .then(function (r) { return r.json(); })
        .then(function (cart) {
          cartData = cart;
          updateTotals();
        });
    }

    function updateTotals() {
      if (!cartData) return;
      var subtotal = cartData.total_price;
      var codCharge = state.paymentMethod === 'cod' ? state.codFee * 100 : 0;
      var total = subtotal + codCharge;

      if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
      if (codFeeRow) codFeeRow.hidden = state.paymentMethod !== 'cod';
      if (totalEl) totalEl.textContent = formatMoney(total);
      if (ctaTotalEl) ctaTotalEl.textContent = formatMoney(total);
    }

    loadCart();

    /* ── 5. Form Validation & Checkout ── */
    function updateCheckoutBtn() {
      if (!ctaBtn) return;
      ctaBtn.disabled = !state.phoneVerified;
    }

    function validateForm() {
      var name = $('#abhinayaName');
      var pincode = $('#abhinayaPincode');
      var address = $('#abhinayaAddress');
      var city = $('#abhinayaCity');
      var stateField = $('#abhinayaState');
      var valid = true;
      var firstInvalid = null;

      [name, pincode, address, city].forEach(function (input) {
        if (input) input.classList.remove('is-error');
      });
      if (stateField) stateField.classList.remove('is-error');

      if (!name || !name.value.trim()) {
        if (name) name.classList.add('is-error');
        valid = false;
        if (!firstInvalid) firstInvalid = name;
      }
      if (!pincode || pincode.value.replace(/\D/g, '').length !== 6) {
        if (pincode) pincode.classList.add('is-error');
        valid = false;
        if (!firstInvalid) firstInvalid = pincode;
      }
      if (!address || !address.value.trim()) {
        if (address) address.classList.add('is-error');
        valid = false;
        if (!firstInvalid) firstInvalid = address;
      }
      if (!city || !city.value.trim()) {
        if (city) city.classList.add('is-error');
        valid = false;
        if (!firstInvalid) firstInvalid = city;
      }
      if (!stateField || !stateField.value) {
        if (stateField) stateField.classList.add('is-error');
        valid = false;
        if (!firstInvalid) firstInvalid = stateField;
      }

      if (!valid && firstInvalid) {
        firstInvalid.focus();
        showToast('Please fill all required fields');
      }
      return valid;
    }

    if (ctaBtn) {
      ctaBtn.addEventListener('click', function () {
        if (!state.phoneVerified) {
          showToast('Please verify your phone number first');
          return;
        }
        if (!validateForm()) return;

        var name = $('#abhinayaName').value.trim();
        var phone = state.phone;
        var pincode = $('#abhinayaPincode').value.trim();
        var address = $('#abhinayaAddress').value.trim();
        var locality = ($('#abhinayaLocality') && $('#abhinayaLocality').value.trim()) || '';
        var city = $('#abhinayaCity').value.trim();
        var stateVal = $('#abhinayaState').value;
        var country = 'India';
        var paymentMethod = state.paymentMethod;

        // Save address to cart note attributes
        var attributes = {
          'phone': '+91' + phone,
          'name': name,
          'address': address + (locality ? ', ' + locality : ''),
          'city': city,
          'state': stateVal,
          'pincode': pincode,
          'country': country,
          'payment_method': paymentMethod
        };

        ctaBtn.textContent = 'Processing...';
        ctaBtn.disabled = true;

        // Update cart attributes
        fetch('/cart/update.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attributes: attributes })
        })
        .then(function (r) { return r.json(); })
        .then(function () {
          // If COD, we could add a COD fee product here
          // For now, redirect to checkout
          window.location.href = '/checkout';
        })
        .catch(function () {
          ctaBtn.textContent = paymentMethod === 'cod' ? 'Place Order (COD)' : 'Pay Now';
          ctaBtn.disabled = false;
          showToast('Something went wrong. Please try again.');
        });
      });
    }

    /* ── 6. Google Places Autocomplete (optional) ── */
    var addressInput = $('#abhinayaAddress');
    if (addressInput && window.google && window.google.maps && window.google.maps.places) {
      var autocomplete = new window.google.maps.places.Autocomplete(addressInput, {
        componentRestrictions: { country: 'in' },
        fields: ['address_components', 'formatted_address'],
        types: ['address']
      });
      autocomplete.addListener('place_changed', function () {
        var place = autocomplete.getPlace();
        if (place && place.address_components) {
          place.address_components.forEach(function (comp) {
            if (comp.types.indexOf('postal_code') !== -1 && pincodeInput) {
              pincodeInput.value = comp.long_name;
              pincodeInput.dispatchEvent(new Event('input'));
            }
            if (comp.types.indexOf('locality') !== -1 && cityInput) {
              cityInput.value = comp.long_name;
            }
            if (comp.types.indexOf('administrative_area_level_1') !== -1 && stateInput) {
              for (var i = 0; i < stateInput.options.length; i++) {
                if (stateInput.options[i].value === comp.long_name) {
                  stateInput.value = comp.long_name;
                  break;
                }
              }
            }
          });
        }
      });
    }

  });
})();
