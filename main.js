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

// --- 1. THE REVERSIBLE ANIMATION ENGINE (Mobile Refined) ---
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        // We target the Hero specifically to handle it differently than the IG feed
        const isHero = entry.target.tagName === 'MAIN' || entry.target.classList.contains('reveal-left');

        if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-x-0', 'scale-100');
        } else {
            // Safety: Only remove the animation if we are far from the top 
            // This prevents the "disappearing" issue when scrolling back up
            if (window.scrollY > 100) {
                entry.target.classList.remove('opacity-100', 'translate-x-0', 'scale-100');
            }
        }
    });
}, { 
    threshold: 0.01, 
    rootMargin: "10% 0px 10% 0px" // "Looks" ahead 10% so animations trigger sooner
});

function syncAnimations() {
    const elements = document.querySelectorAll('[class*="reveal-"]');
    elements.forEach(el => observer.observe(el));
    
    // FORCE TRIGGER TOP OF PAGE:
    // This ensures the Hero is ALWAYS visible when the user is at the top
    const handleTopReveal = () => {
        if (window.scrollY < 50) {
            const hero = document.querySelector('main.reveal-left');
            if (hero) hero.classList.add('opacity-100', 'translate-x-0', 'scale-100');
        }
    };

    window.addEventListener('scroll', handleTopReveal);
    handleTopReveal(); // Run once on load
}

// --- 2. CORE LOGIC ---
async function init() {
    syncAnimations();
    setupEventListeners();

    try {
        const existingId = localStorage.getItem('hcg_checkout_id');
        if (existingId) {
            const checkout = await client.checkout.fetch(existingId);
            checkoutId = checkout.id;
            updateCartUI(checkout);
        } else {
            const checkout = await client.checkout.create();
            checkoutId = checkout.id;
            localStorage.setItem('hcg_checkout_id', checkoutId);
        }
        if (grid) {
            const products = await client.product.fetchAll();
            renderProducts(products);
        }
    } catch (e) {
        console.log("Shopify offline - Design mode active.");
    }
}

function setupEventListeners() {
    if (document.querySelector('#close-cart')) document.querySelector('#close-cart').onclick = toggleCart;
    if (overlay) overlay.onclick = toggleCart;
    if (document.querySelector('#cart-count')) document.querySelector('#cart-count').onclick = toggleCart;

    if (!sessionStorage.getItem('journeySeen')) {
        const modal = document.getElementById('journey-modal');
        if (modal) setTimeout(() => modal.classList.remove('hidden'), 1000);
    }
}

// --- 3. DYNAMIC RENDERING ---
function renderProducts(products) {
    if (!grid) return;
    grid.innerHTML = '';
    products.forEach((p, index) => {
        const card = document.createElement('div');
        const delay = window.innerWidth < 768 ? index * 100 : index * 150;
        card.className = `reveal-up opacity-0 translate-y-12 scale-90 transition-all duration-1000 ease-out`;
        card.style.transitionDelay = `${delay}ms`;
        
        card.innerHTML = `
            <div class="group cursor-pointer p-2">
                <div class="aspect-[4/5] overflow-hidden bg-stone-100 mb-4">
                    <img src="${p.images[0].src}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div class="flex justify-between items-start">
                    <h3 class="font-bold uppercase text-[10px] tracking-widest">${p.title}</h3>
                    <p class="text-[10px] font-medium text-stone-500">$${p.variants[0].price.amount}</p>
                </div>
            </div>
        `;
        grid.appendChild(card);
        observer.observe(card);
    });
}

function toggleCart() {
    drawer?.classList.toggle('translate-x-full');
    overlay?.classList.toggle('hidden');
}

init();
inject();