from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    followers = models.ManyToManyField('self', symmetrical=False, related_name='followed_by')
    following = models.ManyToManyField('self', symmetrical=False, related_name='follows')

    def followers_count(self):
        return self.followers.count()

    def following_count(self):
        return self.following.count()

class Post(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name='liked_posts')

    def likes_count(self):
        return self.likes.count()

    def __str__(self):
        return f"{self.user.username}: {self.content[:20]}"
