"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path
from user import views
from chat.views import get_user_chats, invite

urlpatterns = [
    path('', views.user_detail),
    path('chats/', get_user_chats),
    path('invitations/', invite),
    path('<int:user_id>/', views.user_id),
    path('games/<int:user_id>/', views.user_games),
    path('generate-2fa-qr/', views.generate_2fa_qr_code),
    path('enable-2fa/', views.enable_2fa),
    path('verify-2fa/', views.verify_2fa_token),
    path('change_password/', views.change_password),
    path('block/<int:user_id>/', views.block_user),
    path('friend/<int:user_id>/', views.friend_user),
    path('search/', views.search_user),
]
