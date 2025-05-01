from rest_framework import serializers, permissions, generics
from rest_framework.exceptions import PermissionDenied

from SocialMedia.models import User, Post


class UserSerializer(serializers.ModelSerializer):
    followers_count = serializers.IntegerField()
    following_count = serializers.IntegerField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'followers_count', 'following_count']

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class PostSerializer(serializers.ModelSerializer):
    likes_count = serializers.IntegerField(read_only=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    username = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'user', 'username', 'content', 'created_at', 'likes_count']

    def get_username(self, obj):
        return obj.user.username


class PostRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        if self.get_object().user != self.request.user:
            raise PermissionDenied("Você não tem permissão para editar este post.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user != self.request.user:
            raise PermissionDenied("Você não tem permissão para deletar este post.")
        instance.delete()
