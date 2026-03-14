import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCNYVaYrjUZKWYP-yV8AU2awmzcp7M7IoA",
    authDomain: "penielmatconst.firebaseapp.com",
    projectId: "penielmatconst",
    storageBucket: "penielmatconst.firebasestorage.app",
    messagingSenderId: "769088435817",
    appId: "1:769088435817:web:5496b08f49aae3756d94f8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cart = JSON.parse(localStorage.getItem('ferroforte_cart')) || [];
let todasCategorias = [];
let todosProdutosDocs = []; 

const gridProdutos = document.getElementById('grid-produtos');

// --- LÓGICA DO MENU MOBILE (HAMBURGUER) ---
const btnMobile = document.getElementById('btn-mobile');
const mobileMenu = document.getElementById('mobile-menu');

if (btnMobile && mobileMenu) {
    btnMobile.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        const active = mobileMenu.classList.contains('active');
        btnMobile.setAttribute('aria-expanded', active);
        
        const hamburger = document.getElementById('hamburger');
        if (active) {
            hamburger.style.borderTopColor = 'transparent';
        } else {
            hamburger.style.borderTopColor = 'var(--dark)';
        }
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    });
}

// --- BUSCA PELA LUPA ---
const inputBusca = document.getElementById('input-busca');
if(inputBusca) {
    inputBusca.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        document.querySelectorAll('.promo-card').forEach(card => {
            const nome = card.querySelector('h3').innerText.toLowerCase();
            const desc = card.querySelector('.p-desc').innerText.toLowerCase();
            card.style.display = (nome.includes(termo) || desc.includes(termo)) ? 'flex' : 'none';
        });
    });
}

// --- CARREGAR DADOS ---
async function loadData() {
    const catSnap = await getDocs(query(collection(db, "categorias"), orderBy("ordem", "asc")));
    todasCategorias = catSnap.docs.map(d => d.data());
    renderCategories();

    const prodSnap = await getDocs(query(collection(db, "produtos"), orderBy("ordem", "asc")));
    todosProdutosDocs = prodSnap.docs;
    renderProducts(todosProdutosDocs);
    updateCart();
}

function renderCategories() {
    const container = document.getElementById('filtros-principais');
    if(!container) return;
    
    container.innerHTML = `<button class="filter-btn active" id="btn-all">Tudo</button>`;
    document.getElementById('btn-all').onclick = () => {
        resetActiveFilters();
        document.getElementById('btn-all').classList.add('active');
        filtrarCards('all');
    };

    todasCategorias.filter(c => !c.parentID).forEach(cat => {
        const group = document.createElement('div');
        group.className = 'cat-group';
        
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.innerText = cat.nome;

        const subList = document.createElement('div');
        subList.className = 'sub-menu-list';
        
        const subs = todasCategorias.filter(s => s.parentID === cat.nome);
        subs.forEach(s => {
            const subItem = document.createElement('span');
            subItem.className = 'sub-link';
            subItem.innerText = s.nome;
            subItem.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.sub-link').forEach(l => l.classList.remove('active'));
                subItem.classList.add('active');
                filtrarCards(s.nome);
            };
            subList.appendChild(subItem);
        });

        btn.onclick = () => {
            const isAlreadyActive = group.classList.contains('active');
            resetActiveFilters();
            
            if (!isAlreadyActive) {
                group.classList.add('active');
                btn.classList.add('active');
                filtrarCards(cat.nome);
            } else {
                document.getElementById('btn-all').classList.add('active');
                filtrarCards('all');
            }
        };

        group.appendChild(btn);
        group.appendChild(subList);
        container.appendChild(group);
    });
}

function resetActiveFilters() {
    document.querySelectorAll('.cat-group').forEach(g => g.classList.remove('active'));
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.sub-link').forEach(l => l.classList.remove('active'));
}

function filtrarCards(termo) {
    document.querySelectorAll('.promo-card').forEach(card => {
        const cats = card.dataset.category.split(',');
        card.style.display = (termo === 'all' || cats.includes(termo)) ? 'flex' : 'none';
    });
}

function renderProducts(docs) {
    gridProdutos.innerHTML = "";
    docs.forEach(docSnap => {
        const p = docSnap.data();
        const id = docSnap.id;
        let precoBase = parseFloat(p.precoBase || 0);
        let temVariacoes = p.variacoes && p.variacoes.length > 0;

        const card = document.createElement('div');
        card.className = 'promo-card';
        card.id = `card-${id}`;
        card.dataset.category = [...(p.categorias || []), ...(p.subcategorias || [])].join(',');

        let htmlVariacoes = temVariacoes ? `<div class="p-variations">` : "";
        if (temVariacoes) {
            p.variacoes.forEach((v, idx) => {
                const active = idx === 0 ? 'active' : '';
                const precoVar = v.preco ? parseFloat(v.preco) : precoBase;
                htmlVariacoes += `<button class="var-pill ${active}" onclick="window.selecionarVariacao('${id}', '${v.nome}', ${precoVar}, this)">${v.nome}</button>`;
            });
            htmlVariacoes += `</div>`;
            if(p.variacoes[0].preco) precoBase = parseFloat(p.variacoes[0].preco);
        }

        card.innerHTML = `
            <div class="promo-img" style="background-image: url('${p.imagem || ''}')"></div>
            <div class="p-content">
                <h3>${p.nome}</h3>
                <p class="p-desc">${p.descricao || ''}</p>
                ${htmlVariacoes}
                <span class="new-price" id="price-display-${id}">R$ ${precoBase.toFixed(2).replace('.', ',')}</span>
                <div class="qty-control">
                    <button onclick="window.changeQty('${id}', -1)">-</button>
                    <input type="number" id="qty-${id}" value="1" readonly>
                    <button onclick="window.changeQty('${id}', 1)">+</button>
                </div>
                <button class="btn-add" id="btn-${id}" data-current-price="${precoBase}" data-current-var="${temVariacoes ? p.variacoes[0].nome : ''}" onclick="window.prepararAdicao('${id}', '${p.nome}')">
                    Adicionar ao Pedido
                </button>
            </div>`;
        gridProdutos.appendChild(card);
    });
}

window.changeQty = (id, delta) => {
    const input = document.getElementById(`qty-${id}`);
    let val = parseInt(input.value) + delta;
    if (val >= 1) input.value = val;
};

window.selecionarVariacao = (prodId, varNome, preco, elemento) => {
    const card = document.getElementById(`card-${prodId}`);
    card.querySelectorAll('.var-pill').forEach(btn => btn.classList.remove('active'));
    elemento.classList.add('active');
    document.getElementById(`price-display-${prodId}`).innerText = `R$ ${parseFloat(preco).toFixed(2).replace('.', ',')}`;
    const btn = document.getElementById(`btn-${prodId}`);
    btn.dataset.currentPrice = preco;
    btn.dataset.currentVar = varNome;
};

window.prepararAdicao = (id, nomeOriginal) => {
    const btn = document.getElementById(`btn-${id}`);
    const preco = parseFloat(btn.dataset.currentPrice);
    const variacao = btn.dataset.currentVar;
    const qtd = parseInt(document.getElementById(`qty-${id}`).value);
    const nomeFinal = variacao ? `${nomeOriginal} (${variacao})` : nomeOriginal;
    window.addToCart(variacao ? `${id}-${variacao.replace(/\s+/g, '')}` : id, nomeFinal, preco, qtd);
};

window.addToCart = (id, nome, preco, qtd) => {
    const idx = cart.findIndex(i => i.id === id);
    if(idx > -1) { cart[idx].qty += qtd; cart[idx].subtotal = cart[idx].qty * preco; }
    else { cart.push({ id, nome, preco, qty: qtd, subtotal: preco * qtd }); }
    updateCart();
    
    const originalId = id.split('-')[0];
    const btn = document.getElementById(`btn-${originalId}`);
    if(btn) {
        const textOrig = btn.innerText;
        btn.innerText = "Adicionado! ✓";
        btn.style.background = "#27ae60";
        setTimeout(() => { btn.innerText = textOrig; btn.style.background = ""; }, 1500);
    }
};

function updateCart() {
    const container = document.getElementById('cart-items');
    if(!container) return;
    container.innerHTML = "";
    let total = 0;
    cart.forEach((item, i) => {
        total += item.subtotal;
        container.innerHTML += `
            <div style="padding:15px 0; border-bottom:1px solid #eee;">
                <div style="display:flex; justify-content:space-between; font-weight:800; color:var(--dark); font-size:0.85rem;">
                    <span>${item.qty}x ${item.nome}</span>
                    <button onclick="window.removeItem(${i})" style="color:red; cursor:pointer; background:none; border:none;">✕</button>
                </div>
                <div style="color:var(--primary); font-size:0.9rem; margin-top:5px;">R$ ${item.subtotal.toFixed(2).replace('.', ',')}</div>
            </div>`;
    });
    const totalEl = document.getElementById('cart-total-value');
    const countEl = document.getElementById('cart-count');
    if(totalEl) totalEl.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    if(countEl) countEl.innerText = cart.reduce((acc, i) => acc + i.qty, 0);
    localStorage.setItem('ferroforte_cart', JSON.stringify(cart));
}

window.removeItem = (i) => { cart.splice(i, 1); updateCart(); };

const btnCheckout = document.getElementById('checkout-whatsapp');
if(btnCheckout) {
    btnCheckout.onclick = () => {
        if(cart.length === 0) return alert("Carrinho vazio!");
        let texto = "Olá! Gostaria de solicitar os seguintes itens:\n\n";
        let total = 0;
        cart.forEach(item => {
            texto += `*${item.qty}x* ${item.nome} - R$ ${item.subtotal.toFixed(2).replace('.', ',')}\n`;
            total += item.subtotal;
        });
        texto += `\n*Total estimado: R$ ${total.toFixed(2).replace('.', ',')}*`;
        window.open(`https://wa.me/559185121047?text=${encodeURIComponent(texto)}`, '_blank');
    };
}

const btnCloseCart = document.getElementById('close-cart');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const btnCartIcon = document.getElementById('cart-icon-btn');

if(btnCartIcon) btnCartIcon.onclick = () => { cartSidebar.classList.add('active'); cartOverlay.classList.add('active'); };
if(btnCloseCart) btnCloseCart.onclick = () => { cartSidebar.classList.remove('active'); cartOverlay.classList.remove('active'); };
if(cartOverlay) cartOverlay.onclick = () => { cartSidebar.classList.remove('active'); cartOverlay.classList.remove('active'); };

loadData();
