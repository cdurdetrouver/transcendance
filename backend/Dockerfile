# create Dockerfile for Django backend
# Use the official Python image
FROM python:3.10.12

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install dependencies
COPY requirements.txt requirements.txt
RUN pip install --upgrade pip setuptools wheel
RUN pip install -r requirements.txt

# Copy project
COPY . .

RUN python3 manage.py makemigrations --settings=backend.settings.settings
RUN python3 manage.py migrate --settings=backend.settings.settings

# Export the port the app runs on
EXPOSE 8000

# Run the application
CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000", "--settings=backend.settings.settings"]
