
FROM php:8.4-fpm

# 1. INSTALAR DEPENDENCIAS (Incluyendo Nginx e ICU para intl)
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    curl \
    nginx \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libgmp-dev \
    libicu-dev \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libwebp-dev \
    && rm -rf /var/lib/apt/lists/* \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip gmp intl

# 2. INSTALAR NODE.JS (Versión 20) + NPM
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && node --version \
    && npm --version

# 3. INSTALAR COMPOSER
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 4. CONFIGURAR NGINX Y PHP
RUN rm -f /etc/nginx/sites-enabled/default
COPY docker/nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /usr/local/etc/php/conf.d/
COPY docker/uploads.ini /usr/local/etc/php/conf.d/uploads.ini

# Configurar PHP-FPM para que escuche en el puerto local
RUN sed -i 's|listen = .*|listen = 127.0.0.1:9000|' /usr/local/etc/php-fpm.d/www.conf

# 5. DIRECTORIO DE TRABAJO
WORKDIR /var/www

# 6. INSTALAR DEPENDENCIAS PHP
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --ignore-platform-reqs

# 7. INSTALAR DEPENDENCIAS JS (Para compilar con Vite en el deploy)
COPY package*.json ./
RUN npm install

# 8. COPIAR LA APLICACIÓN COMPLETA
COPY . .

# 9. PERMISOS INICIALES
RUN mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache
RUN chown -R www-data:www-data storage bootstrap/cache public
RUN chmod -R 775 storage bootstrap/cache
RUN chmod -R 755 public

# 10. CONFIGURAR EL ENTRYPOINT DE ARRANQUE
EXPOSE 80
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]