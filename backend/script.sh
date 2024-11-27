#!/bin/sh

echo "Running Django setup tasks..."

# Run migrations
python3 manage.py makemigrations --noinput
python3 manage.py migrate --noinput


# Check if the arguments are for running cron
if [ "$1" = "cron" ] && [ "$2" = "-f" ]; then
    echo "Adding crontab jobs..."
    touch /var/log/cron.log
    printenv | grep -Ev 'BASHOPTS|BASH_VERSINFO|EUID|PPID|SHELLOPTS|UID|LANG|PWD|GPG_KEY|_=' >> /etc/environment

    python manage.py crontab remove
    python3 manage.py crontab add
    echo "Running cron service..."
fi

# Execute the passed command
exec "$@"
