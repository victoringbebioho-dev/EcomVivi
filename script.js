document.addEventListener('DOMContentLoaded', () => {
  // Commun aux deux pages HTML : initialise les animations AOS si la librairie est chargée.
  if (window.AOS) {
    window.AOS.init({
      once: true,
      duration: 1000,
    });
  }

  // index.html et produits.html : pilote le menu mobile #menu-toggle / #navbar-default.
  const menuButton = document.getElementById('menu-toggle');
  const menu = document.getElementById('navbar-default');

  if (menuButton && menu) {
    const closeMenu = () => {
      menu.classList.add('hidden');
      menuButton.setAttribute('aria-expanded', 'false');
    };

    menuButton.addEventListener('click', () => {
      const isHidden = menu.classList.toggle('hidden');
      menuButton.setAttribute('aria-expanded', String(!isHidden));
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 768) {
          closeMenu();
        }
      });
    });

    window.addEventListener('scroll', () => {
      if (window.innerWidth < 768 && window.scrollY > 8) closeMenu();
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) closeMenu();
    });
  }

  // index.html : affiche et utilise le bouton de retour en haut #backToTop.
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    const toggleButton = () => {
      backToTop.classList.toggle('hidden', window.scrollY < 400);
    };

    toggleButton();
    window.addEventListener('scroll', toggleButton, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // index.html et produits.html : relie la recherche #search-form aux cartes produits.
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchToggle = document.getElementById('search-toggle');
  const searchPanel = document.getElementById('search-panel');

  if (searchForm && searchInput && searchToggle && searchPanel) {
    const productCards = document.querySelectorAll(
      '#produits .group.flex.flex-col, #nos-produits .bg-white.rounded-2xl'
    );
    const searchStatus = document.createElement('p');

    searchStatus.className = 'mt-6 text-center text-sm font-medium text-gray-500';
    searchStatus.setAttribute('aria-live', 'polite');
    searchForm.closest('nav')?.after(searchStatus);

    const closeSearch = () => {
      searchPanel.classList.add('hidden');
      searchToggle.setAttribute('aria-expanded', 'false');
    };

    searchToggle.addEventListener('click', () => {
      const isClosed = searchPanel.classList.toggle('hidden');
      searchToggle.setAttribute('aria-expanded', String(!isClosed));

      if (!isClosed) searchInput.focus();
    });

    const filterProducts = () => {
      const query = searchInput.value.trim().toLocaleLowerCase('fr-FR');
      let visibleCount = 0;

      productCards.forEach((card) => {
        const matches = !query || card.textContent.toLocaleLowerCase('fr-FR').includes(query);
        card.classList.toggle('hidden', !matches);
        if (matches) visibleCount += 1;
      });

      if (!query) {
        searchStatus.textContent = '';
      } else if (visibleCount === 0) {
        searchStatus.textContent = `Aucun produit trouvé pour « ${searchInput.value.trim()} ».`;
      } else {
        searchStatus.textContent = `${visibleCount} produit${visibleCount > 1 ? 's' : ''} trouvé${visibleCount > 1 ? 's' : ''}.`;
      }
    };

    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      filterProducts();
    });
    searchInput.addEventListener('input', filterProducts);
    document.addEventListener('click', (event) => {
      if (!searchForm.contains(event.target)) closeSearch();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeSearch();
    });
  }

  // index.html et produits.html : synchronise les paniers #cart-modal et #catalog-cart-panel.
  const cartModal = document.getElementById('cart-modal');
  const catalogCartPanel = document.getElementById('catalog-cart-panel');
  const shoppingLayout = document.getElementById('shopping-layout');
  const cartItemTargets = document.querySelectorAll('#cart-items, #catalog-cart-items');
  const cartTotalTargets = document.querySelectorAll('#cart-total, #catalog-total');
  const subtotalTargets = document.querySelectorAll('#catalog-subtotal, .cart-subtotal');
  const deliveryTargets = document.querySelectorAll('#catalog-delivery, .cart-delivery');
  const deliveryOptions = document.querySelectorAll('[data-delivery-option]');

  if (cartModal && cartItemTargets.length && cartTotalTargets.length) {
    const cartKey = 'ecomvivi_cart';
    const getCart = () => JSON.parse(localStorage.getItem(cartKey) || '[]');
    const saveCart = (cart) => localStorage.setItem(cartKey, JSON.stringify(cart));
    // Utilise le point comme séparateur des milliers : 9.500 FCFA.
    const formatPrice = (price) => `${price.toLocaleString('de-DE')} FCFA`;

    const updateCartCount = (cart) => {
      const count = cart.reduce((total, item) => total + item.quantity, 0);
      document.querySelectorAll('.cart-count').forEach((badge) => {
        badge.textContent = count;
      });
    };

    const renderCart = () => {
      const cart = getCart();
      updateCartCount(cart);
      const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
      const delivery = Number(deliveryOptions[0]?.value || 0);

      if (!cart.length) {
        cartItemTargets.forEach((target) => {
          target.innerHTML = '<div class="py-8 text-center"><p class="text-lg font-semibold text-gray-800">Votre panier est vide</p><p class="mt-2 text-sm text-gray-500">Ajoutez des produits pour commencer votre commande.</p></div>';
        });
      } else {
        const itemsMarkup = cart.map((item) => `
          <div class="cart-item flex items-center justify-between gap-4 border-b border-gray-100 py-4 last:border-0" data-cart-id="${item.id}">
            <div class="min-w-0"><p class="truncate font-semibold text-gray-800">${item.name}</p><p class="mt-1 text-xs text-gray-500">Prix unitaire : ${formatPrice(item.price)}</p><p class="mt-1 text-sm font-bold text-blue-600">Sous-total : ${formatPrice(item.price * item.quantity)}</p></div>
            <div class="flex items-center gap-2"><button type="button" data-cart-decrease aria-label="Retirer une unité" class="cart-quantity-button">-</button><span class="min-w-6 text-center font-semibold">${item.quantity}</span><button type="button" data-cart-increase aria-label="Ajouter une unité" class="cart-quantity-button">+</button><button type="button" data-cart-remove aria-label="Supprimer ${item.name}" class="ml-2 text-sm font-semibold text-gray-400 hover:text-red-600">Supprimer</button></div>
          </div>`).join('');
        cartItemTargets.forEach((target) => {
          target.innerHTML = itemsMarkup;
        });
      }

      cartTotalTargets.forEach((target) => {
        target.textContent = formatPrice(subtotal + delivery);
      });
      subtotalTargets.forEach((target) => {
        target.textContent = formatPrice(subtotal);
      });
      deliveryTargets.forEach((target) => {
        target.textContent = delivery ? formatPrice(delivery) : 'Gratuit';
      });
    };

    const openCart = () => {
      renderCart();
      if (catalogCartPanel) {
        catalogCartPanel.classList.remove('hidden');
        shoppingLayout?.classList.add('shopping-layout-active');
        const productsSection = document.getElementById('produits');
        if (window.innerWidth < 768 && productsSection) {
          // Sur mobile, garder l'en-tête produits visible au-dessus du panier.
          productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          catalogCartPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }
      cartModal.classList.remove('hidden');
      cartModal.classList.add('flex');
      document.body.classList.add('overflow-hidden');
    };

    const closeCart = () => {
      catalogCartPanel?.classList.add('hidden');
      shoppingLayout?.classList.remove('shopping-layout-active');
      cartModal.classList.add('hidden');
      cartModal.classList.remove('flex');
      document.body.classList.remove('overflow-hidden');
    };

    document.querySelectorAll('[data-cart-open]').forEach((button) => {
      button.addEventListener('click', (event) => {
        const session = JSON.parse(localStorage.getItem('ecomvivi_session') || 'null');
        if (session?.name) {
          if (!catalogCartPanel) {
            window.location.href = 'produits.html#panier';
            return;
          }
          openCart();
          return;
        }

        event.preventDefault();
        const registeredUsers = JSON.parse(localStorage.getItem('ecomvivi_users') || '[]');
        document.dispatchEvent(new CustomEvent('auth-required', {
          detail: {
            mode: registeredUsers.length ? 'login' : 'register',
            message: registeredUsers.length
              ? 'Connectez-vous d’abord pour accéder à votre panier.'
              : 'Inscrivez-vous d’abord, puis connectez-vous pour accéder à votre panier.',
          },
        }));
      });
    });
    document.querySelectorAll('[data-cart-close]').forEach((button) => button.addEventListener('click', closeCart));
    document.querySelectorAll('[data-products-view]').forEach((link) => {
      link.addEventListener('click', () => {
        catalogCartPanel?.classList.add('hidden');
        shoppingLayout?.classList.remove('shopping-layout-active');
      });
    });
    deliveryOptions.forEach((option) => {
      option.addEventListener('change', () => {
        deliveryOptions.forEach((otherOption) => {
          otherOption.value = option.value;
        });
        renderCart();
      });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !cartModal.classList.contains('hidden')) closeCart();
    });

    const productCards = document.querySelectorAll('#produits .group.flex.flex-col, #nos-produits .bg-white.rounded-2xl');
    productCards.forEach((card, index) => {
      const nameElement = card.querySelector('h3, h5');
      const priceElement = card.querySelector('.text-lg.font-bold.text-blue-600');
      const content = card.querySelector('.p-5, .p-6');
      if (!nameElement || !priceElement || !content || content.querySelector('[data-cart-add]')) return;

      const price = Number(priceElement.textContent.replace(/[^0-9]/g, ''));
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.cartAdd = '';
      button.dataset.productId = `${nameElement.textContent.trim().toLowerCase().replace(/\s+/g, '-')}-${index}`;
      button.dataset.productName = nameElement.textContent.trim();
      button.dataset.productPrice = String(price);
      button.className = 'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-600 hover:text-white transition';
      button.innerHTML = '<span aria-hidden="true">+</span> Ajouter au panier';
      content.append(button);
    });

    document.addEventListener('click', (event) => {
      const addButton = event.target.closest('[data-cart-add]');
      if (addButton) {
        const cart = getCart();
        const existing = cart.find((item) => item.id === addButton.dataset.productId);
        if (existing) existing.quantity += 1;
        else cart.push({ id: addButton.dataset.productId, name: addButton.dataset.productName, price: Number(addButton.dataset.productPrice), quantity: 1 });
        saveCart(cart);
        renderCart();
        openCart();
        return;
      }

      const cartItem = event.target.closest('[data-cart-id]');
      if (!cartItem) return;
      const cart = getCart();
      const item = cart.find((entry) => entry.id === cartItem.dataset.cartId);
      if (!item) return;
      if (event.target.closest('[data-cart-increase]')) item.quantity += 1;
      if (event.target.closest('[data-cart-decrease]')) item.quantity = Math.max(0, item.quantity - 1);
      if (event.target.closest('[data-cart-remove]')) item.quantity = 0;
      saveCart(cart.filter((entry) => entry.quantity > 0));
      renderCart();
    });

    document.addEventListener('cart-cleared', renderCart);

    renderCart();
    if (window.location.hash === '#panier' && catalogCartPanel) window.setTimeout(openCart, 0);
  }

  // produits.html : gère le formulaire #checkout-form, le récapitulatif et la facture.
  const checkoutSection = document.getElementById('checkout-section');
  const checkoutForm = document.getElementById('checkout-form');
  const checkoutSummary = document.getElementById('checkout-summary');
  const invoiceSection = document.getElementById('invoice-section');

  if (checkoutSection && checkoutForm && checkoutSummary && invoiceSection) {
    const cartKey = 'ecomvivi_cart';
    // Le même format est utilisé dans le récapitulatif, la facture et le PDF WhatsApp.
    const formatPrice = (price) => `${price.toLocaleString('de-DE')} FCFA`;
    const getCart = () => JSON.parse(localStorage.getItem(cartKey) || '[]');
    const getDelivery = () => Number(document.querySelector('[data-delivery-option]')?.value || 0);
    const paymentSelect = document.getElementById('checkout-payment');
    const fedapayFields = document.getElementById('fedapay-fields');
    const fedapayNetwork = document.getElementById('fedapay-network');
    const fedapayPhone = document.getElementById('fedapay-phone');

    const updatePaymentFields = () => {
      const isFedaPay = paymentSelect?.value === 'FedaPay';
      fedapayFields?.classList.toggle('hidden', !isFedaPay);
      if (fedapayNetwork) fedapayNetwork.required = isFedaPay;
      if (fedapayPhone) fedapayPhone.required = isFedaPay;
    };

    paymentSelect?.addEventListener('change', updatePaymentFields);
    updatePaymentFields();

    // produits.html : remplit #checkout-summary et les totaux de #checkout-section.
    const renderCheckoutSummary = () => {
      const cart = getCart();
      const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
      const delivery = getDelivery();
      checkoutSummary.innerHTML = cart.length
        ? cart.map((item) => `<div class="flex justify-between gap-3 text-sm"><span class="text-slate-300">${item.name} x${item.quantity}</span><span class="font-semibold">${formatPrice(item.price * item.quantity)}</span></div>`).join('')
        : '<p class="text-sm text-slate-400">Votre panier est vide.</p>';
      document.getElementById('checkout-subtotal').textContent = formatPrice(subtotal);
      document.getElementById('checkout-delivery').textContent = delivery ? formatPrice(delivery) : 'Gratuit';
      document.getElementById('checkout-total').textContent = formatPrice(subtotal + delivery);
    };

    document.addEventListener('cart-cleared', renderCheckoutSummary);
    const openCheckout = () => {
      if (!getCart().length) return;
      document.getElementById('cart-modal')?.classList.add('hidden');
      document.getElementById('cart-modal')?.classList.remove('flex');
      document.getElementById('catalog-cart-panel')?.classList.add('hidden');
      document.getElementById('shopping-layout')?.classList.remove('shopping-layout-active');
      renderCheckoutSummary();
      checkoutSection.classList.remove('hidden');
      checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // produits.html : remplit #invoice-section et prépare son partage PDF vers WhatsApp.
    const showInvoice = (order) => {
      checkoutSection.classList.add('hidden');
      invoiceSection.classList.remove('hidden');
      document.getElementById('invoice-number').textContent = `Référence ${order.id} • ${order.createdAt}`;
      document.querySelector('.invoice-status').textContent = order.customer.payment === 'FedaPay' ? 'Paiement via FedaPay' : order.customer.payment;
      const paymentDetails = order.customer.payment === 'FedaPay'
        ? `<br>${order.customer.network}<br>Numéro : ${order.customer.payment_phone}`
        : '';
      document.getElementById('invoice-customer').innerHTML = `<div><strong class="text-gray-900">Client</strong><br>${order.customer.firstname} ${order.customer.lastname}<br>${order.customer.email}<br>${order.customer.phone}<br>Paiement : ${order.customer.payment}${paymentDetails}</div><div><strong class="text-gray-900">Livraison</strong><br>${order.customer.address}<br>${order.customer.city}<br>${order.customer.instructions || 'Aucune instruction'}</div>`;
      document.getElementById('invoice-items').innerHTML = order.items.map((item) => `<div class="flex justify-between border-b border-gray-100 py-3 text-sm"><span>${item.name} x${item.quantity}</span><strong>${formatPrice(item.price * item.quantity)}</strong></div>`).join('');
      document.getElementById('invoice-subtotal').textContent = formatPrice(order.subtotal);
      document.getElementById('invoice-delivery').textContent = order.delivery ? formatPrice(order.delivery) : 'Gratuit';
      document.getElementById('invoice-total').textContent = formatPrice(order.total);
      const normalizeWhatsappPhone = (value) => {
        let digits = String(value || '').replace(/\D/g, '');
        if (digits.startsWith('00')) digits = digits.slice(2);
        if (digits.startsWith('229')) return digits;
        return `229${digits}`;
      };
      const whatsappPhone = normalizeWhatsappPhone(order.customer.phone);
      const whatsappMessage = [
        `Bonjour ${order.customer.firstname} ${order.customer.lastname},`,
        `Voici votre facture ${order.id}.`,
        `Total : ${formatPrice(order.total)}.`,
        `Produits : ${order.items.map((item) => `${item.name} x${item.quantity}`).join(', ')}.`,
      ].join('\n');
      // produits.html : fabrique le fichier PDF avec les mêmes montants que #invoice-total.
      const createInvoicePdf = () => {
        const JsPdf = window.jspdf?.jsPDF;
        if (!JsPdf) throw new Error('PDF_LIBRARY_UNAVAILABLE');

        const pdf = new JsPdf();
        const pageWidth = pdf.internal.pageSize.getWidth();
        let y = 20;
        const addLine = (text, options = {}) => {
          const lines = pdf.splitTextToSize(String(text), options.width || 175);
          pdf.text(lines, options.x || 20, y);
          y += lines.length * (options.lineHeight || 7);
        };

        pdf.setFontSize(20);
        pdf.setTextColor(37, 99, 235);
        pdf.text('EcomVivi', 20, y);
        y += 10;
        pdf.setFontSize(16);
        pdf.setTextColor(17, 24, 39);
        pdf.text('Facture', 20, y);
        y += 8;
        pdf.setFontSize(10);
        pdf.setTextColor(75, 85, 99);
        addLine(`Reference ${order.id} - ${order.createdAt}`);
        y += 5;
        pdf.setTextColor(17, 24, 39);
        pdf.setFontSize(11);
        addLine(`Client : ${order.customer.firstname} ${order.customer.lastname}`);
        addLine(`Telephone : ${order.customer.phone}`);
        addLine(`Email : ${order.customer.email}`);
        addLine(`Adresse : ${order.customer.address}, ${order.customer.city}`);
        addLine(`Paiement : ${order.customer.payment}`);
        y += 5;
        pdf.setFontSize(10);
        order.items.forEach((item) => addLine(`${item.name} x${item.quantity} - ${formatPrice(item.price * item.quantity)}`));
        y += 5;
        pdf.line(20, y, pageWidth - 20, y);
        y += 8;
        addLine(`Sous-total : ${formatPrice(order.subtotal)}`);
        addLine(`Livraison : ${order.delivery ? formatPrice(order.delivery) : 'Gratuit'}`);
        pdf.setFontSize(13);
        pdf.setFont(undefined, 'bold');
        addLine(`Total : ${formatPrice(order.total)}`);
        pdf.setFont(undefined, 'normal');
        return pdf;
      };
      const whatsappLink = document.getElementById('invoice-whatsapp');
      if (whatsappLink) {
        whatsappLink.dataset.whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;
        whatsappLink.setAttribute('aria-label', `Envoyer la facture au +${whatsappPhone} sur WhatsApp`);
        whatsappLink.onclick = async () => {
          let pdf;
          try {
            pdf = createInvoicePdf();
          } catch {
            window.open(whatsappLink.dataset.whatsappUrl, '_blank', 'noopener,noreferrer');
            return;
          }

          const filename = `facture-${order.id}.pdf`;
          const file = new File([pdf.output('blob')], filename, { type: 'application/pdf' });
          if (navigator.canShare?.({ files: [file] }) && navigator.share) {
            try {
              await navigator.share({ title: `Facture ${order.id}`, text: whatsappMessage, files: [file] });
              return;
            } catch (error) {
              if (error.name === 'AbortError') return;
            }
          }

          pdf.save(filename);
          window.open(whatsappLink.dataset.whatsappUrl, '_blank', 'noopener,noreferrer');
        };
      }
      window.location.hash = 'invoice';
      invoiceSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    document.querySelectorAll('[data-cart-checkout]').forEach((button) => {
      button.addEventListener('click', (event) => {
        if (!getCart().length) {
          event.preventDefault();
          return;
        }
        const session = JSON.parse(localStorage.getItem('ecomvivi_session') || 'null');
        if (!session?.name) return;
        if (!checkoutSection) {
          event.preventDefault();
          window.location.href = 'produits.html#checkout';
          return;
        }
        event.preventDefault();
        openCheckout();
      });
    });

    checkoutForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!checkoutForm.checkValidity()) {
        checkoutForm.reportValidity();
        return;
      }

      const formData = new FormData(checkoutForm);
      const cart = getCart();
      const delivery = getDelivery();
      const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
      const order = { id: `EV-${Date.now().toString().slice(-8)}`, customer: Object.fromEntries(formData.entries()), items: cart, subtotal, delivery, total: subtotal + delivery, createdAt: new Date().toLocaleString('fr-FR') };
      localStorage.setItem('ecomvivi_last_order', JSON.stringify(order));
      localStorage.removeItem(cartKey);
      showInvoice(order);
      document.querySelectorAll('.cart-count').forEach((badge) => { badge.textContent = '0'; });
      const confirmation = document.createElement('div');
      confirmation.className = 'order-notification';
      confirmation.setAttribute('role', 'status');
      confirmation.textContent = order.customer.payment === 'FedaPay'
        ? `Commande ${order.id} enregistrée. La confirmation du paiement sera envoyée au ${order.customer.payment_phone} après validation FedaPay.`
        : `Commande ${order.id} confirmée. Votre facture est affichée ci-dessous.`;
      document.body.append(confirmation);
      window.setTimeout(() => confirmation.remove(), 6000);
    });

    document.querySelector('[data-invoice-print]')?.addEventListener('click', () => window.print());
    if (window.location.hash === '#checkout') window.setTimeout(openCheckout, 0);
    if (window.location.hash === '#invoice') {
      const savedOrder = JSON.parse(localStorage.getItem('ecomvivi_last_order') || 'null');
      if (savedOrder) window.setTimeout(() => showInvoice(savedOrder), 0);
    }
  }

  document.querySelectorAll('[data-history-action]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelector('.history-notification')?.remove();
      const notification = document.createElement('div');
      notification.className = 'history-notification';
      notification.setAttribute('role', 'status');
      notification.textContent = 'Notre histoire est encore en préparation et sera bientôt disponible.';
      document.body.append(notification);
      window.setTimeout(() => notification.remove(), 5000);
    });
  });

  // index.html et produits.html : contrôle l'inscription, la connexion et l'état client.
  const authModal = document.getElementById('auth-modal');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authFeedback = document.getElementById('auth-feedback');
  const authGuest = document.getElementById('auth-guest');
  const authUser = document.getElementById('auth-user');
  const authUserName = document.getElementById('auth-user-name');
  const authUserInitial = document.getElementById('auth-user-initial');
  const authLogout = document.getElementById('auth-logout');
  const authTitle = document.getElementById('auth-modal-title');
  const authSubtitle = document.getElementById('auth-modal-subtitle');

  if (authModal && loginForm && registerForm) {
    const usersKey = 'ecomvivi_users';
    const sessionKey = 'ecomvivi_session';

    const getUsers = () => JSON.parse(localStorage.getItem(usersKey) || '[]');
    const setUsers = (users) => localStorage.setItem(usersKey, JSON.stringify(users));

    const hashPassword = async (password) => {
      if (window.crypto?.subtle) {
        const data = new TextEncoder().encode(password);
        const hash = await window.crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
      }

      return window.btoa(unescape(encodeURIComponent(password)));
    };

    const showFeedback = (message, type = 'error') => {
      authFeedback.textContent = message;
      authFeedback.className = `mb-4 rounded-lg px-4 py-3 text-sm ${type === 'success'
        ? 'bg-green-50 text-green-700'
        : 'bg-red-50 text-red-700'}`;
    };

    const clearFeedback = () => {
      authFeedback.textContent = '';
      authFeedback.className = 'hidden mb-4 rounded-lg px-4 py-3 text-sm';
    };

    const switchAuthMode = (mode) => {
      const isRegister = mode === 'register';
      loginForm.classList.toggle('hidden', isRegister);
      registerForm.classList.toggle('hidden', !isRegister);
      document.querySelectorAll('[data-auth-switch]').forEach((button) => {
        if (button.classList.contains('auth-tab')) button.classList.toggle('active', button.dataset.authSwitch === mode);
      });
      authTitle.textContent = isRegister ? 'Créer votre compte' : 'Bon retour parmi nous';
      authSubtitle.textContent = isRegister
        ? 'Enregistrez vos informations pour commander plus facilement.'
        : 'Connectez-vous pour retrouver votre espace client.';
      clearFeedback();
    };

    const openAuth = (mode = 'login') => {
      switchAuthMode(mode);
      authModal.classList.remove('hidden');
      authModal.classList.add('flex');
      document.body.classList.add('overflow-hidden');
      window.setTimeout(() => (isRegisterMode(mode) ? document.getElementById('register-name') : document.getElementById('login-email'))?.focus(), 50);
    };

    const isRegisterMode = (mode) => mode === 'register';

    const closeAuth = () => {
      authModal.classList.add('hidden');
      authModal.classList.remove('flex');
      document.body.classList.remove('overflow-hidden');
      clearFeedback();
    };

    const updateAuthState = () => {
      const session = JSON.parse(localStorage.getItem(sessionKey) || 'null');
      const loggedIn = Boolean(session?.name);
      authGuest.classList.toggle('hidden', loggedIn);
      authUser.classList.toggle('hidden', !loggedIn);
      authUser.classList.toggle('flex', loggedIn);
      if (loggedIn) {
        authUserName.textContent = session.name;
        authUserInitial.textContent = session.name.charAt(0).toUpperCase();
      }
    };

    const showAuthNotification = (message) => {
      document.querySelector('.auth-notification')?.remove();
      const notification = document.createElement('div');
      notification.className = 'auth-notification';
      notification.setAttribute('role', 'status');
      notification.textContent = message;
      document.body.append(notification);
      window.setTimeout(() => notification.remove(), 5000);
    };

    document.querySelectorAll('[data-auth-open]').forEach((button) => {
      button.addEventListener('click', () => {
        if (button.dataset.authOpen === 'login' && getUsers().length === 0) {
          showAuthNotification('Vous devez vous inscrire d’abord avant de vous connecter.');
          openAuth('register');
          return;
        }
        openAuth(button.dataset.authOpen);
      });
    });
    document.addEventListener('auth-required', (event) => {
      showAuthNotification(event.detail.message);
      openAuth(event.detail.mode);
    });
    document.querySelectorAll('[data-auth-close]').forEach((button) => button.addEventListener('click', closeAuth));
    document.querySelectorAll('[data-auth-switch]').forEach((button) => {
      button.addEventListener('click', () => switchAuthMode(button.dataset.authSwitch));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !authModal.classList.contains('hidden')) closeAuth();
    });

    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!registerForm.checkValidity()) {
        registerForm.reportValidity();
        return;
      }

      const formData = new FormData(registerForm);
      const name = formData.get('name').toString().trim();
      const email = formData.get('email').toString().trim().toLowerCase();
      const password = formData.get('password').toString();
      const confirm = formData.get('confirm').toString();

      if (password !== confirm) {
        showFeedback('Les deux mots de passe ne correspondent pas.');
        return;
      }

      const users = getUsers();
      if (users.some((user) => user.email === email)) {
        showFeedback('Cette adresse e-mail possède déjà un compte.');
        switchAuthMode('login');
        document.getElementById('login-email').value = email;
        return;
      }

      users.push({ name, email, password: await hashPassword(password) });
      setUsers(users);
      registerForm.reset();
      switchAuthMode('login');
      document.getElementById('login-email').value = email;
      showFeedback('Compte créé avec succès. Connectez-vous pour continuer.', 'success');
      document.getElementById('login-password').focus();
    });

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!loginForm.checkValidity()) {
        loginForm.reportValidity();
        return;
      }

      const formData = new FormData(loginForm);
      const email = formData.get('email').toString().trim().toLowerCase();
      const password = await hashPassword(formData.get('password').toString());
      const user = getUsers().find((candidate) => candidate.email === email && candidate.password === password);

      if (!user) {
        showFeedback('E-mail ou mot de passe incorrect.');
        return;
      }

      localStorage.setItem(sessionKey, JSON.stringify({ name: user.name, email: user.email }));
      updateAuthState();
      closeAuth();
    });

    authLogout?.addEventListener('click', () => {
      localStorage.removeItem(sessionKey);
      localStorage.removeItem('ecomvivi_cart');
      document.querySelectorAll('.cart-count').forEach((badge) => { badge.textContent = '0'; });
      document.dispatchEvent(new CustomEvent('cart-cleared'));
      document.getElementById('cart-modal')?.classList.add('hidden');
      document.getElementById('cart-modal')?.classList.remove('flex');
      document.getElementById('catalog-cart-panel')?.classList.add('hidden');
      document.getElementById('shopping-layout')?.classList.remove('shopping-layout-active');
      updateAuthState();
    });

    const showOrderNotification = (message) => {
      document.querySelector('.order-notification')?.remove();
      const notification = document.createElement('div');
      notification.className = 'order-notification';
      notification.setAttribute('role', 'status');
      notification.textContent = message;
      document.body.append(notification);
      window.setTimeout(() => notification.remove(), 5000);
    };

    document.querySelectorAll('[data-cart-checkout]').forEach((button) => {
      button.addEventListener('click', (event) => {
        const session = JSON.parse(localStorage.getItem(sessionKey) || 'null');
        if (session?.name) return;

        event.preventDefault();
        document.getElementById('cart-modal')?.classList.add('hidden');
        document.getElementById('cart-modal')?.classList.remove('flex');
        showOrderNotification(getUsers().length
          ? 'Connectez-vous pour finaliser votre commande.'
          : 'Créez un compte puis connectez-vous pour finaliser votre commande.');
        openAuth(getUsers().length ? 'login' : 'register');
      });
    });

    document.querySelectorAll('[data-order-action]').forEach((button) => {
      button.addEventListener('click', (event) => {
        const session = JSON.parse(localStorage.getItem(sessionKey) || 'null');

        if (session?.name) return;

        event.preventDefault();
        const hasAccount = getUsers().length > 0;
        showOrderNotification(hasAccount
          ? 'Connectez-vous d’abord pour continuer votre commande.'
          : 'Créez d’abord votre compte, puis connectez-vous pour commander.');
        openAuth(hasAccount ? 'login' : 'register');
      });
    });

    updateAuthState();
  }

  // index.html : prépare le message du formulaire #contact-form dans le client mail.
  const form = document.getElementById('contact-form');
  const formMessage = document.getElementById('form-message');

  if (form && formMessage) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const name = formData.get('name')?.toString().trim() || 'Client';
      const email = formData.get('email')?.toString().trim() || 'Non communiqué';
      const products = formData.get('products')?.toString().trim() || 'Non précisé';
      const message = formData.get('message')?.toString().trim() || 'Aucun message détaillé';

      const subject = `Demande de ${name}`;
      const body = `Nom : ${name}\r\nEmail : ${email}\r\nProduits : ${products}\r\nMessage : ${message}`;

      window.location.href = `mailto:atawaroua@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      formMessage.classList.remove('hidden');
      formMessage.textContent = 'Votre demande a été préparée. Votre client de messagerie va s’ouvrir pour l’envoi.';
      form.reset();
    });
  }

  // index.html : anime le texte d'accueil #typewriter.
  const typewriter = document.getElementById('typewriter');
  if (!typewriter) return;

  const text = 'EcomVivi !';
  let index = 0;
  let isDeleting = false;

  const typeWriter = () => {
    typewriter.textContent = isDeleting
      ? text.substring(0, index - 1)
      : text.substring(0, index + 1);

    if (!isDeleting) {
      index += 1;

      if (index === text.length) {
        isDeleting = true;
        setTimeout(typeWriter, 1500);
        return;
      }
    } else {
      index -= 1;

      if (index === 0) {
        isDeleting = false;
        setTimeout(typeWriter, 500);
        return;
      }
    }

    setTimeout(typeWriter, isDeleting ? 80 : 120);
  };

  typeWriter();
});
