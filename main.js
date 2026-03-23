import { inject } from '@vercel analytics';
import Client from 'shopify-buy';

// --- 1. SHOPIFY CONFIG ---
const client = Client.buildClient({
  domain: 'YOUR_STORE.myshopify.com', 
  storefrontAccessToken: 'YOUR_TOKEN' 
});

let checkoutId = null;
const grid = document.querySelector('#product-grid');
const drawer = document.querySelector('#cart-drawer');
const overlay = document.querySelector('#cart-overlay');

// --- 2. THE REVERSIBLE ANIMATION ENGINE ---
// Optimized to handle all directions (left, right, up) and scaling
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-x-0', 'translate-y-0', 'scale-100');
        } else {
            entry.target.classList.remove('opacity-100', 'translate-x-0', 'translate-y-0', 'scale-100');
        }
    });
}, { threshold: 0.05, rootMargin: "-20px 0px" });

function syncAnimations() {
    document.querySelectorAll('[class*="reveal-"]').forEach(el => observer.observe(el));
}

// --- 3. CORE CLUBHOUSE LOGIC (Shopify & UI) ---
async function initShopify() {
    // Persist Cart: Check if user already has a checkout ID in their browser
    const existingCheckoutId = localStorage.getItem('hcg_checkout_id');
    
    if (existingCheckoutId) {
        try {
            const checkout = await client.checkout.fetch(existingCheckoutId);
            if (!checkout.completedAt) {
                checkoutId = checkout.id;
                updateCartUI(checkout);
            } else {
                await createNewCheckout();
            }
        } catch (e) {
            await createNewCheckout();
        }
    } else {
        await createNewCheckout();
    }

    if (grid) {
        const products = await client.product.fetchAll();
        renderProducts(products);
    }

    setupEventListeners();
    syncAnimations(); // Catches static and dynamic elements
}

async function createNewCheckout() {
    const checkout = await client.checkout.create();
    checkoutId = checkout.id;
    localStorage.setItem('hcg_checkout_id', checkoutId);
}

function setupEventListeners() {
    const closeBtn = document.querySelector('#close-cart');
    const cartCount = document.querySelector('#cart-count');

    if (closeBtn) closeBtn.onclick = toggleCart;
    if (overlay) overlay.onclick = toggleCart;
    if (cartCount) cartCount.onclick = toggleCart;

    // Journey Modal Logic (Now centralized here)
    if (!sessionStorage.getItem('journeySeen')) {
        const modal = document.getElementById('journey-modal');
        if (modal) setTimeout(() => modal.classList.remove('hidden'), 1000);
    }
}

// --- 4. DYNAMIC RENDERING (Staggered Products) ---
function renderProducts(products) {
    if (!grid) return;
    grid.innerHTML = '';

    products.forEach((product, index) => {
        const card = document.createElement('div');
        // Applying the 'High Cut' reveal-up and staggering via delay
        card.className = `reveal-up opacity-0 translate-y-12 scale-90 transition-all duration-1000 ease-out`;
        card.style.transitionDelay = `${index * 150}ms`; // Staggers products as they load

        const variantId = product.variants[0].id;
        const price = product.variants[0].price.amount;

        card.innerHTML = `
            <div class="group cursor-pointer">
                <div class="aspect-[4/5] overflow-hidden bg-stone-100 mb-6 relative">
                    <img src="${product.images[0].src}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div class="flex justify-between items-start mb-4 px-2">
                    <h3 class="font-bold uppercase text-xs tracking-[0.2em]">${product.title}</h3>
                    <p class="font-medium text-stone-500">$${price}</p>
                </div>
            </div>
        `;

        const btn = document.createElement('button');
        btn.className = "w-full border border-stone-900 py-4 uppercase text-[10px] font-black tracking-[0.3em] hover:bg-stone-900 hover:text-white transition-all";
        btn.innerText = "Add to Bag";
        btn.onclick = () => addToCart(variantId, btn);
        
        card.appendChild(btn);
        grid.appendChild(card);
        observer.observe(card);
    });
}

async function addToCart(variantId, btn) {
    const originalText = btn.innerText;
    btn.innerText = "Adding...";
    btn.disabled = true;

    const lineItemsToAdd = [{ variantId, quantity: 1 }];
    const checkout = await client.checkout.addLineItems(checkoutId, lineItemsToAdd);
    
    updateCartUI(checkout);
    btn.innerText = originalText;
    btn.disabled = false;
    toggleCart(); 
}

function updateCartUI(checkout) {
    const cartContainer = document.querySelector('#cart-items');
    const countDisplay = document.querySelector('#cart-count');
    const subtotalDisplay = document.querySelector('#cart-subtotal');
    
    if (countDisplay) countDisplay.innerText = `Bag (${checkout.lineItems.length})`;
    if (subtotalDisplay) subtotalDisplay.innerText = `$${checkout.paymentDue.amount}`;
    if (!cartContainer) return;

    if (checkout.lineItems.length === 0) {
        cartContainer.innerHTML = `<p class="text-stone-400 italic text-sm">Your bag is as empty as a bunker...</p>`;
        return;
    }

    cartContainer.innerHTML = checkout.lineItems.map(item => `
        <div class="flex gap-4 border-b border-stone-100 pb-4">
            <img src="${item.variant.image.src}" class="w-20 h-24 object-cover bg-stone-50">
            <div class="flex-1">
                <h4 class="font-bold text-[10px] uppercase tracking-widest">${item.title}</h4>
                <p class="text-[9px] text-stone-400 uppercase mt-1">${item.variant.title}</p>
                <p class="mt-3 text-sm font-bold">$${item.variant.price.amount}</p>
            </div>
        </div>
    `).join('');

    const checkoutBtn = document.querySelector('#checkout-btn');
    if (checkoutBtn) checkoutBtn.onclick = () => window.location.href = checkout.webUrl;
}

function toggleCart() {
    drawer?.classList.toggle('translate-x-full');
    overlay?.classList.toggle('hidden');
}

// --- 5. EXECUTION ---
initShopify();
inject();