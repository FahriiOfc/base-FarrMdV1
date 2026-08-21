```markdown
# FarrMdV1 - WhatsApp Bot

> WhatsApp Bot berbasis Baileys dengan arsitektur ESM modular, dynamic command loader, dan interactive message support.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](#prerequisites)
[![ESM](https://img.shields.io/badge/ESM-module-informational)](#instalasi-pc-windowslinuxmac)

---

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Prerequisites](#-prerequisites)
- [Instalasi PC (Windows/Linux/Mac)](#-instalasi-pc-windowslinuxmac)
- [Instalasi HP (Termux)](#-instalasi-hp-termux)
- [Konfigurasi](#-konfigurasi)
- [Menjalankan Bot](#-menjalankan-bot)
- [Dengan PM2 (Rekomendasi)](#-dengan-pm2-rekomendasi)
- [Troubleshooting](#-troubleshooting)
- [Daftar Command](#-daftar-command)
- [Struktur Folder](#-struktur-folder)
- [Lisensi](#-lisensi)

---

## ✨ Fitur

| Kategori | Fitur |
|----------|-------|
| **⚙️ Main** | Menu interaktif, ping, runtime, owner contact |
| **👑 Owner** | Public/self mode, autoread, autotyping, autovn, edit/delete file, restart, shutdown, log viewer, file explorer |
| **👥 Group** | Tag all, hidetag, open/close, promote/demote, kick/add, link/revoke, mute/unmute, set/del pp, pin/unpin |
| **🖼️ Converter** | Sticker (image/video), to image, to video, to MP3, to voice note |
| **📥 Downloader** | YouTube MP3/MP4, TikTok, Instagram, Facebook, GitHub |
| **🛠️ Tools** | Brat sticker generator, screenshot website |
| **📂 Dynamic** | Add/edit/delete/list command, view source code, restore backup |

---

## 📦 Prerequisites

| Komponen | Minimal Versi | Keterangan |
|----------|---------------|------------|
| Node.js | v20.0.0 atau lebih baru | Wajib |
| npm | v9.0.0 atau lebih baru | Wajib |
| FFmpeg | v4.0.0 atau lebih baru | Wajib untuk sticker & converter |
| Git | (opsional) | Untuk clone repository |
| PM2 | (opsional) | Untuk production |

---

## 💻 Instalasi PC (Windows/Linux/Mac)

### 1. Install Node.js

**Windows:**
- Download dari [nodejs.org](https://nodejs.org/)
- Pilih versi LTS
- Install seperti biasa

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs npm
```

Mac:

```bash
brew install node
```

2. Install FFmpeg

Windows:

· Download dari ffmpeg.org
· Extract ke C:\ffmpeg
· Tambahkan C:\ffmpeg\bin ke PATH (Environment Variables)

Linux:

```bash
sudo apt-get install ffmpeg -y
```

Mac:

```bash
brew install ffmpeg
```

3. Clone & Install Bot

```bash
# Clone repository
git clone https://github.com/USERNAME/FarrMdV1.git
cd FarrMdV1

# Install dependencies
npm install

# Buat folder yang diperlukan
mkdir -p auth database temp backup logs
```

---

📱 Instalasi HP (Termux)

1. Install Termux

Download Termux dari:

· F-Droid (Rekomendasi)
· Atau Google Play Store

2. Setup Termux

```bash
# Update packages
pkg update && pkg upgrade -y

# Install dependencies
pkg install -y nodejs-lts ffmpeg git nano

# Cek versi
node --version
ffmpeg -version
```

3. Clone & Install Bot

```bash
# Clone repository
git clone https://github.com/USERNAME/FarrMdV1.git
cd FarrMdV1

# Install dependencies
npm install

# Buat folder yang diperlukan
mkdir -p auth database temp backup logs
```

---

⚙️ Konfigurasi

Edit config.js

```javascript
export default {
    // =========================================
    // BOT INFORMATION
    // =========================================
    
    ownerNumber: '628xxxxxxxxxx',    // Ganti dengan nomor owner
    ownerName: 'Owner',              // Nama owner
    botName: 'FarrMdV1',             // Nama bot
    
    // =========================================
    // PREFIX
    // =========================================
    
    prefix: ['.', '!', '#'],         // Awalan command
    
    // =========================================
    // API KEYS
    // =========================================
    
    lolhumanApiKey: 'YOUR_API_KEY'   // Dapatkan di lolhuman.xyz
};
```

---

🚀 Menjalankan Bot

Tanpa PM2 (Testing)

```bash
npm start
```

Dengan PM2 (Rekomendasi untuk Production)

```bash
# Install PM2 global
npm install -g pm2

# Jalankan bot dengan PM2
pm2 start index.js --name FarrMdV1

# Simpan agar auto-start saat reboot
pm2 save
pm2 startup

# Lihat status
pm2 list
pm2 logs FarrMdV1

# Restart
pm2 restart FarrMdV1

# Stop
pm2 stop FarrMdV1
```

Untuk Banyak Bot (Clone)

```bash
# Buat folder clone
cp -r FarrMdV1 FarrMdV1-biasa
cd FarrMdV1-biasa

# Ganti config ownerNumber (jika beda owner)

# Jalankan dengan nama berbeda
pm2 start index.js --name FarrMdV1-biasa
```

---

🔧 Troubleshooting

Masalah Solusi
Error: require is not defined Project ESM, jangan pakai require(). Gunakan import
Error: Private field '#xxx' must be declared Pastikan private method ada di dalam class
QR Code tidak muncul Hapus folder auth/, lalu npm start lagi
Pairing Code tidak bisa input Jalankan di terminal biasa (bukan PM2) untuk pertama kali
Sticker/brat error "Format file tidak dikenali" Install FFmpeg dan Sharp: npm install sharp
Mute tidak menghapus pesan Update handler.js bagian mute check
Restart tidak berfungsi di clone Ganti nama PM2 process, atau gunakan ID
Button/list tidak muncul di grup WhatsApp batasi interactive list hanya di chat pribadi
PM2 log tidak muncul di logcmd Pastikan nama process sesuai: pm2 list

---

📋 Daftar Command

Main Commands

Command Alias Fungsi
.menu help, ? Menu utama interaktif
.allmenu all Semua command
.mainmenu - Menu main
.ping p Cek latency
.runtime uptime Waktu aktif bot
.owner - Kontak owner

Owner Commands

Command Alias Fungsi
.ownermenu - Menu owner
.public - Mode public
.self - Mode self (owner only)
.autoread - Auto read
.autotyping autotype Auto typing
.autovn - Auto voice note
.del - Hapus pesan
.blgrup blacklistgrup, blgc Blacklist grup
.unblgrup unblacklistgrup, unblgc Hapus blacklist grup
.listblgrup listblacklistgrup, listblgc Lihat blacklist grup
.bluser blacklistuser Blacklist user
.unbluser unblacklistuser Hapus blacklist user
.listbluser listblacklistuser Lihat blacklist user
.setppbot - Set foto profil bot
.delppbot - Hapus foto profil bot
.getpp - Ambil foto profil user
.getcmd - Lihat source code
.addcmd add Tambah file
.editcmd edit, ed Edit file + auto backup
.restorecmd restore, undo Restore dari backup
.delcmd del Hapus file
.listcmd ls, dir File explorer
.logcmd logs, log Lihat log terminal
.restart reboot, pm2restart Restart bot via PM2
.shutdown stop, die, killbot Matikan bot
.debug dbg Debug identity

Group Commands

Command Alias Fungsi
.groupmenu grupmenu Menu grup
.tagall - Tag semua member
.hidetag ht, h Hidetag
.open - Buka grup
.close - Tutup grup
.promote - Jadikan admin
.demote - Turunkan admin
.kick - Keluarkan member
.add - Tambah member
.linkgc gclink Link grup
.revoke - Reset link
.mute - Mute user
.unmute - Unmute user
.listmute mutelist Daftar mute
.setpp - Set PP grup
.delpp - Hapus PP grup
.getppgc - Ambil PP grup
.pin - Pin pesan
.unpin - Unpin pesan

Converter Commands

Command Alias Fungsi
.stickermenu convertmenu Menu sticker
.sticker s Buat sticker
.toimg - Sticker → Gambar
.tovideo - Sticker → Video
.tomp3 - Video → MP3
.tovn - Audio → Voice Note

Downloader Commands

Command Alias Fungsi
.downloadmenu - Menu downloader
.ytmp3 - YouTube MP3
.ytmp4 - YouTube MP4
.tiktok tt TikTok
.ig instagram Instagram
.fb facebook Facebook
.github - GitHub

Tools Commands

Command Alias Fungsi
.toolsmenu toolmenu, tm Menu tools
.brat bs, qc Brat sticker
.ssweb ss, screenshot Screenshot website

---

📁 Struktur Folder

```
FarrMdV1/
├── index.js              # Entry point
├── package.json          # Dependencies
├── config.js             # Konfigurasi
├── auth/                 # Session WhatsApp
├── backup/               # Backup file
├── database/             # Database JSON
│   ├── settings.json
│   ├── blacklist_grup.json
│   ├── blacklist_user.json
│   └── mute.json
├── command/
│   ├── main/             # Command utama
│   ├── owner/            # Command owner
│   ├── group/            # Command grup
│   ├── converter/        # Converter
│   ├── downloader/       # Downloader
│   └── tools/            # Tools
├── lib/
│   ├── handler.js        # Message handler
│   ├── connection.js     # Koneksi WhatsApp
│   ├── commandLoader.js  # Dynamic command loader
│   ├── permissions.js    # Permission system
│   ├── identity.js       # Identity resolver
│   ├── serializer.js     # Message serializer
│   ├── settings.js       # Settings manager
│   ├── database.js       # Database helper
│   ├── media.js          # Media processing
│   └── downloader.js     # Downloader helper
├── logs/                 # Log file (optional)
└── temp/                 # Temporary files
```

---

📝 Lisensi

MIT © FarrMdV1

---

🙏 Kontribusi

Pull request dan issue selalu diterima. Untuk perubahan besar, buka issue terlebih dahulu untuk diskusi.

---

Dibuat dengan ❤️ menggunakan @chaeulso/baileys

```