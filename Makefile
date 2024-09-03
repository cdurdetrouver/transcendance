DOCKER_COMPOSE=docker compose
DOCKER_COMPOSE_FILE=docker-compose.yml

all: build start

build:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) build

start: build
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up

down:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down

rm:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down -v --rmi all --remove-orphans

test-backend: build
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) exec backend python3 manage.py makemigrations --settings=backend.settings.settings
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) exec backend python3 manage.py migrate --settings=backend.settings.settings
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) exec backend python3 manage.py test --settings=backend.settings.settings
clear-db: build
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) exec db rm -rf /var/lib/postgresql/data/*
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down


help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  all			Build and start the application"
	@echo "  build			Build the application"
	@echo "  start			Start the application in dev mode"
	@echo "  down			Stop the application"
	@echo "  rm			Stop the application and remove volumes and images"
	@echo "  test-backend		Run backend tests"
	@echo "  clear-db			Clear the data from the db"

.PHONY: build start down rm test-backend help
