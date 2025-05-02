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


#da like ou remover like
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def like_post(request, pk):
    post = get_object_or_404(Post, pk=pk)
    user = request.user

    if post.likes.filter(id=user.id).exists():
        post.likes.remove(user)
        return Response({'status': 'like removed', 'liked': False, 'likes_count': post.likes_count()})
    else:
        post.likes.add(user)
        return Response({'status': 'post liked', 'liked': True, 'likes_count': post.likes_count()})

#follow e unfollow
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def follow_user(request, pk):
    user_to_follow = get_object_or_404(User, pk=pk)

    if request.user.following.filter(pk=pk).exists():
        return Response({'status': f'already following {user_to_follow.username}'}, status=status.HTTP_200_OK)

    request.user.following.add(user_to_follow)
    user_to_follow.followers.add(request.user)

    return Response({
        'status': f'following {user_to_follow.username}',
        'followers_count': user_to_follow.followers_count(),
        'following_count': request.user.following_count()
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def unfollow_user(request, pk):
    user_to_unfollow = get_object_or_404(User, pk=pk)

    if not request.user.following.filter(pk=pk).exists():
        return Response({'status': f'not following {user_to_unfollow.username}'}, status=status.HTTP_400_BAD_REQUEST)

    request.user.following.remove(user_to_unfollow)
    user_to_unfollow.followers.remove(request.user)

    return Response({
        'status': f'unfollowed {user_to_unfollow.username}',
        'followers_count': user_to_unfollow.followers_count(),
        'following_count': request.user.following_count()
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def feed(request):
    from django.db.models import Q
    posts = Post.objects.filter(
        Q(user=request.user) | Q(user__in=request.user.following.all())
    ).order_by('-created_at')
    serializer = PostSerializer(posts, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_list(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request, pk):
    user = get_object_or_404(User, pk=pk)
    serializer = UserSerializer(user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def follow_status(request, pk):
    user_to_check = get_object_or_404(User, pk=pk)
    is_following = request.user.following.filter(id=pk).exists()
    return Response({'is_following': is_following})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_posts(request, pk):
    user = get_object_or_404(User, pk=pk)
    posts = Post.objects.filter(user=user).order_by('-created_at')
    serializer = PostSerializer(posts, many=True, context={'request': request})
    return Response(serializer.data)
