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

from django.http import JsonResponse
from django.urls import path

from api.views import health, gets_all_posts, my_posts
from api.profile_views import (
    initialize_profile,
    my_profile,
    update_my_profile,
)
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def my_profile_route(request):
    if request.method == "GET":
        return my_profile(request)

    if request.method == "PATCH":
        return update_my_profile(request)

    response = JsonResponse(
        {"error": "Method not allowed"},
        status=405,
    )
    response["Allow"] = "GET, PATCH"
    return response


urlpatterns = [
    path("", health),
    path("health", health),
    path("posts", gets_all_posts),
    path("users/me", my_profile_route), #上の判別関数に飛んで、通信プロトコルの種類を分別する
    path("users/me/initialize", initialize_profile),
    path("users/me/posts", my_posts),
]

