import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, query, orderBy, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCNYVaYrjUZKWYP-yV8AU2awmzcp7M7IoA",
    authDomain: "penielmatconst.firebaseapp.com",
    projectId: "penielmatconst",
    storageBucket: "penielmatconst.firebasestorage.app",
    messagingSenderId: "769088435817",
    appId: "1:769088435817:web:5496b08f49aae3756d94f8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let editProdId = null;

// --- INICIALIZAÇÃO E AUTH ---
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../login.html";
    } else {
        renderProducts();
        loadCategories();
        renderPromos();
        carregarDadosEmpresa();
    }
});

document.getElementById('btn-logout').onclick = () => signOut(auth);

// --- CATEGORIAS (LOAD E ACTIONS) ---
async function loadCategories() {
    const containerCats = document.getElementById('prod-categories-container');
    const listAdmin = document.getElementById('list-categories-admin');
    const parentSelect = document.getElementById('parent-category-select');
    
    const snap = await getDocs(query(collection(db, "categorias"), orderBy("ordem", "asc")));
    const categorias = [];
    snap.forEach(d => categorias.push({ id: d.id, ...d.data() }));

    containerCats.innerHTML = "";
    listAdmin.innerHTML = "";
    parentSelect.innerHTML = '<option value="">-- Criar como Principal --</option>';

    const principais = categorias.filter(c => !c.parentID);

    principais.forEach(c => {
        parentSelect.innerHTML += `<option value="${c.nome}">${c.nome}</option>`;
        
        const catDiv = document.createElement('div');
        catDiv.innerHTML = `
            <label class="checkbox-label" style="font-weight:bold; color:#27ae60">
                <input type="checkbox" name="prod-cats" value="${c.nome}" onchange="window.toggleSubView('${c.nome.replace(/\s+/g, '')}', this.checked)"> ${c.nome}
            </label>
            <div id="subs-of-${c.nome.replace(/\s+/g, '')}" class="sub-container" style="display:none; padding-left:20px;"></div>
        `;
        containerCats.appendChild(catDiv);

        listAdmin.innerHTML += `
            <div class="cat-item-admin">
                <span><b>${c.nome}</b></span>
                <div>
                    <button class="btn-edit" onclick="window.editarCat('${c.id}', '${c.nome}', ${c.ordem})">✏️</button>
                    <button onclick="window.deletarCat('${c.id}')" style="border:none; cursor:pointer; background:none;">✕</button>
                </div>
            </div>`;

        const subs = categorias.filter(s => s.parentID === c.nome);
        const subDiv = catDiv.querySelector('.sub-container');
        subs.forEach(s => {
            subDiv.innerHTML += `<label class="checkbox-label" style="display:block;"><input type="checkbox" name="prod-subs" value="${s.nome}"> ${s.nome}</label>`;
            listAdmin.innerHTML += `
                <div class="cat-item-admin sub-item-admin">
                    <span>└─ ${s.nome}</span>
                    <div>
                        <button class="btn-edit" onclick="window.editarCat('${s.id}', '${s.nome}', ${s.ordem})">✏️</button>
                        <button onclick="window.deletarCat('${s.id}')" style="border:none; cursor:pointer; background:none;">✕</button>
                    </div>
                </div>`;
        });
    });
}

// --- SALVAR NOVA CATEGORIA ---
document.getElementById('btn-add-category').onclick = async () => {
    const nome = document.getElementById('new-category-name').value;
    const parent = document.getElementById('parent-category-select').value;
    const ordem = parseInt(document.getElementById('new-category-order').value) || 0;
    const subInputs = document.querySelectorAll('.new-sub-input');

    if (!nome) return alert("Digite o nome da categoria");

    try {
        // Salva a categoria principal ou a sub selecionada no select
        await addDoc(collection(db, "categorias"), {
            nome: nome,
            parentID: parent || null,
            ordem: ordem
        });

        // Salva as subcategorias escritas nos campos dinâmicos (se houver)
        for (let input of subInputs) {
            if (input.value.trim() !== "") {
                await addDoc(collection(db, "categorias"), {
                    nome: input.value.trim(),
                    parentID: nome,
                    ordem: 0
                });
            }
        }

        alert("Categorias salvas!");
        location.reload();
    } catch (e) {
        console.error(e);
        alert("Erro ao salvar");
    }
};

window.toggleSubView = (id, show) => {
    const el = document.getElementById('subs-of-' + id);
    if(el) el.style.display = show ? 'block' : 'none';
};

window.deletarCat = async (id) => {
    if (confirm("Excluir esta categoria?")) {
        await deleteDoc(doc(db, "categorias", id));
        loadCategories();
    }
};

window.editarCat = async (id, nome, ordem) => {
    const novoNome = prompt("Nome da categoria:", nome);
    const novaOrdem = prompt("Ordem de exibição:", ordem);
    if (novoNome) {
        await updateDoc(doc(db, "categorias", id), { nome: novoNome, ordem: parseInt(novaOrdem) });
        loadCategories();
    }
};

// --- PRODUTOS ---
async function renderProducts() {
    const grid = document.getElementById('admin-product-grid');
    const snap = await getDocs(query(collection(db, "produtos"), orderBy("ordem", "asc")));
    grid.innerHTML = "";
    snap.forEach(d => {
        const p = d.data();
        grid.innerHTML += `
        <div class="item-row-admin">
            <img src="${p.imagem}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
            <div class="info">
                <h4>${p.nome}</h4>
                <small>Preço: R$ ${p.precoBase}</small>
            </div>
            <div>
                <button class="btn-edit" onclick="window.prepararEdicao('${d.id}')">✏️</button>
                <button onclick="window.deletarProd('${d.id}')" style="border:none; background:none; cursor:pointer;">🗑️</button>
            </div>
        </div>`;
    });
}

window.prepararEdicao = async (id) => {
    const d = await getDoc(doc(db, "produtos", id));
    if (d.exists()) {
        const p = d.data();
        editProdId = id;
        
        document.getElementById('prod-name').value = p.nome;
        document.getElementById('prod-price').value = p.precoBase;
        document.getElementById('prod-order').value = p.ordem;
        document.getElementById('prod-desc').value = p.descricao || "";
        document.getElementById('form-title').innerText = "✏️ Editando Produto";
        document.getElementById('btn-submit-prod').innerText = "Atualizar Produto";
        document.getElementById('btn-cancel-edit').style.display = "block";

        document.querySelectorAll('input[name="prod-cats"], input[name="prod-subs"]').forEach(cb => cb.checked = false);
        document.querySelectorAll('.sub-container').forEach(div => div.style.display = 'none');

        if (p.categorias) {
            p.categorias.forEach(catNome => {
                const cb = document.querySelector(`input[name="prod-cats"][value="${catNome}"]`);
                if (cb) {
                    cb.checked = true;
                    window.toggleSubView(catNome.replace(/\s+/g, ''), true);
                }
            });
        }

        if (p.subcategorias) {
            p.subcategorias.forEach(subNome => {
                const cb = document.querySelector(`input[name="prod-subs"][value="${subNome}"]`);
                if (cb) cb.checked = true;
            });
        }

        const containerImgs = document.getElementById('prod-imgs-container');
        containerImgs.innerHTML = "";
        const listaImgs = p.imagens && p.imagens.length > 0 ? p.imagens : [p.imagem];
        listaImgs.forEach((url, index) => {
            const div = document.createElement('div');
            div.className = 'dynamic-field-group';
            div.innerHTML = `<input type="text" class="prod-img-input" value="${url || ''}">${index > 0 ? '<button type="button" class="btn-remove-field" onclick="this.parentElement.remove()">✕</button>' : ''}`;
            containerImgs.appendChild(div);
        });

        const containerVars = document.getElementById('prod-variations-container');
        containerVars.innerHTML = "";
        if(p.variacoes) {
            p.variacoes.forEach(v => {
                const div = document.createElement('div');
                div.className = 'dynamic-field-group variation-item';
                div.innerHTML = `
                    <input type="text" class="var-name" value="${v.nome}" placeholder="Nome">
                    <input type="number" step="0.01" class="var-price" value="${v.preco || ''}" placeholder="Preço">
                    <button type="button" class="btn-remove-field" onclick="this.parentElement.remove()">✕</button>
                `;
                containerVars.appendChild(div);
            });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.deletarProd = async (id) => { 
    if(confirm("Excluir produto?")) { 
        await deleteDoc(doc(db, "produtos", id)); 
        renderProducts(); 
    } 
};

// --- CAMPOS DINÂMICOS (CORREÇÃO DE IDS) ---
const btnAddImg = document.getElementById('btn-add-img-field');
if(btnAddImg) {
    btnAddImg.onclick = () => {
        const div = document.createElement('div');
        div.className = 'dynamic-field-group';
        div.innerHTML = `<input type="text" class="prod-img-input" placeholder="URL da Imagem"><button type="button" class="btn-remove-field" onclick="this.parentElement.remove()">✕</button>`;
        document.getElementById('prod-imgs-container').appendChild(div);
    };
}

const btnAddVar = document.getElementById('btn-add-variation');
if(btnAddVar) {
    btnAddVar.onclick = () => {
        const div = document.createElement('div');
        div.className = 'dynamic-field-group variation-item';
        div.innerHTML = `<input type="text" class="var-name" placeholder="Nome"><input type="number" step="0.01" class="var-price" placeholder="Preço"><button type="button" class="btn-remove-field" onclick="this.parentElement.remove()">✕</button>`;
        document.getElementById('prod-variations-container').appendChild(div);
    };
}

const btnAddSubInput = document.getElementById('btn-add-sub-input');
if(btnAddSubInput) {
    btnAddSubInput.onclick = () => {
        const div = document.createElement('div');
        div.className = 'dynamic-field-group';
        div.innerHTML = `<input type="text" class="new-sub-input" placeholder="Nome da Subcategoria"><button type="button" class="btn-remove-field" onclick="this.parentElement.remove()">✕</button>`;
        document.getElementById('bulk-subs-container').appendChild(div);
    };
}

// --- SUBMISSÃO ---
document.getElementById('product-form').onsubmit = async (e) => {
    e.preventDefault();
    const cats = Array.from(document.querySelectorAll('input[name="prod-cats"]:checked')).map(cb => cb.value);
    const subs = Array.from(document.querySelectorAll('input[name="prod-subs"]:checked')).map(cb => cb.value);
    const imgs = Array.from(document.querySelectorAll('.prod-img-input')).map(i => i.value).filter(v => v);
    const vars = Array.from(document.querySelectorAll('.variation-item')).map(div => ({
        nome: div.querySelector('.var-name').value,
        preco: div.querySelector('.var-price').value || null
    })).filter(v => v.nome.trim() !== "");

    const dados = {
        nome: document.getElementById('prod-name').value,
        categorias: cats,
        subcategorias: subs,
        precoBase: document.getElementById('prod-price').value,
        ordem: parseInt(document.getElementById('prod-order').value),
        imagens: imgs,
        imagem: imgs[0] || "",
        variacoes: vars,
        descricao: document.getElementById('prod-desc').value
    };

    if (editProdId) {
        await updateDoc(doc(db, "produtos", editProdId), dados);
        alert("Produto Atualizado!");
    } else {
        await addDoc(collection(db, "produtos"), dados);
        alert("Produto Salvo!");
    }
    location.reload();
};

document.getElementById('btn-cancel-edit').onclick = () => location.reload();

// --- PROMOS E EMPRESA ---
document.getElementById('promo-form').onsubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "promocoes"), {
        nome: document.getElementById('promo-name').value,
        precoDe: document.getElementById('promo-old-price').value,
        precoPor: document.getElementById('promo-new-price').value,
        imagem: document.getElementById('promo-img-url').value
    });
    alert("Promoção salva!");
    renderPromos();
};

async function renderPromos() {
    const list = document.getElementById('list-promos-admin');
    const snap = await getDocs(collection(db, "promocoes"));
    list.innerHTML = "";
    snap.forEach(d => {
        list.innerHTML += `<div class="item-row-admin"><span>${d.data().nome}</span><button onclick="window.deletarPromo('${d.id}')" style="background:none; border:none; cursor:pointer;">🗑️</button></div>`;
    });
}
window.deletarPromo = async (id) => { await deleteDoc(doc(db, "promocoes", id)); renderPromos(); };

document.getElementById('empresa-form').onsubmit = async (e) => {
    e.preventDefault();
    await setDoc(doc(db, "configuracao", "perfil"), {
        fotoFachada: document.getElementById('emp-foto').value,
        sobre: document.getElementById('emp-sobre').value,
        whatsapp: document.getElementById('emp-zap').value,
        mapa: document.getElementById('emp-mapa').value 
    });
    alert("Perfil Atualizado!");
};

async function carregarDadosEmpresa() {
    const d = await getDoc(doc(db, "configuracao", "perfil"));
    if (d.exists()) {
        const e = d.data();
        document.getElementById('emp-foto').value = e.fotoFachada || "";
        document.getElementById('emp-sobre').value = e.sobre || "";
        document.getElementById('emp-zap').value = e.whatsapp || "";
        document.getElementById('emp-mapa').value = e.mapa || "";
    }
}