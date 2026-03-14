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

// --- RENDERIZAR PRODUTOS (COM ACABAMENTOS) ---
function renderProducts(docs) {
    gridProdutos.innerHTML = "";
    docs.forEach(docSnap => {
        const p = docSnap.data();
        const id = docSnap.id;
        let precoBase = parseFloat(p.precoBase || 0);
        let temVariacoes = p.variacoes && p.variacoes.length > 0;
        let temAcabamentos = p.acabamentos && p.acabamentos.length > 0;

        const card = document.createElement('div');
        card.className = 'promo-card';
        card.id = `card-${id}`;
        card.dataset.category = [...(p.categorias || []), ...(p.subcategorias || [])].join(',');

        // Variações
        let htmlVariacoes = temVariacoes ? `<div class="p-variations">` : "";
        if (temVariacoes) {
            p.variacoes.forEach((v, idx) => {
                const active = idx === 0 ? 'active' : '';
                const precoVar = v.preco ? parseFloat(v.preco) : precoBase;
                htmlVariacoes += `<button class="var-pill ${active}" onclick="event.stopPropagation(); window.selecionarVariacao('${id}', '${v.nome}', ${precoVar}, this)">${v.nome}</button>`;
            });
            htmlVariacoes += `</div>`;
            if(p.variacoes[0].preco) precoBase = parseFloat(p.variacoes[0].preco);
        }

        // Acabamentos
        let htmlAcabamentos = temAcabamentos ? `<div class="p-finishes" style="margin: 10px 0; display: flex; flex-wrap: wrap; gap: 8px;">` : "";
        if (temAcabamentos) {
            p.acabamentos.forEach((a) => {
                const valorAdicional = parseFloat(a.adicional || 0);
                const labelPreco = valorAdicional > 0 ? ` (+R$ ${valorAdicional.toFixed(2).replace('.', ',')})` : "";
                htmlAcabamentos += `
                    <label onclick="event.stopPropagation()" style="font-size: 0.75rem; background: #f1f2f6; padding: 6px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; border: 1px solid #ddd;">
                        <input type="checkbox" class="finish-check-${id}" data-nome="${a.nome}" data-adicional="${valorAdicional}" onchange="window.recalcularPreco('${id}')"> 
                        ${a.nome}${labelPreco}
                    </label>`;
            });
            htmlAcabamentos += `</div>`;
        }

        // O card agora tem um link de redirecionamento, exceto nos botões internos
        card.innerHTML = `
            <div class="promo-img" style="background-image: url('${p.imagem || ''}'); cursor:pointer" onclick="window.location.href='/produto/index.html?id=${id}'"></div>
            <div class="p-content">
                <h3 style="cursor:pointer" onclick="window.location.href='/produto/index.html?id=${id}'">${p.nome}</h3>
                <p class="p-desc" style="white-space: pre-line;">${p.descricao || ''}</p>
                ${htmlVariacoes}
                ${htmlAcabamentos}
                <span class="new-price" id="price-display-${id}">R$ ${precoBase.toFixed(2).replace('.', ',')}</span>
                <div class="qty-control" onclick="event.stopPropagation()">
                    <button onclick="window.changeQty('${id}', -1)">-</button>
                    <input type="number" id="qty-${id}" value="1" readonly>
                    <button onclick="window.changeQty('${id}', 1)">+</button>
                </div>
                <button class="btn-add" id="btn-${id}" 
                    data-base-price="${precoBase}" 
                    data-current-var="${temVariacoes ? p.variacoes[0].nome : ''}" 
                    onclick="event.stopPropagation(); window.prepararAdicao('${id}', '${p.nome}')">
                    Adicionar ao Pedido
                </button>
            </div>`;
        gridProdutos.appendChild(card);
    });
}
// --- LÓGICA DE PREÇO E SELEÇÃO ---

window.recalcularPreco = (id) => {
    const btn = document.getElementById(`btn-${id}`);
    let precoBase = parseFloat(btn.dataset.basePrice);
    let adicional = 0;
    
    document.querySelectorAll(`.finish-check-${id}:checked`).forEach(el => {
        adicional += parseFloat(el.dataset.adicional);
    });

    const precoFinal = precoBase + adicional;
    document.getElementById(`price-display-${id}`).innerText = `R$ ${precoFinal.toFixed(2).replace('.', ',')}`;
};

window.selecionarVariacao = (prodId, varNome, preco, elemento) => {
    const card = document.getElementById(`card-${prodId}`);
    card.querySelectorAll('.var-pill').forEach(btn => btn.classList.remove('active'));
    elemento.classList.add('active');
    
    const btn = document.getElementById(`btn-${prodId}`);
    btn.dataset.basePrice = preco; 
    btn.dataset.currentVar = varNome;
    
    window.recalcularPreco(prodId);
};

window.changeQty = (id, delta) => {
    const input = document.getElementById(`qty-${id}`);
    let val = parseInt(input.value) + delta;
    if (val >= 1) input.value = val;
};

// --- CARRINHO E ADIÇÃO ---

window.prepararAdicao = (id, nomeOriginal) => {
    const btn = document.getElementById(`btn-${id}`);
    const precoBase = parseFloat(btn.dataset.basePrice);
    const variacao = btn.dataset.currentVar;
    const qtd = parseInt(document.getElementById(`qty-${id}`).value);
    
    let extrasNomes = [];
    let precoAdicionalTotal = 0;
    
    document.querySelectorAll(`.finish-check-${id}:checked`).forEach(el => {
        extrasNomes.push(el.dataset.nome);
        precoAdicionalTotal += parseFloat(el.dataset.adicional);
    });

    let nomeFinal = variacao ? `${nomeOriginal} (${variacao})` : nomeOriginal;
    if(extrasNomes.length > 0) {
        nomeFinal += ` + ${extrasNomes.join(' + ')}`;
    }

    const precoFinal = precoBase + precoAdicionalTotal;
    const comboId = `${id}-${variacao}-${extrasNomes.join('-')}`.replace(/\s+/g, '');

    window.addToCart(comboId, nomeFinal, precoFinal, qtd);
};

window.addToCart = (id, nome, preco, qtd) => {
    const idx = cart.findIndex(i => i.id === id);
    if(idx > -1) { 
        cart[idx].qty += qtd; 
        cart[idx].subtotal = cart[idx].qty * preco; 
    } else { 
        cart.push({ id, nome, preco, qty: qtd, subtotal: preco * qtd }); 
    }
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

// --- FINALIZAÇÃO ---

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
