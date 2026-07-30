// ==============================================
// KONFIGURASI FIREBASE (JANGAN DIUBAH BAGIAN INI)
// ==============================================
const firebaseConfig = {
  apiKey: "AIzaSyD9iPg5KJKlwEiTr7SMjAVTnca9XzGvv2M",
  authDomain: "share-addon.firebaseapp.com",
  databaseURL: "https://share-addon-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "share-addon",
  storageBucket: "share-addon.firebasestorage.app",
  messagingSenderId: "822096958816",
  appId: "1:822096958816:web:3a296039adf1ed861b3a05"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==============================================
// DATA UTAMA
// ==============================================
let semuaDataAddon = [];
let filterAktif = 'semua';

// ==============================================
// MEMUAT DATA AWAL
// ==============================================
async function tampilkanAddon() {
    const wadah = document.getElementById('wadah-addon');
    try {
        const respon = await fetch('data.json');
        if (!respon.ok) throw new Error("File data.json tidak ditemukan");
        semuaDataAddon = await respon.json();
        
        try {
            const unduhRef = ref(db, 'jumlah_unduh');
            const likeRef = ref(db, 'jumlah_like');
            const [snapUnduh, snapLike] = await Promise.all([get(unduhRef), get(likeRef)]);
            const dataUnduh = snapUnduh.exists() ? snapUnduh.val() : {};
            const dataLike = snapLike.exists() ? snapLike.val() : {};

            semuaDataAddon.forEach((item, indeks) => {
                item['jumlah unduh'] = dataUnduh[indeks] || item['jumlah unduh'] || 0;
                item['jumlah like'] = dataLike[indeks] || item['jumlah like'] || 0;
            });
        } catch (firebaseErr) {
            console.warn("Data Firebase tidak dimuat:", firebaseErr);
        }

        document.getElementById('jumlah-total').textContent = semuaDataAddon.length;
        const totalUnduh = semuaDataAddon.reduce((jumlah, item) => jumlah + (item['jumlah unduh'] || 0), 0);
        document.getElementById('jumlah-unduh-total').textContent = totalUnduh;

        wadah.innerHTML = '';
        tampilkanDaftar(semuaDataAddon);
        aturFilterKategori();
    } catch (error) {
        wadah.innerHTML = `<div class="pesan-kosong"><i class="fa fa-exclamation-triangle"></i><p>Belum bisa memuat data</p><span>Pastikan file data.json ada & formatnya benar</span></div>`;
    }
}

// ==============================================
// MENAMPILKAN DAFTAR KARTU
// ==============================================
function tampilkanDaftar(dataYangDitampilkan) {
    const wadah = document.getElementById('wadah-addon');
    wadah.innerHTML = '';

    if (dataYangDitampilkan.length === 0) {
        wadah.innerHTML = `<div class="pesan-hilang"><i class="fa fa-search-minus"></i><p>Addon tidak ditemukan</p></div>`;
        return;
    }

    dataYangDitampilkan.forEach((item, indeks) => {
        const kartu = document.createElement('div');
        kartu.className = 'kartu-addon';
        kartu.dataset.kategori = item.kategori || 'lainnya';

        const tipeFile = item['type file'] ? `<span class="tipe-file">${item['type file']}</span>` : '';
        const linkDetail = `detail.html?id=${indeks}`;
        const daftarLike = JSON.parse(localStorage.getItem('sudahLike') || '[]');
        const sudahDiLike = daftarLike.includes(indeks.toString());
        const jumlahLike = item['jumlah like'] || 0;

        kartu.innerHTML = `
            <div class="gambar-wadah">
                ${tipeFile}
                <img src="${item['link gambar']}" alt="${item['nama file']}" class="kartu-gambar" loading="lazy" onerror="this.src='https://via.placeholder.com/400x180/ff3b30/ffffff?text=Gambar+Tidak+Ada'">
            </div>
            <div class="kartu-isi">
                <h3>${item['nama file']}</h3>
                <div class="garis-pembatas"></div>
                <div class="bagian-aksi">
                    <div class="info-unduh">
                        <i class="fa fa-download"></i>
                        <span>${item['jumlah unduh'] || 0}</span>
                    </div>
                    <div class="grup-tombol-kanan">
                        <button class="tombol-like ${sudahDiLike ? 'sudah' : ''}" data-id="${indeks}" title="Suka">
                            <i class="fa fa-thumbs-up"></i>
                            <span>${jumlahLike}</span>
                        </button>
                        <button class="tombol-bagi" data-link="${window.location.origin}${window.location.pathname.replace('index.html','')}${linkDetail}" title="Salin Link">
                            <i class="fa fa-link"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        kartu.addEventListener('click', (e) => {
            if (!e.target.closest('.tombol-bagi') && !e.target.closest('.tombol-like')) {
                window.location.href = linkDetail;
            }
        });

        kartu.querySelector('.tombol-bagi').addEventListener('click', (e) => {
            e.stopPropagation();
            salinLink(e.currentTarget.dataset.link);
        });

        kartu.querySelector('.tombol-like').addEventListener('click', async (e) => {
            e.stopPropagation();
            const tombol = e.currentTarget;
            const idAddon = tombol.dataset.id;
            const daftarLike = JSON.parse(localStorage.getItem('sudahLike') || '[]');

            if (!daftarLike.includes(idAddon)) {
                try {
                    daftarLike.push(idAddon);
                    localStorage.setItem('sudahLike', JSON.stringify(daftarLike));
                    const refLike = ref(db, 'jumlah_like/' + idAddon);
                    const snapshot = await get(refLike);
                    const nilaiSekarang = snapshot.exists() ? snapshot.val() : 0;
                    const nilaiBaru = nilaiSekarang + 1;
                    await set(refLike, nilaiBaru);
                    semuaDataAddon[idAddon]['jumlah like'] = nilaiBaru;
                    tombol.classList.add('sudah');
                    tombol.querySelector('span').textContent = nilaiBaru;
                } catch (err) {
                    console.error('Gagal simpan like:', err);
                    alert('Koneksi kurang stabil, coba lagi nanti');
                }
            }
        });

        wadah.appendChild(kartu);
    });
}

// ==============================================
// FUNGSI PENCARAN & TOMBOL
// ==============================================
function aturFilterKategori() {
    document.querySelectorAll('.btn-kategori').forEach(tombol => {
        tombol.addEventListener('click', () => {
            document.querySelectorAll('.btn-kategori').forEach(b => b.classList.remove('aktif'));
            tombol.classList.add('aktif');
            filterAktif = tombol.dataset.filter;
            terapkanFilterDanCari();
        });
    });
}

function terapkanFilterDanCari() {
    const elemenCari = document.getElementById('kotak-cari');
    if (!elemenCari) return;

    const kataKunci = elemenCari.value.toLowerCase().trim();
    
    let hasil = semuaDataAddon.filter(item => {
        const nama = (item['nama file'] || '').toLowerCase();
        const deskripsi = (item.description || '').toLowerCase();
        const tipe = (item['type file'] || '').toLowerCase();
        const kategori = (item.kategori || 'lainnya');

        const cocokKategori = filterAktif === 'semua' || kategori === filterAktif;
        const cocokKata = kataKunci === '' 
            || nama.includes(kataKunci) 
            || deskripsi.includes(kataKunci)
            || tipe.includes(kataKunci);

        return cocokKategori && cocokKata;
    });

    tampilkanDaftar(hasil);
}

function salinLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        const notif = document.getElementById('notif-salin');
        notif.classList.add('tampil');
        setTimeout(() => notif.classList.remove('tampil'), 2500);
    });
}

// ==============================================
// JALANKAN SAAT HALAMAN SIAP
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    tampilkanAddon();
    const tombolCari = document.getElementById('tombol-cari');
    const kotakCari = document.getElementById('kotak-cari');

    if (tombolCari) tombolCari.addEventListener('click', terapkanFilterDanCari);
    if (kotakCari) kotakCari.addEventListener('keydown', (e) => { if (e.key === 'Enter') terapkanFilterDanCari(); });
});
