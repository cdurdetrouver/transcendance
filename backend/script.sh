#!/bin/sh

# Run the Django management commands
python3 manage.py makemigrations $1
python3 manage.py migrate $1
python3 manage.py crontab add $1
