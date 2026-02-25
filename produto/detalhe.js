import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, doc, getDoc, collection, query, where, getDocs, limit 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

const loading = document.getElementById('loading');
const content = document.getElementById('product-content');
const qtyInput = document.getElementById('qty-detalhe');
const imgPrincipal = document.getElementById('view-principal');

let variacaoSelecionada = null;

// --- FUNÇÃO DE AVISO (TOAST) ---
function showToast(message) {
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 2500);
}

async function loadProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const produtoId = urlParams.get('id');

    if (!produtoId) {
        window.location.href = '../produtos/index.html';
        return;
    }

    try {
        const docRef = doc(db, "produtos", produtoId);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            const produtoData = snap.data();
            renderDetail(produtoData, snap.id);
            loadRelatedProducts(produtoData, snap.id);
        } else {
            window.location.href = '../produtos/index.html';
        }
    } catch (e) {
        console.error("Erro:", e);
    }
}

function renderDetail(p, id) {
    // --- ATUALIZA URL AMIGÁVEL ---
    const nomeLimpo = p.nome.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newUrl = `${window.location.pathname}?id=${id}&produto=${nomeLimpo}`;
    window.history.replaceState({}, '', newUrl);
    document.title = `Peniel | ${p.nome}`;

    document.getElementById('detalhe-nome').innerText = p.nome;
    document.getElementById('detalhe-desc').innerText = p.descricao || 'Qualidade Peniel Materiais.';
    
    let precoBase = parseFloat(p.precoBase || 0);
    const precoEl = document.getElementById('detalhe-preco');
    const containerVars = document.getElementById('detalhe-variacoes');
    
    imgPrincipal.src = p.imagem;
    containerVars.innerHTML = "";

    // Lógica de Variações
    if (p.variacoes && p.variacoes.length > 0) {
        p.variacoes.forEach((v, index) => {
            const btn = document.createElement('button');
            btn.className = `var-btn-detalhe ${index === 0 ? 'active' : ''}`;
            btn.innerText = v.nome;
            if(index === 0) {
                variacaoSelecionada = v;
                precoBase = v.preco ? parseFloat(v.preco) : precoBase;
            }
            btn.onclick = () => {
                document.querySelectorAll('.var-btn-detalhe').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                variacaoSelecionada = v;
                const novoPreco = v.preco ? parseFloat(v.preco) : parseFloat(p.precoBase);
                precoEl.innerText = `R$ ${novoPreco.toFixed(2).replace('.', ',')}`;
            };
            containerVars.appendChild(btn);
        });
    } else {
        variacaoSelecionada = null;
    }

    precoEl.innerText = `R$ ${precoBase.toFixed(2).replace('.', ',')}`;

    // Thumbs (Galeria)
    const containerThumbs = document.getElementById('thumbs');
    containerThumbs.innerHTML = "";
    const imagens = p.imagens?.length > 0 ? p.imagens : [p.imagem];
    imagens.forEach((url, i) => {
        const img = document.createElement('img');
        img.src = url;
        img.className = `thumb-img ${i === 0 ? 'active' : ''}`;
        img.onclick = () => {
            imgPrincipal.src = url;
            document.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
            img.classList.add('active');
        };
        containerThumbs.appendChild(img);
    });

    // Controle de Quantidade
    document.getElementById('qty-plus').onclick = () => {
        qtyInput.value = parseInt(qtyInput.value) + 1;
    };
    document.getElementById('qty-minus').onclick = () => {
        if(parseInt(qtyInput.value) > 1) {
            qtyInput.value = parseInt(qtyInput.value) - 1;
        }
    };

    // --- CARRINHO SEM ALERT ---
    document.getElementById('btn-add-detalhe').onclick = () => {
        let cart = JSON.parse(localStorage.getItem('ferroforte_cart')) || [];
        const qtd = parseInt(qtyInput.value);
        const precoItem = variacaoSelecionada?.preco ? parseFloat(variacaoSelecionada.preco) : parseFloat(p.precoBase);
        const nomeFinal = variacaoSelecionada ? `${p.nome} (${variacaoSelecionada.nome})` : p.nome;
        const idUnico = variacaoSelecionada ? `${id}-${variacaoSelecionada.nome}` : id;

        const idx = cart.findIndex(i => i.id === idUnico);
        if(idx > -1) { 
            cart[idx].qty += qtd; 
            cart[idx].subtotal = cart[idx].qty * precoItem; 
        } else { 
            cart.push({ 
                id: idUnico, 
                nome: nomeFinal, 
                preco: precoItem, 
                qty: qtd, 
                subtotal: precoItem * qtd,
                imagem: p.imagem 
            }); 
        }
        
        localStorage.setItem('ferroforte_cart', JSON.stringify(cart));
        
        // Feedback elegante
        showToast("✓ Adicionado ao seu pedido!");

        // Redireciona após o usuário ver a mensagem
        setTimeout(() => {
            window.location.href = '../produtos/index.html';
        }, 1200);
    };

    loading.style.display = 'none';
    content.style.display = 'grid';
}

async function loadRelatedProducts(currentProduct, currentId) {
    const grid = document.getElementById('related-grid');
    const container = document.getElementById('related-container');
    
    const termo = currentProduct.subcategorias?.[0] || currentProduct.categorias?.[0];
    if (!termo) return;

    try {
        const campoFiltro = currentProduct.subcategorias?.[0] ? "subcategorias" : "categorias";
        const q = query(collection(db, "produtos"), where(campoFiltro, "array-contains", termo), limit(5));
        const snap = await getDocs(q);
        let html = "";

        snap.forEach(docSnap => {
            const p = docSnap.data();
            const id = docSnap.id;
            if (id !== currentId) {
                html += `
                <div class="promo-card" onclick="window.location.href='index.html?id=${id}'" style="cursor:pointer">
                    <div class="promo-img" style="background-image: url('${p.imagem}')"></div>
                    <div class="p-content">
                        <h3>${p.nome}</h3>
                        <span class="new-price">R$ ${parseFloat(p.precoBase).toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>`;
            }
        });

        if (html !== "") { 
            grid.innerHTML = html; 
            container.style.display = "block"; 
        }
    } catch (e) { console.error(e); }
}

loadProduct();