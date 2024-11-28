from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from user.models import User

mail_users = []

def check_inactive_users():
    # Get all users who have not logged in for 90 days
    inactive_users = User.objects.filter(last_login__lte=timezone.now() - timedelta(days=90))
    
    # Remove users from mail_users who are no longer inactive
    mail_users[:] = [user for user in mail_users if user in inactive_users]

    for user in inactive_users:
        if user not in mail_users:
            send_mail(
                "Account Inactivity",
                "Hello, you have not logged in for 90 days. Please login to keep your account active.",
                "gbazart@student.42.fr",
                [user.email],
                fail_silently=False,
            )
            mail_users.append(user)

    # Get all users who have not logged in for 3 years
    delete_users = User.objects.filter(last_login__lte=timezone.now() - timedelta(days=3*365))
    for user in delete_users:
        user.delete()