let semuaDataAddon = [];
let filterAktif = 'semua';

// Baca data & tampilkan
async function tampilkanAddon() {
    const wadah = document.getElementById('wadah-addon');
    try {
        const respon = await fetch('data.json');
        semuaDataAddon = await respon.json();
        wadah.innerHTML = '';
        tampilkanDaftar(semuaDataAddon);
        aturFilterKategori();
    } catch (error) {
        wadah.innerHTML = `<div class="pesan-kosong"><i class="fa fa-exclamation-triangle"></i><p>Belum bisa memuat data</p><span>Pastikan file <code>data.json</code> ada & formatnya benar</span></div>`;
    }
}

// Tampilkan daftar kartu
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

        kartu.innerHTML = `
            <div class="gambar-wadah">
                ${tipeFile}
                <button class="tombol-bagi" data-link="${window.location.origin}${window.location.pathname.replace('index.html','')}${linkDetail}" title="Salin Link">
                    <i class="fa fa-link"></i>
                </button>
                <img src="${item['link gambar']}" alt="${item['nama file']}" class="kartu-gambar" loading="lazy" onerror="this.src='https://via.placeholder.com/400x180/5D9C41/ffffff?text=Gambar+Tidak+Ada'">
            </div>
            <div class="kartu-isi">
                <h3>${item['nama file']}</h3>
                <p>${item['description']}</p>
            </div>
        `;

        // Klik kartu masuk detail
        kartu.addEventListener('click', (e) => {
            if (!e.target.closest('.tombol-bagi')) {
                window.location.href = linkDetail;
            }
        });

        // Salin link
        kartu.querySelector('.tombol-bagi').addEventListener('click', (e) => {
            e.stopPropagation();
            salinLink(e.currentTarget.dataset.link);
        });

        wadah.appendChild(kartu);
    });
}

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

document.addEventListener('DOMContentLoaded', tampilkanAddon);
