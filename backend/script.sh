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
  echo "No settings path provided. Using default settings."
  SETTINGS_OPTION=""
else
  SETTINGS_OPTION="--settings=$2"
fi

# Run the Django management commands
python3 manage.py makemigrations $SETTINGS_OPTION
python3 manage.py migrate $SETTINGS_OPTION
python3 manage.py runserver 0.0.0.0:$PORT $SETTINGS_OPTION
