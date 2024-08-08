DOCKER_COMPOSE=docker compose
DOCKER_COMPOSE_FILE=docker-compose.yml

start:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up --build

down:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down

.PHONY: start down
