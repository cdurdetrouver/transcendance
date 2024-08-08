DOCKER_COMPOSE=docker compose
DOCKER_COMPOSE_FILE=docker-compose.yml

start:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up --build

down:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down

build-docs:
	cd backend && python3 manage.py spectacular --file ../backend/schema.yml

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  start		Start the application in dev mode"
	@echo "  down		Stop the application"
	@echo "  build-docs	Build the OpenAPI schema"

.PHONY: start down help
