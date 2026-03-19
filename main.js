import { inject } from '@vercel/analytics';
import Client from 'shopify-buy';

const client = Client.buildClient({
  domain: 'YOUR_STORE.myshopify.com', // Replace with your URL
  storefrontAccessToken: 'YOUR_TOKEN' // Replace with your Token
});

let checkoutId = null;
const grid = document.querySelector('#product-grid');
const drawer = document.querySelector('#cart-drawer');
const overlay = document.querySelector('#cart-overlay');

// --- 1. ANIMATION SETUP (Global) ---
const observerOptions = {
    threshold: 0.1 
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.remove('opacity-0', '-translate-x-12', 'translate-x-12');
            entry.target.classList.add('opacity-100', 'translate-x-0');
        }
    });
}, observerOptions);

// This function runs for BOTH static HTML and dynamic products
function startAnimations() {
  document.querySelectorAll('.reveal-left, .reveal-right').forEach(el => {
    observer.observe(el);
  });
}

// --- 2. SHOPIFY LOGIC ---
async function initShopify() {
  // Only run if the elements exist (prevents crashing on About page)
  if (!grid) return; 

  const checkout = await client.checkout.create();
  checkoutId = checkout.id;

  const products = await client.product.fetchAll();
  renderProducts(products);
  
  // Setup Shop Listeners
  if(document.querySelector('#close-cart')) document.querySelector('#close-cart').onclick = toggleCart;
  if(overlay) overlay.onclick = toggleCart;
  if(document.querySelector('#cart-count')) document.querySelector('#cart-count').onclick = toggleCart;

  // Re-run animations to catch the newly rendered product cards
  startAnimations();
}

function renderProducts(products) {
  if (!grid) return;
  grid.innerHTML = '';
  products.forEach(product => {
    const card = document.createElement('div');
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
  if (!cartContainer) return;

  const countDisplay = document.querySelector('#cart-count');
  const subtotalDisplay = document.querySelector('#cart-subtotal');
  
  if(countDisplay) countDisplay.innerText = `Cart (${checkout.lineItems.length})`;
  if(subtotalDisplay) subtotalDisplay.innerText = `$${checkout.paymentDue.amount}`;

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

  const checkoutBtn = document.querySelector('#checkout-btn');
  if(checkoutBtn) {
    checkoutBtn.onclick = () => { window.location.href = checkout.webUrl; };
  }
}

function toggleCart() {
  if(drawer) drawer.classList.toggle('translate-x-full');
  if(overlay) overlay.classList.toggle('hidden');
}

// --- 3. EXECUTION ---
// First, start animations for static text (About page)
startAnimations();

// Then, try to load Shopify data (Shop page)
initShopify();

inject();