.PHONY: up down build smoke populate logs

up:
	docker compose up -d --build

down:
	docker compose down -v --remove-orphans

build:
	docker compose build

smoke:
	pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/integration-smoke.ps1

populate:
	pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/populate-data.ps1

logs:
	docker compose logs -f --tail=100
