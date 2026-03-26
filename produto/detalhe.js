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
let acabamentosSelecionados = [];

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
    if (!produtoId) { window.location.href = '../produtos/index.html'; return; }

    try {
        const docRef = doc(db, "produtos", produtoId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            renderDetail(snap.data(), snap.id);
            loadRelatedProducts(snap.data(), snap.id);
        } else {
            window.location.href = '../produtos/index.html';
        }
    } catch (e) { console.error("Erro:", e); }
}

function renderDetail(p, id) {
    const nomeLimpo = p.nome.toLowerCase().replace(/[^a-z0-9]/g, '-');
    window.history.replaceState({}, '', `${window.location.pathname}?id=${id}&produto=${nomeLimpo}`);
    document.title = `Xerox do Caco | ${p.nome}`;

    // --- NOVO: LÓGICA DO BOTÃO INSTAGRAM ---
    const instaContainer = document.getElementById('insta-container');
    if (instaContainer) {
        instaContainer.innerHTML = ""; 
        if (p.linkInsta && p.linkInsta.trim() !== "") {
            instaContainer.innerHTML = `
                <a href="${p.linkInsta}" target="_blank" class="btn-insta-destaque">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M3 16V8C3 5.23858 5.23858 3 8 3H16C18.7614 3 21 5.23858 21 8V16C21 18.7614 18.7614 21 16 21H8C5.23858 21 3 18.7614 3 16Z" stroke="currentColor" stroke-width="2"/>
                        <path d="M17.5 6.51L17.51 6.49889" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Veja no Instagram
                </a>
            `;
        }
    }

    document.getElementById('detalhe-nome').innerText = p.nome;
    document.getElementById('detalhe-desc').style.whiteSpace = "pre-line";
    document.getElementById('detalhe-desc').innerText = p.descricao || 'Qualidade garantida.';
    
    imgPrincipal.src = p.imagem;

    // --- LÓGICA DE VARIAÇÕES ---
    const containerVars = document.getElementById('detalhe-variacoes');
    containerVars.innerHTML = p.variacoes?.length > 0 ? "<h4>Opções:</h4>" : "";
    
    if (p.variacoes && p.variacoes.length > 0) {
        p.variacoes.forEach((v, index) => {
            const btn = document.createElement('button');
            btn.className = `var-btn-detalhe ${index === 0 ? 'active' : ''}`;
            btn.innerText = v.nome;
            if(index === 0) variacaoSelecionada = v;
            btn.onclick = () => {
                document.querySelectorAll('.var-btn-detalhe').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                variacaoSelecionada = v;
                recalcularPrecoTotal(p);
            };
            containerVars.appendChild(btn);
        });
    }

    // --- LÓGICA DE ACABAMENTOS ---
    const containerFinishes = document.getElementById('detalhe-acabamentos');
    containerFinishes.innerHTML = p.acabamentos?.length > 0 ? "<h4>Acabamentos:</h4>" : "";

    if (p.acabamentos && p.acabamentos.length > 0) {
        p.acabamentos.forEach((a) => {
            const btn = document.createElement('button');
            btn.className = 'finish-btn-detalhe';
            const precoTexto = parseFloat(a.adicional) > 0 ? ` +R$${parseFloat(a.adicional).toFixed(2)}` : "";
            btn.innerText = `${a.nome}${precoTexto}`;
            
            btn.onclick = () => {
                btn.classList.toggle('active');
                if(btn.classList.contains('active')) {
                    acabamentosSelecionados.push(a);
                } else {
                    acabamentosSelecionados = acabamentosSelecionados.filter(item => item.nome !== a.nome);
                }
                recalcularPrecoTotal(p);
            };
            containerFinishes.appendChild(btn);
        });
    }

    recalcularPrecoTotal(p);

    // Thumbs e Galeria
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

    // Controles de Quantidade
    document.getElementById('qty-plus').onclick = () => { qtyInput.value = parseInt(qtyInput.value) + 1; };
    document.getElementById('qty-minus').onclick = () => { if(parseInt(qtyInput.value) > 1) qtyInput.value = parseInt(qtyInput.value) - 1; };

    // --- BOTÃO ADICIONAR AO PEDIDO ---
    document.getElementById('btn-add-detalhe').onclick = () => {
        let cart = JSON.parse(localStorage.getItem('ferroforte_cart')) || [];
        const qtd = parseInt(qtyInput.value);
        
        let precoBaseItem = variacaoSelecionada?.preco ? parseFloat(variacaoSelecionada.preco) : parseFloat(p.precoBase || 0);
        let adicionalAcabamentos = acabamentosSelecionados.reduce((acc, curr) => acc + parseFloat(curr.adicional || 0), 0);
        const precoFinalUnitario = precoBaseItem + adicionalAcabamentos;

        let extras = acabamentosSelecionados.map(a => a.nome).join(' + ');
        let nomeNoCarrinho = p.nome;
        if(variacaoSelecionada) nomeNoCarrinho += ` (${variacaoSelecionada.nome})`;
        if(extras) nomeNoCarrinho += ` + ${extras}`;

        const idUnico = `${id}-${variacaoSelecionada?.nome || 'base'}-${extras.replace(/\s+/g, '')}`;

        const idx = cart.findIndex(i => i.id === idUnico);
        if(idx > -1) { 
            cart[idx].qty += qtd; 
            cart[idx].subtotal = cart[idx].qty * precoFinalUnitario; 
        } else { 
            cart.push({ 
                id: idUnico, 
                nome: nomeNoCarrinho, 
                preco: precoFinalUnitario, 
                qty: qtd, 
                subtotal: precoFinalUnitario * qtd,
                imagem: p.imagem 
            }); 
        }
        
        localStorage.setItem('ferroforte_cart', JSON.stringify(cart));
        showToast("✓ Adicionado ao seu pedido!");
        setTimeout(() => { window.location.href = '../produtos/index.html'; }, 1000);
    };

    loading.style.display = 'none';
    content.style.display = 'grid';

    qtyInput.onchange = () => {
        let val = parseInt(qtyInput.value);
        if (isNaN(val) || val < 1) qtyInput.value = 1;
        else qtyInput.value = val;
    };

    qtyInput.onclick = () => { qtyInput.select(); };
}

function recalcularPrecoTotal(p) {
    let precoBase = variacaoSelecionada?.preco ? parseFloat(variacaoSelecionada.preco) : parseFloat(p.precoBase || 0);
    let adicional = acabamentosSelecionados.reduce((acc, curr) => acc + parseFloat(curr.adicional || 0), 0);
    const total = precoBase + adicional;
    document.getElementById('detalhe-preco').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

async function loadRelatedProducts(currentProduct, currentId) {
    const grid = document.getElementById('related-grid');
    const container = document.getElementById('related-container');
    
    const termo = (currentProduct.subcategorias && currentProduct.subcategorias.length > 0) 
                  ? currentProduct.subcategorias[0] 
                  : (currentProduct.categorias && currentProduct.categorias.length > 0) 
                  ? currentProduct.categorias[0] 
                  : null;

    if (!termo) return;

    try {
        const campoFiltro = currentProduct.subcategorias?.length > 0 ? "subcategorias" : "categorias";
        const q = query(collection(db, "produtos"), where(campoFiltro, "array-contains", termo), limit(5));
        const snap = await getDocs(q);
        
        let html = "";
        snap.forEach(docSnap => {
            const p = docSnap.data();
            if (docSnap.id !== currentId) {
                html += `
                <div class="promo-card" onclick="window.location.href='?id=${docSnap.id}'" style="cursor:pointer">
                    <div class="promo-img" style="background-image: url('${p.imagem}')"></div>
                    <div class="p-content">
                        <h3>${p.nome}</h3>
                        <span class="new-price">R$ ${parseFloat(p.precoBase || 0).toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>`;
            }
        });

        if (html !== "") { 
            grid.innerHTML = html; 
            container.style.display = "block"; 
        }
    } catch (e) { 
        console.error("Erro ao carregar relacionados:", e); 
    }
}

loadProduct();
