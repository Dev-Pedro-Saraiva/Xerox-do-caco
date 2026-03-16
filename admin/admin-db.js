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
let editCatId = null; 

// --- AUTH ---
onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "../login.html";
    else {
        renderProducts();
        loadCategories();
        carregarDadosEmpresa();
    }
});

document.getElementById('btn-logout').onclick = () => signOut(auth);

// --- LÓGICA DE BOTÕES DINÂMICOS ---
document.getElementById('btn-add-img-field').onclick = () => {
    const div = document.createElement('div');
    div.className = 'dynamic-field-group';
    div.innerHTML = `<input type="text" class="prod-img-input" placeholder="URL da Imagem"><button type="button" class="btn-remove-field" onclick="this.parentElement.remove()">✕</button>`;
    document.getElementById('prod-imgs-container').appendChild(div);
};

document.getElementById('btn-add-variation').onclick = () => {
    const div = document.createElement('div');
    div.className = 'dynamic-field-group variation-item';
    div.innerHTML = `<input type="text" class="var-name" placeholder="Ex: G" style="flex:2"><input type="number" step="0.01" class="var-price" placeholder="R$" style="flex:1"><button type="button" class="btn-remove-field" onclick="this.parentElement.remove()">✕</button>`;
    document.getElementById('prod-variations-container').appendChild(div);
};

document.getElementById('btn-add-finish').onclick = () => {
    const div = document.createElement('div');
    div.className = 'dynamic-field-group finish-item';
    div.innerHTML = `<input type="text" class="finish-name" placeholder="Ex: Brilhoso" style="flex:2"><input type="number" step="0.01" class="finish-price" placeholder="+ R$" style="flex:1"><button type="button" class="btn-remove-field" onclick="this.parentElement.remove()">✕</button>`;
    document.getElementById('prod-finishes-container').appendChild(div);
};

// --- CATEGORIAS ---
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
                    <button class="btn-edit" onclick="window.prepararEdicaoCat('${c.id}', '${c.nome}', '', ${c.ordem})">✏️</button>
                    <button onclick="window.deletarCat('${c.id}')" style="border:none; background:none; cursor:pointer;">🗑️</button>
                </div>
            </div>`;

        const subs = categorias.filter(s => s.parentID === c.nome);
        const subDiv = catDiv.querySelector('.sub-container');
        subs.forEach(s => {
            subDiv.innerHTML += `<label class="checkbox-label"><input type="checkbox" name="prod-subs" value="${s.nome}"> ${s.nome}</label>`;
            listAdmin.innerHTML += `
                <div class="cat-item-admin" style="margin-left:20px;">
                    <span>└ ${s.nome}</span>
                    <div>
                        <button class="btn-edit" onclick="window.prepararEdicaoCat('${s.id}', '${s.nome}', '${c.nome}', ${s.ordem})">✏️</button>
                        <button onclick="window.deletarCat('${s.id}')" style="border:none; background:none; cursor:pointer;">🗑️</button>
                    </div>
                </div>`;
        });
    });
}

window.toggleSubView = (id, show) => {
    const el = document.getElementById('subs-of-' + id);
    if(el) el.style.display = show ? 'block' : 'none';
};

// Salvar/Adicionar Categoria
document.getElementById('btn-add-category').onclick = async () => {
    const nome = document.getElementById('new-category-name').value;
    const parent = document.getElementById('parent-category-select').value;
    const ordem = parseInt(document.getElementById('new-category-order').value) || 0;

    if(!nome) return alert("Digite o nome da categoria");

    const dados = { nome, parentID: parent, ordem };

    try {
        if(editCatId) {
            await updateDoc(doc(db, "categorias", editCatId), dados);
            alert("Categoria atualizada!");
        } else {
            await addDoc(collection(db, "categorias"), dados);
            alert("Categoria adicionada!");
        }
        location.reload();
    } catch (e) { alert("Erro ao salvar: " + e); }
};

window.prepararEdicaoCat = (id, nome, parent, ordem) => {
    editCatId = id;
    document.getElementById('new-category-name').value = nome;
    document.getElementById('parent-category-select').value = parent;
    document.getElementById('new-category-order').value = ordem;
    // Muda o texto do botão para indicar edição
    document.getElementById('btn-add-category').innerText = "Atualizar Categoria";
    window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
};

window.deletarCat = async (id) => { if(confirm("Excluir categoria?")) { await deleteDoc(doc(db, "categorias", id)); loadCategories(); } };

// --- PRODUTOS ---
async function renderProducts() {
    const grid = document.getElementById('admin-product-grid');
    const snap = await getDocs(query(collection(db, "produtos"), orderBy("ordem", "asc")));
    grid.innerHTML = "";
    snap.forEach(d => {
        const p = d.data();
        grid.innerHTML += `
        <div class="item-row-admin">
            <img src="${p.imagem}">
            <div class="info"><h4>${p.nome}</h4><small>R$ ${p.precoBase}</small></div>
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
        document.getElementById('btn-cancel-edit').style.display = "block";

        document.querySelectorAll('input[name="prod-cats"], input[name="prod-subs"]').forEach(el => el.checked = false);
        document.querySelectorAll('.sub-container').forEach(el => el.style.display = 'none');

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

        const contImgs = document.getElementById('prod-imgs-container');
        contImgs.innerHTML = "";
        (p.imagens || [p.imagem]).forEach((url, i) => {
            contImgs.innerHTML += `<div class="dynamic-field-group"><input type="text" class="prod-img-input" value="${url}">${i>0?'<button type="button" class="btn-remove-field" onclick="this.parentElement.remove()">✕</button>':''}</div>`;
        });

        const contVars = document.getElementById('prod-variations-container');
        contVars.innerHTML = "";
        (p.variacoes || []).forEach(v => {
            contVars.innerHTML += `<div class="dynamic-field-group variation-item"><input type="text" class="var-name" value="${v.nome}"><input type="number" step="0.01" class="var-price" value="${v.preco}"><button type="button" class="btn-remove-field" onclick="this.parentElement.remove()">✕</button></div>`;
        });

        const contFin = document.getElementById('prod-finishes-container');
        contFin.innerHTML = "";
        (p.acabamentos || []).forEach(a => {
            contFin.innerHTML += `<div class="dynamic-field-group finish-item"><input type="text" class="finish-name" value="${a.nome}"><input type="number" step="0.01" class="finish-price" value="${a.adicional}"><button type="button" class="btn-remove-field" onclick="this.parentElement.remove()">✕</button></div>`;
        });

        window.scrollTo({top: 0, behavior: 'smooth'});
    }
};

document.getElementById('product-form').onsubmit = async (e) => {
    e.preventDefault();
    const cats = Array.from(document.querySelectorAll('input[name="prod-cats"]:checked')).map(cb => cb.value);
    const subs = Array.from(document.querySelectorAll('input[name="prod-subs"]:checked')).map(cb => cb.value);
    const imgs = Array.from(document.querySelectorAll('.prod-img-input')).map(i => i.value).filter(v => v);
    const vars = Array.from(document.querySelectorAll('.variation-item')).map(div => ({ nome: div.querySelector('.var-name').value, preco: div.querySelector('.var-price').value || null }));
    const fins = Array.from(document.querySelectorAll('.finish-item')).map(div => ({ nome: div.querySelector('.finish-name').value, adicional: div.querySelector('.finish-price').value || 0 }));

    const dados = {
        nome: document.getElementById('prod-name').value,
        categorias: cats,
        subcategorias: subs,
        precoBase: document.getElementById('prod-price').value,
        ordem: parseInt(document.getElementById('prod-order').value),
        imagens: imgs,
        imagem: imgs[0] || "",
        variacoes: vars,
        acabamentos: fins,
        descricao: document.getElementById('prod-desc').value
    };

    if (editProdId) await updateDoc(doc(db, "produtos", editProdId), dados);
    else await addDoc(collection(db, "produtos"), dados);
    
    alert("Salvo!");
    location.reload();
};

window.deletarProd = async (id) => { if(confirm("Excluir?")) { await deleteDoc(doc(db, "produtos", id)); renderProducts(); } };
document.getElementById('btn-cancel-edit').onclick = () => location.reload();

// --- EMPRESA ---
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
