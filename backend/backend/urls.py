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
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from user.views import login, register, refresh_token, logout

schema_view = get_schema_view(
	openapi.Info(
		title="API Documentation",
		default_version='v1',
		description="Documentation for the API",
		terms_of_service="https://www.google.com/policies/terms/",
		contact=openapi.Contact(email="gbazart@student.42.fr"),
		license=openapi.License(name="BSD License"),
	),
	public=True,
	permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
	path('admin/', admin.site.urls),
	path('user/', include('user.urls')),
	path('chat/', include('chat.urls')),
	path('pong/', include('pong.urls')),
	path('flappy/', include('flappy.urls')),
	path('login/', login),
	path('logout/', logout),
	path('register/', register),
	path('refresh-token/', refresh_token),
	path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
	path('schema/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
