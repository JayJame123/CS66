#!/usr/bin/env bash
set -e

# ไปยังไดเรกทอรีของโปรเจกต์
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# เพิ่ม PATH สำหรับเครื่องมือและ pm2 ที่ติดตั้งในเครื่อง
export PATH="/home/mio/.npm-global/bin:$SCRIPT_DIR/node_modules/.bin:$PATH"

PORT="${PORT:-3066}"
APP_NAME="cs66"

echo "=========================================="
echo "🚀 Starting CS66 Server (Port: $PORT)"
echo "=========================================="

# ตรวจสอบว่ามีไฟล์ build พร้อมใช้งานหรือไม่ หากไม่มีให้รัน build ก่อน
if [ ! -d "out" ] || [ ! -f "out/index.html" ]; then
  echo "📦 ไม่พบโฟลเดอร์ out/ กำลังรัน npm run build..."
  npm run build
fi

# ตรวจสอบการรันแบบ Foreground หรือ PM2
if [ "$1" == "--dev" ]; then
  echo "💻 รันใน Dev mode..."
  npm run dev
elif [ "$1" == "--foreground" ] || [ "$1" == "-f" ]; then
  echo "🖥️ รันใน Foreground mode (กด Ctrl+C เพื่อหยุด)..."
  PORT="$PORT" node scripts/serve-static.mjs
else
  # ตรวจสอบ pm2
  if command -v pm2 >/dev/null 2>&1; then
    if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
      echo "🔄 รีสตาร์ต service [$APP_NAME] ด้วย PM2..."
      pm2 restart ecosystem.config.cjs
    else
      echo "▶️ เริ่มต้น service [$APP_NAME] ด้วย PM2..."
      pm2 start ecosystem.config.cjs
    fi
    pm2 save >/dev/null 2>&1

    echo ""
    echo "✅ CS66 Server ทำงานเรียบร้อยแล้วในเบื้องหลัง!"
    echo "------------------------------------------"
    echo "🌐 Local URL:  http://127.0.0.1:$PORT"
    echo "🌍 Public URL: https://cs66.miosmooth.com"
    echo "------------------------------------------"
    echo "📋 คำสั่งที่มีประโยชน์:"
    echo "  - ดูบันทึกการทำงาน: pm2 logs $APP_NAME"
    echo "  - ดูสถานะ:        pm2 status"
    echo "  - หยุดเซิร์ฟเวอร์:  pm2 stop $APP_NAME"
    echo "  - รีสตาร์ต:        pm2 restart $APP_NAME"
    echo "=========================================="
  else
    echo "⚠️ ไม่พบคำสั่ง pm2 จะรันในโหมด node ตรง..."
    PORT="$PORT" node scripts/serve-static.mjs
  fi
fi
