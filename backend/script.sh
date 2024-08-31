#!/bin/sh

# Check if a port parameter is provided
if [ -z "$1" ]; then
  echo "No port provided. Using default port 8000."
  PORT=8000
else
  PORT=$1
fi

# Check if a settings path parameter is provided
if [ -z "$2" ]; then
  echo "No settings path provided. Using default settings path 'backend.settings.settings'."
  SETTINGS_PATH="backend.settings.settings"
else
  SETTINGS_PATH=$2
fi

# Run the Django management commands
python3 manage.py makemigrations --settings=$SETTINGS_PATH
python3 manage.py migrate --settings=$SETTINGS_PATH
python3 manage.py runserver 0.0.0.0:$PORT --settings=$SETTINGS_PATH
