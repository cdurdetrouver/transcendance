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
RUN python -m spacy download en_core_web_sm
RUN python -m spacy download fr_core_news_sm

# Install cron
RUN apt-get update
RUN apt-get install -y cron

# Copy project
COPY . .

# Export the port the app runs on
EXPOSE 8000

# Copy the script to the container
COPY script.sh .
RUN chmod +x script.sh
ENTRYPOINT [ "sh", "script.sh"]
CMD [ "./manage.py", "runserver", "0.0.0.0:8000"]
