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

# Export the port the app runs on
EXPOSE 8000

# Copy the script to the container
COPY script.sh .
RUN chmod +x script.sh
ENTRYPOINT [ "sh", "script.sh", "8000"]
