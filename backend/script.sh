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

touch /var/log/cron.log
printenv | grep -Ev 'BASHOPTS|BASH_VERSINFO|EUID|PPID|SHELLOPTS|UID|LANG|PWD|GPG_KEY|_=' >> /etc/environment

# Run the Django management commands
python3 manage.py makemigrations $SETTINGS_OPTION
python3 manage.py migrate $SETTINGS_OPTION
python3 manage.py crontab remove $SETTINGS_OPTION
python3 manage.py crontab add $SETTINGS_OPTION
service cron start
python3 manage.py runserver 0.0.0.0:$PORT $SETTINGS_OPTION
