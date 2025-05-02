from django.urls import path
from .views import RegisterView, ProfileView, PostListCreateView, PostDetailView, like_post, follow_user, unfollow_user, feed, user_list, user_profile, follow_status, user_posts

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/<int:pk>/', user_profile, name='user-profile'),
    path('posts/', PostListCreateView.as_view(), name='posts'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('posts/<int:pk>/like/', like_post, name='like-post'),
    path('users/', user_list, name='user-list'),
    path('users/<int:pk>/follow/', follow_user, name='follow-user'),
    path('users/<int:pk>/unfollow/', unfollow_user, name='unfollow-user'),
    path('users/<int:pk>/follow-status/', follow_status, name='follow-status'),
    path('users/<int:pk>/posts/', user_posts, name='user-posts'),
    path('feed/', feed, name='feed'),
]
