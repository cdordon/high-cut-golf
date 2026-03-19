import { inject } from '@vercel/analytics';
import Client from 'shopify-buy';

const client = Client.buildClient({
  domain: 'YOUR_STORE.myshopify.com', 
  storefrontAccessToken: 'YOUR_TOKEN' 
});

let checkoutId = null;
const grid = document.querySelector('#product-grid');
const drawer = document.querySelector('#cart-drawer');
const overlay = document.querySelector('#cart-overlay');

// --- NEW ANIMATION SETUP ---
const observerOptions = {
    threshold: 0.2 
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.remove('opacity-0', '-translate-x-12', 'translate-x-12');
            entry.target.classList.add('opacity-100', 'translate-x-0');
        }
    });
}, observerOptions);
// ---------------------------

// Initialize the Shop
async function init() {
  const checkout = await client.checkout.create();
  checkoutId = checkout.id;

  const products = await client.product.fetchAll();
  renderProducts(products);
  
  document.querySelector('#close-cart').onclick = toggleCart;
  overlay.onclick = toggleCart;
  document.querySelector('#cart-count').onclick = toggleCart;

  // --- NEW ANIMATION EXECUTION ---
  // We put this here so it catches products AFTER they are rendered
  document.querySelectorAll('.reveal-left, .reveal-right').forEach(el => {
    observer.observe(el);
  });
}

function renderProducts(products) {
  grid.innerHTML = '';
  products.forEach(product => {
    const card = document.createElement('div');
    // NOTE: If you want the products to swipe, add 'reveal-left' to the className below:
    card.className = "group cursor-pointer reveal-left opacity-0 -translate-x-12 transition duration-1000";
    const variantId = product.variants[0].id;

    card.innerHTML = `
      <div class="aspect-[4/5] overflow-hidden bg-stone-100 mb-4 rounded-sm">
        <img src="${product.images[0].src}" class="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
      </div>
      <div class="flex justify-between items-start mb-4">
        <h3 class="font-bold uppercase text-sm tracking-wide">${product.title}</h3>
        <p class="font-medium">$${product.variants[0].price.amount}</p>
      </div>
    `;

    const btn = document.createElement('button');
    btn.className = "w-full border border-stone-900 py-3 uppercase text-xs font-bold tracking-widest hover:bg-stone-900 hover:text-white transition";
    btn.innerText = "Add to Bag";
    btn.onclick = () => addToCart(variantId);
    
    card.appendChild(btn);
    grid.appendChild(card);
  });
}

async function addToCart(variantId) {
  const lineItemsToAdd = [{ variantId, quantity: 1 }];
  const checkout = await client.checkout.addLineItems(checkoutId, lineItemsToAdd);
  updateCartUI(checkout);
  toggleCart(); 
}

function updateCartUI(checkout) {
  const cartContainer = document.querySelector('#cart-items');
  const countDisplay = document.querySelector('#cart-count');
  const subtotalDisplay = document.querySelector('#cart-subtotal');
  
  countDisplay.innerText = `Cart (${checkout.lineItems.length})`;
  subtotalDisplay.innerText = `$${checkout.paymentDue.amount}`;

  if (checkout.lineItems.length === 0) {
    cartContainer.innerHTML = `<p class="text-stone-400 italic">Your bag is empty.</p>`;
    return;
  }

  cartContainer.innerHTML = checkout.lineItems.map(item => `
    <div class="flex gap-4">
      <img src="${item.variant.image.src}" class="w-20 h-24 object-cover bg-stone-100">
      <div class="flex-1">
        <h4 class="font-bold text-sm uppercase">${item.title}</h4>
        <p class="text-xs text-stone-500 italic">${item.variant.title}</p>
        <p class="mt-2 text-sm font-medium">$${item.variant.price.amount}</p>
      </div>
    </div>
  `).join('');

  document.querySelector('#checkout-btn').onclick = () => {
    window.location.href = checkout.webUrl;
  };
}

function toggleCart() {
  drawer.classList.toggle('translate-x-full');
  overlay.classList.toggle('hidden');
}

init();
inject();