#!/bin/sh
set -e

APP_DIR="/var/www"

if [ ! -f "$APP_DIR/composer.json" ] && [ -f "$APP_DIR/backend/composer.json" ]; then
  APP_DIR="$APP_DIR/backend"
fi

cd "$APP_DIR"

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

if [ -f composer.json ] && [ ! -d vendor ]; then
  composer install --no-interaction --prefer-dist
fi

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

exec "$@"
