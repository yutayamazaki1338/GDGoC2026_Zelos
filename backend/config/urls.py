"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
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
from api.views import health, gets_all_posts, my_posts
from api.profile_views import initialize_profile, my_profile



urlpatterns = [
    path("", health),
    path("health", health),
    path("posts", gets_all_posts),
    path("users/me", my_profile),
    path("users/me/initialize", initialize_profile),
    path("users/me/posts", my_posts),
]

