# Transcendance

## Description

Transcendance is a web application built with a Django backend and a vanilla JavaScript frontend. It is designed to be a Single Page Application (SPA) that provides a seamless user experience. The project includes CI/CD pipelines, Docker support, and deployment configurations.

## Technologies

- **Backend**: Django 5.0.8
- **Frontend**: Vanilla JavaScript
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Web Server**: Nginx

## How to run

### Prerequisites

- Docker
- Docker Compose

### Development

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/transcendance.git
    cd transcendance
    ```

2. Start the development environment:
    ```sh
    docker-compose -f docker-compose.yml up --build
    ```

3. Access the application in local:
    - Frontend: [http://localhost:5500/](http://localhost:5500/)
    - Backend: [http://localhost:8000/](http://localhost:8000/)
  
4. Access the application from `dev` branch:
    - Frontend: [http://dev-pong.cdurdetrouver.fr/](http://dev-pong.cdurdetrouver.fr/)
    - Backend: [http://dev-pong.cdurdetrouver.fr:8080/](http://dev-pong.cdurdetrouver.fr:8080/)

### Production

1. Access the application in production:
    - Frontend: [https://pong.cdurdetrouver.fr/](https://pong.cdurdetrouver.fr/)
    - Backend: [http://pong.cdurdetrouver.fr:8000/](http://pong.cdurdetrouver.fr:8000/)

## How to contribute

1. Create a new branch based on the `dev` branch:
    ```sh
    git checkout -b feature/your-feature-name
    ```
2. Make your changes.
3. Commit your changes:
    ```sh
    git commit -m 'Add some feature'
    ```
    Write them with [conventionalcommits](https://www.conventionalcommits.org/en/v1.0.0/)
5. Push to the branch:
    ```sh
    git push origin feature/your-feature-name
    ```
6. Open a pull request to `dev` branch.
7. Wait for the CI pipeline to pass and for the two code reviews.
8. Merge the pull request.
9. Delete the branch.

## Authors
- cdurdetrouver

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
