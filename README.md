# Website Trireka Presisi

Website jasa desain 3D untuk manufaktur, lengkap dengan **panel admin** untuk mengubah semua isi tanpa menyentuh kode.

- Dibuat dengan **PHP 8 tanpa database**, jadi bisa dipasang di hosting murah biasa (cPanel, Hostinger, Niagahoster, Rumahweb, DomaiNesia, dan sejenisnya).
- Isi website, akun admin, dan pesan masuk disimpan sebagai file di folder `data/`. Gambar yang diunggah disimpan di `uploads/`.
- Kontak WhatsApp/HP awal: **0877-6972-5965** (bisa diubah di admin).

## Isi panel admin (`/admin`)

| Menu | Yang bisa diubah |
| --- | --- |
| Umum & Kontak | Nama website, deskripsi Google, logo pengganti, no. HP/WhatsApp, pesan awal WhatsApp, email, lokasi, teks menu, teks kaki halaman |
| Bagian Utama | Judul besar, paragraf, tombol, poin singkat, kotak keterangan gambar |
| Software & Format | Daftar software dan format file |
| Layanan | Tambah/hapus/urutkan layanan beserta spesifikasinya |
| Portofolio | Tambah proyek, unggah foto/render, kategori filter |
| Alur Kerja, Klien | Langkah kerja dan jenis klien |
| Animasi Simulasi | Teks tab FEM, Motion, Assembly |
| Formulir Penawaran | Judul, pilihan layanan, batas lampiran, pesan sukses |
| Pesan Masuk | Semua permintaan penawaran (RFQ) dari website, unduh lampiran, balas via WhatsApp, tandai status |
| Galeri Gambar | Semua gambar yang pernah diunggah |
| Akun & Cadangan | Ganti kata sandi, unduh/pulihkan cadangan isi |

Setiap bagian bisa disembunyikan dengan centang "Tampilkan bagian ini". Klik **Simpan perubahan** (atau Ctrl+S) dan website langsung berubah.

## Cara memasang di hosting (cPanel / hPanel)

1. **Unduh kode**: di GitHub buka repo ini → tombol hijau **Code** → **Download ZIP**.
2. **Masuk ke File Manager** hosting, buka folder `public_html` (atau folder domain Anda).
3. **Unggah ZIP**, lalu klik kanan → **Extract**. Pindahkan semua isi folder hasil ekstrak (`index.php`, `admin`, `assets`, dll.) langsung ke `public_html`. Pastikan file tersembunyi `.htaccess` dan `.user.ini` ikut terpindah (aktifkan "Show hidden files").
4. Pastikan versi **PHP 8.0 atau lebih baru** (menu *Select PHP Version* / *PHP Configuration*).
5. Pastikan folder `data` dan `uploads` bisa ditulis (izin **755**; jika gagal menyimpan, coba **775**).
6. **Segera buka `https://domain-anda.com/admin`** dan buat akun admin (nama pengguna + kata sandi minimal 8 karakter). Halaman pembuatan akun hanya muncul sekali, yaitu saat belum ada akun, jadi lakukan langsung setelah mengunggah.
7. Selesai. Ubah isi website dari panel admin.

### Alternatif: deploy otomatis dari GitHub

Banyak hosting (cPanel *Git Version Control*, Hostinger *Git*) bisa menarik kode langsung dari repo ini. Isi yang diubah lewat admin **tidak ikut tertimpa** saat kode diperbarui, karena folder `data/` dan `uploads/` tidak disimpan di Git.

## Masuk ke panel admin

- Alamat: `https://domain-anda.com/admin`
- Lupa kata sandi: hapus file `data/admin.php` lewat File Manager, lalu buka `/admin` lagi untuk membuat akun baru. Isi website tidak hilang.
- Setelah 5 kali salah kata sandi, login dikunci 15 menit.

## Formulir permintaan penawaran

- Kiriman masuk ke menu **Pesan Masuk** di admin, beserta lampirannya.
- Setelah mengirim, pengunjung juga ditawari tombol **Lanjut di WhatsApp** dengan ringkasan permintaan, jadi Anda tetap dapat notifikasi di WA.
- Opsional: isi "Kirim notifikasi RFQ ke email" di menu Umum & Kontak untuk mendapat email setiap ada kiriman baru (bergantung fitur email hosting).
- Batas lampiran default 25 MB. Jika hosting membatasi lebih kecil, naikkan `upload_max_filesize` dan `post_max_size` di menu PHP hosting.

## Cadangan

Unduh cadangan isi secara berkala di **Akun & Cadangan**. Untuk cadangan lengkap (termasuk gambar dan pesan masuk), unduh folder `data/` dan `uploads/` dari File Manager.

## Mencoba di komputer sendiri

```bash
php -S localhost:8000
```

Lalu buka `http://localhost:8000` dan `http://localhost:8000/admin`.

## Struktur

```
index.php          halaman website (dibentuk dari isi di data/content.json)
rfq.php            penerima formulir penawaran
admin/             panel admin (index.php, api.php, admin.js, admin.css)
assets/            CSS, JavaScript animasi, logo, favicon
inc/               fungsi inti dan isi awal (defaults.php)
data/              isi website, akun, pesan masuk  (tidak masuk Git)
uploads/           gambar yang diunggah dari admin  (tidak masuk Git)
```

Untuk server Nginx (tanpa `.htaccess`), tolak akses ke `/data/` dan `/inc/` di konfigurasi server. File sensitif di `data/` sudah dilindungi sehingga tetap tidak terbaca walau dibuka langsung.
