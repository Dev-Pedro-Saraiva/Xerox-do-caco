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

const gridProdutos = document.getElementById('grid-produtos');

// --- CARREGAR DADOS ---
async function loadData() {
    const catSnap = await getDocs(query(collection(db, "categorias"), orderBy("ordem", "asc")));
    todasCategorias = catSnap.docs.map(d => d.data());
    
    const prodSnap = await getDocs(query(collection(db, "produtos"), orderBy("ordem", "asc")));
    renderCategories();
    renderProducts(prodSnap.docs);
    updateCart();
}

// --- RENDERIZAR CATEGORIAS ---
// --- RENDERIZAR CATEGORIAS ---
function renderCategories() {
    const container = document.getElementById('filtros-principais');
    const subContainer = document.getElementById('sub-filtros-container');
    if (!container) return;

    container.innerHTML = `<button class="filter-btn active" data-id="all">Tudo</button>`;
    if (subContainer) subContainer.style.display = "none";

    todasCategorias.filter(c => !c.parentID).forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.innerText = cat.nome;
        
        btn.onclick = () => {
            const subs = todasCategorias.filter(s => s.parentID === cat.nome);
            
            if (window.innerWidth <= 1024 && subs.length > 0) {
                renderMobileSubs(cat.nome, subs);
            } else {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                if (subs.length > 0) {
                    // MÁGICA AQUI: Move o container de subcategorias para logo após este botão
                    btn.after(subContainer); 
                    renderSubPills(subs);
                } else {
                    if (subContainer) subContainer.style.display = "none";
                }
                filtrarCards(cat.nome);
            }
        };
        container.appendChild(btn);
    });

    const btnAll = container.querySelector('[data-id="all"]');
    btnAll.onclick = () => resetFilters();
}

// --- SUB-CATEGORIAS NO PC (Abaixo da lista) ---
function renderSubPills(subs) {
    const subContainer = document.getElementById('sub-filtros-container');
    if (!subContainer) return;

    subContainer.innerHTML = "";
    subContainer.style.display = "flex"; // Garante o display flex
    
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
// --- SUB-CATEGORIAS NO MOBILE (Limpa a tela) ---
function renderMobileSubs(paiNome, subs) {
    const container = document.getElementById('filtros-principais');
    const subContainer = document.getElementById('sub-filtros-container');
    
    if (subContainer) subContainer.style.display = "none";
    container.innerHTML = ""; 

    const btnVoltar = document.createElement('button');
    btnVoltar.className = 'filter-btn btn-voltar';
    btnVoltar.innerText = "← Voltar";
    btnVoltar.onclick = () => resetFilters();
    container.appendChild(btnVoltar);

    subs.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.innerText = s.nome;
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtrarCards(s.nome);
        };
        container.appendChild(btn);
    });
    filtrarCards(paiNome);
}

function resetFilters() {
    const subContainer = document.getElementById('sub-filtros-container');
    if (subContainer) subContainer.style.display = "none";
    renderCategories();
    filtrarCards('all');
}

function filtrarCards(termo) {
    document.querySelectorAll('.promo-card').forEach(card => {
        const cats = card.dataset.category.split(',');
        card.style.display = (termo === 'all' || cats.includes(termo)) ? 'flex' : 'none';
    });
}

// --- RENDERIZAR PRODUTOS ---
function renderProducts(docs) {
    if (!gridProdutos) return;
    gridProdutos.innerHTML = "";
    docs.forEach(docSnap => {
        const p = docSnap.data();
        const id = docSnap.id; // Esse é o ID do Firebase
        let precoBase = parseFloat(p.precoBase || 0);
        
        const card = document.createElement('div');
        card.className = 'promo-card';
        card.dataset.category = [...(p.categorias || []), ...(p.subcategorias || [])].join(',');

        // MÁGICA AQUI: O clique na imagem ou no título redireciona para a página de detalhes
        card.innerHTML = `
            <div class="promo-img" 
                 style="background-image: url('${p.imagem || ''}'); cursor: pointer;" 
                 onclick="window.location.href='/produto/index.html?id=${id}'">
            </div>
            <div class="p-content">
                <h3 style="cursor: pointer;" 
                    onclick="window.location.href='/produto/index.html?id=${id}'">
                    ${p.nome}
                </h3>
                
                <span class="new-price" id="price-${id}">R$ ${precoBase.toFixed(2).replace('.', ',')}</span>
                
                <div class="card-footer-buttons" style="display: flex; gap: 10px; margin-top: 15px;">
                    <button class="btn-add" 
                        onclick="window.location.href='/produto/index.html?id=${id}'" 
                        style="width: 100%; background: var(--primary);">
                        Ver Detalhes
                    </button>
                </div>
            </div>`;
        gridProdutos.appendChild(card);
    });
}

// --- FUNÇÕES GLOBAIS (CARRINHO E VARIAÇÕES) ---
window.changeQty = (id, delta) => {
    const input = document.getElementById(`qty-${id}`);
    let val = parseInt(input.value) + delta;
    if (val >= 1) input.value = val;
};

window.selecionarVariacao = (id, nome, preco, el) => {
    const card = el.closest('.promo-card');
    card.querySelectorAll('.var-pill').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    document.getElementById(`price-${id}`).innerText = `R$ ${preco.toFixed(2).replace('.', ',')}`;
    const btn = document.getElementById(`btn-${id}`);
    btn.dataset.price = preco;
    btn.dataset.var = nome;
};

window.prepararAdicao = (id, nome) => {
    const btn = document.getElementById(`btn-${id}`);
    const qtd = parseInt(document.getElementById(`qty-${id}`).value);
    const preco = parseFloat(btn.dataset.price);
    const vNome = btn.dataset.var;
    const nomeFinal = vNome ? `${nome} (${vNome})` : nome;
    addToCart(`${id}-${vNome}`, nomeFinal, preco, qtd, id);
};

function addToCart(idUnico, nome, preco, qtd, idOriginal) {
    const idx = cart.findIndex(i => i.id === idUnico);
    if (idx > -1) {
        cart[idx].qty += qtd;
        cart[idx].subtotal = cart[idx].qty * preco;
    } else {
        cart.push({ id: idUnico, nome, preco, qty: qtd, subtotal: preco * qtd });
    }
    updateCart();
    
    const btn = document.getElementById(`btn-${idOriginal}`);
    btn.innerText = "Adicionado! ✓";
    btn.style.background = "#27ae60";
    setTimeout(() => { btn.innerText = "Adicionar"; btn.style.background = ""; }, 1500);
}

function updateCart() {
    const container = document.getElementById('cart-items');
    let total = 0;
    container.innerHTML = "";
    cart.forEach((item, i) => {
        total += item.subtotal;
        container.innerHTML += `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
                <div style="font-size:0.8rem;"><b>${item.qty}x</b> ${item.nome}</div>
                <div style="font-size:0.8rem;">R$ ${item.subtotal.toFixed(2).replace('.', ',')}</div>
                <button onclick="window.removeCart(${i})" style="color:red; background:none; border:none; cursor:pointer;">✕</button>
            </div>`;
    });
    document.getElementById('cart-total-value').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    document.getElementById('cart-count').innerText = cart.reduce((acc, i) => acc + i.qty, 0);
    localStorage.setItem('ferroforte_cart', JSON.stringify(cart));
}

window.removeCart = (i) => { cart.splice(i, 1); updateCart(); };

// --- MENU E CARRINHO ---
document.getElementById('cart-icon-btn').onclick = () => {
    document.getElementById('cart-sidebar').classList.add('active');
    document.getElementById('cart-overlay').classList.add('active');
};
document.getElementById('close-cart').onclick = () => {
    document.getElementById('cart-sidebar').classList.remove('active');
    document.getElementById('cart-overlay').classList.remove('active');
};
document.getElementById('btn-mobile').onclick = () => {
    document.getElementById('mobile-menu').classList.toggle('active');
};

document.getElementById('checkout-whatsapp').onclick = () => {
    if (cart.length === 0) return alert("Carrinho vazio!");
    let msg = "Olá, gostaria de fazer o pedido:\n\n";
    cart.forEach(i => msg += `*${i.qty}x* ${i.nome} - R$ ${i.subtotal.toFixed(2)}\n`);
    msg += `\n*Total: ${document.getElementById('cart-total-value').innerText}*`;
    window.open(`https://wa.me/5591985121047?text=${encodeURIComponent(msg)}`, '_blank');
};

loadData();



// --- FUNÇÃO DE PESQUISA ---
const inputBusca = document.getElementById('input-busca');

if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.promo-card');

        cards.forEach(card => {
            const nomeProduto = card.querySelector('h3').innerText.toLowerCase();
            
            // Se o nome incluir o termo pesquisado, mostra. Se não, esconde.
            if (nomeProduto.includes(termo)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });

        // Opcional: Resetar filtros de categoria ao pesquisar
        if (termo.length > 0) {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            const subContainer = document.getElementById('sub-filtros-container');
            if (subContainer) subContainer.style.display = "none";
        }
    });
}
