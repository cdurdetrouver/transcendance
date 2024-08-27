python3 manage.py makemigrations --settings=backend.settings.settings
python3 manage.py migrate --settings=backend.settings.settings
python3 manage.py runserver 0.0.0.0:8000 --settings=backend.settings.settings