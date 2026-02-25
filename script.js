import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

async function carregarOfertas() {
    const grid = document.getElementById('home-promo-grid');
    try {
        const q = query(collection(db, "promocoes"), limit(8));
        const snap = await getDocs(q);
        grid.innerHTML = "";

        if(snap.empty) {
            grid.innerHTML = "<p>Sem ofertas no momento.</p>";
            return;
        }

        snap.forEach(doc => {
            const p = doc.data();
            let antigoRaw = (p.precoDe || "0").toString().replace(',', '.');
            let novoRaw = (p.precoPor || "0").toString().replace(',', '.');
            const precoA = parseFloat(antigoRaw).toFixed(2).replace('.', ',');
            const precoN = parseFloat(novoRaw).toFixed(2).replace('.', ',');
            
            grid.innerHTML += `
                <div class="promo-card">
                    <div class="promo-img" style="background-image: url('${p.imagem}')">
                        <span class="tag-oferta">OFERTA</span>
                    </div>
                    <div class="p-content">
                        <h3>${p.nome}</h3>
                        <div class="price-container">
                            <span class="old-price">R$ ${precoA}</span>
                            <span class="new-price">R$ ${precoN}</span>
                        </div>
                        <a href="https://wa.me/55919XXXXXXXX?text=Quero aproveitar a oferta: ${p.nome}" class="btn-zap-mini">
                            <i class="fab fa-whatsapp"></i> Garantir
                        </a>
                    </div>
                </div>`;
        });
    } catch (e) { 
        console.error("Erro Firebase:", e);
        grid.innerHTML = "<p>Erro ao carregar ofertas.</p>"; 
    }
}

document.querySelectorAll('.ambiente-card').forEach(card => {
    card.onclick = () => {
        const desc = document.getElementById('ambiente-descricao');
        if (desc) {
            document.getElementById('ambiente-titulo').innerText = card.dataset.titulo;
            document.getElementById('ambiente-texto').innerText = card.dataset.texto;
            desc.style.display = 'block';
            desc.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };
});

const btnMobile = document.getElementById('btn-mobile');
if (btnMobile) {
    btnMobile.onclick = () => document.getElementById('nav').classList.toggle('active');
}

carregarOfertas();