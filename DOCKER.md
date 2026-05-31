# Docker - HabitosTraked

## Requisitos
- Docker Desktop
- Docker Compose v2

## 1) Preparar entorno
1. Copia el entorno Docker para Laravel:
   - Windows PowerShell:
     - `Copy-Item backend/.env.docker.example backend/.env`
2. Si ya tienes un `.env` funcionando y no quieres reemplazarlo, edita solo la seccion de base de datos:
   - `DB_CONNECTION=mysql`
   - `DB_HOST=db`
   - `DB_PORT=3306`
   - `DB_DATABASE=habitos_traked`
   - `DB_USERNAME=laravel`
   - `DB_PASSWORD=laravel`

## 2) Levantar contenedores
Desde la raiz del proyecto:
- `docker compose up -d --build`

Servicios:
- App Laravel (PHP-FPM): `app`
- Nginx: `web`
- MySQL: `db`

Puertos:
- App web: `http://localhost:8080`
- MySQL: `127.0.0.1:3307`

## 3) Inicializar Laravel dentro del contenedor
- `docker compose exec app php artisan key:generate`
- `docker compose exec app php artisan migrate`

Opcional seed:
- `docker compose exec app php artisan db:seed`

## 4) Comandos utiles
- Ver logs: `docker compose logs -f`
- Ejecutar Artisan: `docker compose exec app php artisan`
- Ejecutar Composer: `docker compose exec app composer install`
- Bajar stack: `docker compose down`
- Bajar y limpiar volumen de DB: `docker compose down -v`

## Notas
- El codigo se monta en volumen (`./backend:/var/www`), por eso cualquier cambio local se refleja de inmediato.
- Si cambias extensiones de PHP en el Dockerfile, reconstruye: `docker compose up -d --build`.
