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
import { getDatabase, ref, get, increment, set } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
// ==============================================

async function tampilkanDetail() {
    const wadah = document.getElementById('isi-detail');
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (id === null) {
        wadah.innerHTML = `<div class="pesan-kosong"><i class="fa fa-exclamation-circle"></i><p>Addon tidak ditemukan</p></div>`;
        return;
    }

    try {
        const respon = await fetch('data.json');
        const data = await respon.json();
        const item = data[id];

        if (!item) {
            wadah.innerHTML = `<div class="pesan-kosong"><i class="fa fa-exclamation-circle"></i><p>Data tidak ditemukan</p></div>`;
            return;
        }

        const linkDetail = window.location.href;
        let jumlahUnduh = item['jumlah unduh'] || 0;

        wadah.innerHTML = `
            <div class="kartu-detail">
                <img src="${item['link gambar']}" alt="${item['nama file']}" class="detail-gambar" onerror="this.src='https://via.placeholder.com/700x400/5D9C41/ffffff?text=${encodeURIComponent(item['nama file'])}'">
                <div class="detail-isi">
                    <div class="detail-judul">
                        <div>
                            <span class="tipe-file">${item['type file'] || 'File'}</span>
                            <h2>${item['nama file']}</h2>
                        </div>
                        <!-- Ikon Mata & Jumlah Unduh -->
                        <div class="detail-unduh">
                            <i class="fa fa-eye"></i>
                            <span>${jumlahUnduh} kali diunduh</span>
                        </div>
                    </div>

                    <div class="detail-info">
                        <div class="info-item"><span>Versi MC</span>${item['versi mc'] || 'Tidak diketahui'}</div>
                        <div class="info-item"><span>Ukuran</span>${item['ukuran'] || 'Tidak diketahui'}</div>
                        <div class="info-item"><span>Tanggal Unggah</span>${item['tanggal unggah'] || 'Tidak diketahui'}</div>
                    </div>

                    <div class="detail-deskripsi">${item.description}</div>

                    <div class="tombol-aksi">
                        <a href="${item['link download']}" target="_blank" class="tombol-unduh" data-id="${id}">
                            <i class="fa fa-download"></i> Unduh File
                        </a>
                        <button class="tombol-bagi-detail" onclick="salinLink('${linkDetail}')" title="Salin Link">
                            <i class="fa fa-link"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // === FUNGSI SIMPAN KE FIREBASE SECARA PERMANEN ===
        document.querySelector('.tombol-unduh').addEventListener('click', async () => {
            try {
                // Tambah angka 1 & simpan langsung ke database
                await set(ref(db, `jumlah_unduh/${id}`), increment(1));
                jumlahUnduh++;
                document.querySelector('.detail-unduh span').textContent = `${jumlahUnduh} kali diunduh`;
            } catch (err) {
                console.error('Gagal menyimpan data unduh:', err);
                alert('Berhasil membuka unduhan, tapi data belum tersimpan. Coba lagi nanti ya!');
            }
        });

    } catch (error) {
        wadah.innerHTML = `<div class="pesan-kosong"><i class="fa fa-exclamation-triangle"></i><p>Gagal memuat data</p></div>`;
    }
}

function salinLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        const notif = document.getElementById('notif-salin');
        notif.classList.add('tampil');
        setTimeout(() => notif.classList.remove('tampil'), 2500);
    });
}

document.addEventListener('DOMContentLoaded', tampilkanDetail);
