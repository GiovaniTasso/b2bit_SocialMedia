from django.shortcuts import get_object_or_404

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from SocialMedia.models import User, Post
from SocialMedia.serializers import UserSerializer, RegisterSerializer, PostSerializer


# registrar novo usuario
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

class ProfileView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class PostListCreateView(generics.ListCreateAPIView):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]


#da like em um post
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def like_post(request, pk):
    post = get_object_or_404(Post, pk=pk)
    post.likes.add(request.user)
    return Response({'status': 'post liked'})

#follow e unfollow
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def follow_user(request, pk):
    user_to_follow = get_object_or_404(User, pk=pk)
    request.user.following.add(user_to_follow)
    return Response({'status': f'following {user_to_follow.username}'})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def unfollow_user(request, pk):
    user_to_unfollow = get_object_or_404(User, pk=pk)
    request.user.following.remove(user_to_unfollow)
    return Response({'status': f'unfollowed {user_to_unfollow.username}'})

# Feed (posts do usuário)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def feed(request):
    posts = Post.objects.filter(user__in=request.user.following.all()).order_by('-created_at')
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)

# Lista de usuários
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_list(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

# Perfil de usuário específico
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request, pk):
    user = get_object_or_404(User, pk=pk)
    serializer = UserSerializer(user)
    return Response(serializer.data)

# Status de seguir
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def follow_status(request, pk):
    user_to_check = get_object_or_404(User, pk=pk)
    is_following = request.user.following.filter(id=pk).exists()
    return Response({'is_following': is_following})
