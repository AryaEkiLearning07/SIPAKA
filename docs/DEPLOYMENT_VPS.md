# Panduan Deployment Server VPS (Uji Coba & Staging SIPAKA)

Dokumen ini memuat prosedur resmi pemindahan, instalasi, dan pengujian platform SIPAKA pada server Virtual Private Server (VPS) berbasis Linux (Ubuntu 22.04 / 24.04 LTS).

---

## 1. Spesifikasi Server VPS yang Direkomendasikan

| Komponen | Spesifikasi Minimum (Uji Coba) | Spesifikasi Optimal (Crawling Massal & Parsing PDF) |
| :--- | :--- | :--- |
| **CPU** | 2 vCPU | 4 vCPU |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 40 GB SSD / NVMe | 100 GB NVMe (penyimpanan PDF Lembaran Negara) |
| **OS** | Ubuntu 22.04 LTS / 24.04 LTS | Ubuntu 24.04 LTS x86_64 |
| **Bandwidth** | 1 Gbps Shared Port | Unmetered 1 Gbps |

---

## 2. Persiapan Awal di Server VPS

Setelah login via SSH ke server:

```bash
# 1. Update paket sistem
sudo apt update && sudo apt upgrade -y

# 2. Pasang perkakas dasar, Git, Curl, dan Python3
sudo apt install -y git curl wget build-essential python3 python3-pip python3-venv tmux ufw

# 3. Pasang Node.js 20.x & pnpm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm@10.5.2 pm2

# 4. Pasang Docker & Docker Compose (Opsional jika menggunakan container)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

---

## 3. Klon Repositori & Konfigurasi Environment

```bash
# Kloning repositori ke direktori /var/www atau home
cd /var/www
git clone <URL_REPO_ANDA> sipaka
cd sipaka

# Buat berkas .env dari template
cp .env.example .env
nano .env
```

Contoh konfigurasi `.env` di VPS:
```ini
# Database MariaDB Lokal di VPS
DATABASE_URL="mysql://root:password_vps_anda@localhost:3306/lexvera_db"

# API Server
PORT=4000
HOST=127.0.0.1
DEMO_FALLBACK="false"
CORS_ORIGIN="https://sipaka.domainanda.com"

# Web Client Next.js
NEXT_PUBLIC_API_URL="https://sipaka.domainanda.com/api"
```

---

## 4. Instalasi Dependensi & Inisialisasi Database

```bash
# 1. Pasang seluruh dependensi monorepo
pnpm install

# 2. Generate Prisma Client
pnpm --filter @sipaka/database db:generate

# 3. Sinkronkan skema tabel ke database MariaDB
pnpm --filter @sipaka/database db:push

# 4. Ingest data awal peraturan perundang-undangan (UU ITE, KUHP Baru, UU PDP, dsb.)
pnpm --filter @sipaka/database db:seed

# 5. Ekstrak jaring relasi yuridis antar-undang-undang
cd packages/database/scripts
python3 extract_relations.py
cd ../../../
```

---

## 5. Menjalankan Aplikasi via PM2 (Mode Native Cepat)

PM2 memastikan aplikasi Next.js dan Fastify API menyala terus-menerus dan otomatis restart jika server reboot.

```bash
# 1. Build seluruh monorepo
pnpm build

# 2. Buat berkas ekosistem PM2: ecosystem.config.cjs
cat << 'EOF' > ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'sipaka-api',
      script: 'node',
      args: 'apps/api/dist/index.js',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        HOST: '127.0.0.1'
      }
    },
    {
      name: 'sipaka-web',
      script: 'node',
      args: 'apps/web/node_modules/next/dist/bin/next start apps/web --port 3000',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
EOF

# 3. Jalankan aplikasi
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 6. Konfigurasi Reverse Proxy Nginx & SSL HTTPS

Pasang Nginx untuk mengarahkan domain publik ke aplikasi Next.js (port 3000) dan Fastify API (port 4000):

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo nano /etc/nginx/sites-available/sipaka
```

Konfigurasi file `/etc/nginx/sites-available/sipaka`:
```nginx
server {
    server_name sipaka.domainanda.com;

    # Client Web (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Backend (Fastify)
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifkan konfigurasi dan terapkan sertifikat SSL gratis Let's Encrypt:
```bash
sudo ln -s /etc/nginx/sites-available/sipaka /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Pasang SSL Otomatis
sudo certbot --nginx -d sipaka.domainanda.com
```

---

## 7. Strategi Menjalankan Crawler Massal di VPS

Menjalankan crawler di VPS adalah keputusan yang tepat karena:
1. **Koneksi Stabil & Cepat**: Bandwidth data center (1 Gbps) mempercepat pengunduhan ribuan PDF Lembaran Negara.
2. **Eksekusi Background Tanpa Terputus**: Proses tidak terganggu oleh sleep mode laptop, internet rumah putus, atau restart mesin kerja.
3. **Pemberian Jeda Aman (*Ethical Rate Limiting*)**: Menghindari pemblokiran IP oleh server negara.

### Menjalankan Worker Crawler di Sesi `tmux`:
```bash
# Buka sesi terisolasi tmux
tmux new -s crawler

# Pindah ke folder scraper
cd /var/www/sipaka/packages/database/scripts

# Siapkan virtual environment python & dependensi
python3 -m venv venv
source venv/bin/activate
pip install requests beautifulsoup4 pdfplumber pypdf

# Jalankan crawler pengayaan metadata JDIH BPK
python3 scrape_details.py --batch-size 100 --delay 1.5

# Untuk keluar dari sesi tmux tanpa mematikan proses crawler:
# Tekan: Ctrl+B lalu tekan D

# Untuk masuk kembali memantau progres crawler:
tmux attach -t crawler
```

### Rekomendasi Batch Crawling:
- **Batch 1 (50 UU Pokok Prioritas)**: KUHP Baru (UU 1/2023), Cipta Kerja (UU 6/2023), UU PDP (UU 27/2022), UU Tipikor, UU Kepailitan, UU Hak Cipta, UU Perlindungan Konsumen, UU Narkotika.
- **Batch 2 (200 UU Sektoral)**: Perbankan, Pajak/KUP, Pertambangan/Minerba, Agraria/UUPA.
- **Batch 3 (Seluruh Peraturan Pemerintah & Perpres Terkait)**.
