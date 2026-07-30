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

// Import semua fungsi yang dibutuhkan dari Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";

// Inisialisasi Firebase
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
        // Ambil data dasar dari data.json
        const respon = await fetch('data.json');
        if (!respon.ok) throw new Error("File data.json tidak ditemukan");
        semuaDataAddon = await respon.json();
        
        // Ambil data jumlah unduh DAN jumlah like dari Firebase
        try {
            const unduhRef = ref(db, 'jumlah_unduh');
            const likeRef = ref(db, 'jumlah_like');

            const [snapUnduh, snapLike] = await Promise.all([get(unduhRef), get(likeRef)]);
            
            const dataUnduh = snapUnduh.exists() ? snapUnduh.val() : {};
            const dataLike = snapLike.exists() ? snapLike.val() : {};

            // Gabungkan data dari Firebase ke data utama
            semuaDataAddon.forEach((item, indeks) => {
                item['jumlah unduh'] = dataUnduh[indeks] || item['jumlah unduh'] || 0;
                item['jumlah like'] = dataLike[indeks] || item['jumlah like'] || 0;
            });
        } catch (firebaseErr) {
            console.warn("Data Firebase tidak dimuat, menggunakan nilai awal:", firebaseErr);
        }

        wadah.innerHTML = '';
        tampilkanDaftar(semuaDataAddon);
        aturFilterKategori();
    } catch (error) {
        wadah.innerHTML = `<div class="pesan-kosong"><i class="fa fa-exclamation-triangle"></i><p>Belum bisa memuat data</p><span>Pastikan file <code>data.json</code> ada & formatnya benar</span><br><small>Detail: ${error.message}</small></div>`;
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

        // Cek apakah pengguna sudah pernah like addon ini
        const daftarLike = JSON.parse(localStorage.getItem('sudahLike') || '[]');
        const sudahDiLike = daftarLike.includes(indeks.toString());
        const jumlahLike = item['jumlah like'] || 0;

        kartu.innerHTML = `
            <div class="gambar-wadah">
                ${tipeFile}
                <img src="${item['link gambar']}" alt="${item['nama file']}" class="kartu-gambar" loading="lazy" onerror="this.src='https://via.placeholder.com/400x180/5D9C41/ffffff?text=Gambar+Tidak+Ada'">
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

        // Klik kartu masuk ke halaman detail
        kartu.addEventListener('click', (e) => {
            if (!e.target.closest('.tombol-bagi') && !e.target.closest('.tombol-like')) {
                window.location.href = linkDetail;
            }
        });

        // Fungsi salin link
        kartu.querySelector('.tombol-bagi').addEventListener('click', (e) => {
            e.stopPropagation();
            salinLink(e.currentTarget.dataset.link);
        });

        // Fungsi Like (tersimpan di Firebase + anti spam)
        kartu.querySelector('.tombol-like').addEventListener('click', async (e) => {
            e.stopPropagation();
            const tombol = e.currentTarget;
            const idAddon = tombol.dataset.id;
            const daftarLike = JSON.parse(localStorage.getItem('sudahLike') || '[]');

            if (!daftarLike.includes(idAddon)) {
                try {
                    // Tandai perangkat sudah pernah like
                    daftarLike.push(idAddon);
                    localStorage.setItem('sudahLike', JSON.stringify(daftarLike));

                    // Ambil nilai terbaru dari Firebase
                    const refLike = ref(db, 'jumlah_like/' + idAddon);
                    const snapshot = await get(refLike);
                    const nilaiSekarang = snapshot.exists() ? snapshot.val() : 0;
                    const nilaiBaru = nilaiSekarang + 1;

                    // Simpan nilai baru ke Firebase
                    await set(refLike, nilaiBaru);

                    // Perbarui tampilan
                    semuaDataAddon[idAddon]['jumlah like'] = nilaiBaru;
                    tombol.classList.add('sudah');
                    tombol.querySelector('span').textContent = nilaiBaru;
                } catch (err) {
                    console.error('Gagal menyimpan like:', err);
                    alert('Koneksi kurang stabil, coba lagi nanti');
                }
            }
        });

        wadah.appendChild(kartu);
    });
}

// ==============================================
// FUNGSI LAINNYA
// ==============================================

// Filter Kategori
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

// Pencarian
function cariAddon() {
    terapkanFilterDanCari();
}

// Gabungkan Filter & Pencarian
function terapkanFilterDanCari() {
    const kataKunci = document.getElementById('kotak-cari').value.toLowerCase().trim();
    
    let hasil = semuaDataAddon.filter(item => {
        const cocokKategori = filterAktif === 'semua' || (item.kategori || 'lainnya') === filterAktif;
        const cocokCari = kataKunci === '' 
            || item['nama file'].toLowerCase().includes(kataKunci) 
            || item.description.toLowerCase().includes(kataKunci)
            || (item['type file'] || '').toLowerCase().includes(kataKunci);
        return cocokKategori && cocokCari;
    });

    tampilkanDaftar(hasil);
}

// Salin Link & Notifikasi
function salinLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        const notif = document.getElementById('notif-salin');
        notif.classList.add('tampil');
        setTimeout(() => notif.classList.remove('tampil'), 2500);
    });
}

// Jalankan saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', tampilkanAddon);
