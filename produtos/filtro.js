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
let filtroAtivo = 'all';

const gridProdutos = document.getElementById('grid-produtos');
const subContainer = document.getElementById('sub-filtros-container');

// --- MENU MOBILE ---
const btnMobile = document.getElementById('btn-mobile');
const mobileMenu = document.getElementById('mobile-menu');

if (btnMobile && mobileMenu) {
    btnMobile.onclick = (e) => {
        e.preventDefault();
        mobileMenu.classList.toggle('active');
        const isOpened = mobileMenu.classList.contains('active');
        btnMobile.style.opacity = isOpened ? "0.5" : "1";
    };
}

// --- CARRINHO INTERFACE ---
document.getElementById('cart-icon-btn').onclick = () => {
    document.getElementById('cart-sidebar').classList.add('active');
    document.getElementById('cart-overlay').classList.add('active');
};
document.getElementById('close-cart').onclick = () => {
    document.getElementById('cart-sidebar').classList.remove('active');
    document.getElementById('cart-overlay').classList.remove('active');
};

window.changeQty = (id, delta) => {
    const input = document.getElementById(`qty-${id}`);
    let val = parseInt(input.value) + delta;
    if (val >= 1) input.value = val;
};

// --- CARREGAR DADOS ---
async function loadData() {
    const catSnap = await getDocs(query(collection(db, "categorias"), orderBy("ordem", "asc")));
    todasCategorias = catSnap.docs.map(d => d.data());
    renderCategories();

    const prodSnap = await getDocs(query(collection(db, "produtos"), orderBy("ordem", "asc")));
    renderProducts(prodSnap.docs);
    updateCart();
}

function renderCategories() {
    const container = document.getElementById('filtros-principais');
    if(!container) return;
    container.innerHTML = `<button class="filter-btn active" data-id="all">Tudo</button>`;

    todasCategorias.filter(c => !c.parentID).forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.innerText = cat.nome;
        btn.onclick = () => {
            if (filtroAtivo === cat.nome) {
                resetFilters();
            } else {
                filtroAtivo = cat.nome;
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderSubPills(todasCategorias.filter(s => s.parentID === cat.nome));
                filtrarCards(cat.nome);
            }
        };
        container.appendChild(btn);
    });
    container.querySelector('[data-id="all"]').onclick = resetFilters;
}

function resetFilters() {
    filtroAtivo = 'all';
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-id="all"]').classList.add('active');
    subContainer.style.display = "none";
    filtrarCards('all');
}

function renderSubPills(subs) {
    subContainer.innerHTML = "";
    if (subs.length === 0) { subContainer.style.display = "none"; return; }
    subContainer.style.display = "flex";
    subs.forEach(s => {
        const p = document.createElement('button');
        p.className = 'sub-filter-pills';
        p.innerText = s.nome;
        p.onclick = () => {
            document.querySelectorAll('.sub-filter-pills').forEach(b => b.classList.remove('active'));
            p.classList.add('active');
            filtrarCards(s.nome);
        };
        subContainer.appendChild(p);
    });
}

// --- RENDERIZAÇÃO DE PRODUTOS COM VARIAÇÕES ---
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

        // Lógica de Variações
        let htmlVariacoes = "";
        if (temVariacoes) {
            htmlVariacoes = `<div class="p-variations">`;
            p.variacoes.forEach((v, index) => {
                const activeClass = index === 0 ? 'active' : '';
                // Se a variação não tiver preço, usa o precoBase do produto
                const precoVar = v.preco ? parseFloat(v.preco) : precoBase;
                
                htmlVariacoes += `
                    <button class="var-pill ${activeClass}" 
                        onclick="window.selecionarVariacao('${id}', '${v.nome}', ${precoVar}, this)">
                        ${v.nome}
                    </button>`;
            });
            htmlVariacoes += `</div>`;
            
            // Inicia o card com o preço da primeira variação
            if(p.variacoes[0].preco) precoBase = parseFloat(p.variacoes[0].preco);
        }

        card.dataset.category = [...(p.categorias || []), ...(p.subcategorias || [])].join(',');
        
        card.innerHTML = `
            <div class="promo-img" style="background-image: url('${p.imagem || ''}')" onclick="window.location.href='../produto/index.html?id=${id}'"></div>
            <div class="p-content">
                <h3 onclick="window.location.href='../produto/index.html?id=${id}'">${p.nome}</h3>
                <p class="p-desc">${p.descricao || ''}</p>
                
                ${htmlVariacoes}

                <span class="new-price" id="price-display-${id}">R$ ${precoBase.toFixed(2).replace('.', ',')}</span>
                
                <div class="qty-control">
                    <button onclick="window.changeQty('${id}', -1)">-</button>
                    <input type="number" id="qty-${id}" value="1" readonly>
                    <button onclick="window.changeQty('${id}', 1)">+</button>
                </div>
                
                <button class="btn-add" id="btn-${id}" 
                    data-current-price="${precoBase}"
                    data-current-var="${temVariacoes ? p.variacoes[0].nome : ''}"
                    onclick="window.prepararAdicao('${id}', '${p.nome}')">
                    Adicionar ao Pedido
                </button>
            </div>`;
        gridProdutos.appendChild(card);
    });
}

// Lógica de Seleção de Variação no Card
window.selecionarVariacao = (prodId, varNome, preco, elemento) => {
    const card = document.getElementById(`card-${prodId}`);
    // Remove active de todos os botões do card específico
    card.querySelectorAll('.var-pill').forEach(btn => btn.classList.remove('active'));
    // Adiciona active no clicado
    elemento.classList.add('active');

    // Atualiza preço visual
    const displayPreco = document.getElementById(`price-display-${prodId}`);
    displayPreco.innerText = `R$ ${parseFloat(preco).toFixed(2).replace('.', ',')}`;

    // Atualiza metadados no botão de compra principal
    const btnCompra = document.getElementById(`btn-${prodId}`);
    btnCompra.dataset.currentPrice = preco;
    btnCompra.dataset.currentVar = varNome;
};

// Prepara os dados para enviar ao carrinho
window.prepararAdicao = (id, nomeOriginal) => {
    const btn = document.getElementById(`btn-${id}`);
    const preco = parseFloat(btn.dataset.currentPrice);
    const variacao = btn.dataset.currentVar;
    const qtdInput = document.getElementById(`qty-${id}`);
    const qtd = parseInt(qtdInput.value);
    
    const nomeFinal = variacao ? `${nomeOriginal} (${variacao})` : nomeOriginal;
    // O ID no carrinho precisa ser único por variação para não somar itens diferentes
    const idUnico = variacao ? `${id}-${variacao.replace(/\s+/g, '')}` : id;

    window.addToCart(idUnico, nomeFinal, preco, qtd);
};

function filtrarCards(termo) {
    document.querySelectorAll('.promo-card').forEach(card => {
        const cats = card.dataset.category.split(',');
        card.style.display = (termo === 'all' || cats.includes(termo)) ? 'flex' : 'none';
    });
}

// --- CARRINHO LOGICA (MELHORADA) ---
window.addToCart = (id, nome, preco, qtd) => {
    const idx = cart.findIndex(i => i.id === id);
    if(idx > -1) { 
        cart[idx].qty += qtd; 
        cart[idx].subtotal = cart[idx].qty * preco; 
    } else { 
        cart.push({ id, nome, preco, qty: qtd, subtotal: preco * qtd }); 
    }
    updateCart();
    
    // Feedback visual no botão (usa o ID original para o seletor de UI)
    const originalId = id.split('-')[0];
    const btn = document.getElementById(`btn-${originalId}`);
    if(btn) {
        const textOrig = btn.innerText;
        btn.innerText = "Adicionado! ✓";
        btn.style.background = "#27ae60";
        setTimeout(() => { 
            btn.innerText = textOrig; 
            btn.style.background = ""; 
        }, 1500);
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

// --- FINALIZAR WHATSAPP ---
document.getElementById('checkout-whatsapp').onclick = () => {
    if(cart.length === 0) return alert("Carrinho vazio!");
    let texto = "Olá! Gostaria de solicitar os seguintes itens:\n\n";
    let total = 0;
    cart.forEach(item => {
        texto += `*${item.qty}x* ${item.nome} - R$ ${item.subtotal.toFixed(2).replace('.', ',')}\n`;
        total += item.subtotal;
    });
    texto += `\n*Total estimado: R$ ${total.toFixed(2).replace('.', ',')}*`;
    const fone = "5591983053860"; 
    window.open(`https://wa.me/${fone}?text=${encodeURIComponent(texto)}`, '_blank');
};

loadData();