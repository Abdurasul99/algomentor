#!/bin/bash
# Deploy Algorithm Mentor Academy to EC2
# Usage: bash deploy.sh

EC2="ec2-3-15-213-177.us-east-2.compute.amazonaws.com"
KEY="/c/Users/Abdurasul/Desktop/Keypem_Sales/algomentor.pem"
APP_DIR="/var/www/algomentor"
DB_PATH="/var/www/algomentor/prisma/dev.db"

echo "=== Building locally ==="
export DATABASE_URL="file:./prisma/dev.db"
npm run build || { echo "Build failed!"; exit 1; }

echo "=== Packaging (excluding DB to preserve server data) ==="
tar --exclude='./node_modules' \
    --exclude='./.next' \
    --exclude='./.git' \
    --exclude='./middleware.ts.bak' \
    --exclude='./prisma/dev.db' \
    --exclude='./prisma/prisma' \
    --exclude='./dev.db' \
    -czf /tmp/algomentor.tar.gz .
echo "Archive: $(du -sh /tmp/algomentor.tar.gz | cut -f1)"

echo "=== Uploading ==="
scp -i "$KEY" -o StrictHostKeyChecking=no /tmp/algomentor.tar.gz ubuntu@$EC2:$APP_DIR/

echo "=== Deploying on EC2 ==="
ssh -i "$KEY" -o StrictHostKeyChecking=no ubuntu@$EC2 "
  set -e
  cd $APP_DIR

  # Backup DB before extracting
  cp $DB_PATH ${DB_PATH}.bak 2>/dev/null || true

  tar -xzf algomentor.tar.gz
  rm algomentor.tar.gz

  # Restore DB (tar excluded it, but just in case)
  [ -f ${DB_PATH}.bak ] && [ ! -s $DB_PATH ] && cp ${DB_PATH}.bak $DB_PATH

  # Always enforce absolute DATABASE_URL (never let deploy overwrite it)
  grep -v '^DATABASE_URL' $APP_DIR/.env > /tmp/env_deploy
  echo 'DATABASE_URL="file:/var/www/algomentor/prisma/dev.db"' >> /tmp/env_deploy
  cp /tmp/env_deploy $APP_DIR/.env

  npm install --production=false 2>&1 | tail -3

  DATABASE_URL='file:$DB_PATH' npx prisma generate 2>&1 | tail -2
  DATABASE_URL='file:$DB_PATH' npx prisma migrate deploy 2>&1 | tail -3

  # Always fix DB permissions after deploy (tar can reset ownership)
  sudo chown -R ubuntu:ubuntu $APP_DIR/
  chmod 664 $DB_PATH
  chmod 775 $APP_DIR/prisma/

  pm2 restart algomentor --update-env
  sleep 2
  pm2 status | grep algomentor
  echo '=== Deploy complete! ==='
"

echo ""
echo "Live at: http://$EC2"
