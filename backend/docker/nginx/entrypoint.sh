#!/bin/sh
# set -e: Salir inmediatamente si un comando falla.
# set -x: Imprimir cada comando en el log antes de ejecutarlo.
set -ex

echo "--- Creando directorios necesarios ---"
mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache public
chmod -R 775 storage bootstrap/cache
find public -type d -exec chmod 755 {} \;
find public -type f -exec chmod 644 {} \;

echo "--- Ejecutando migraciones de base de datos ---"
php artisan migrate --force

echo "--- Creando enlace simbólico de storage ---"
php artisan storage:link || true

echo "--- Publicando assets de Filament y Livewire ---"
php artisan filament:assets || true
php artisan livewire:publish --assets || true

echo "--- Compilando assets frontend con Vite ---"
npm run build || true

echo "--- Ajustando permisos del directorio public tras compilación ---"
chown -R www-data:www-data public
find public -type d -exec chmod 755 {} \;
find public -type f -exec chmod 644 {} \;

echo "--- Limpiando y optimizando caché ---"
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "--- Re-ajustando permisos post-cache ---"
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

echo "--- Iniciando PHP-FPM en modo daemon ---"
php-fpm -D

echo "--- Verificando la configuración de Nginx ---"
nginx -t

echo "--- Iniciando Nginx en primer plano ---"
# Usamos comillas simples para evitar cualquier problema de interpretación
nginx -g 'daemon off;'