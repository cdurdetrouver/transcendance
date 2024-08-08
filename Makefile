DOCKER_COMPOSE=docker compose
DOCKER_COMPOSE_FILE=docker-compose.yml

start:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up --build

down:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  start		Start the application in dev mode"
	@echo "  down		Stop the application"

.PHONY: start down help
