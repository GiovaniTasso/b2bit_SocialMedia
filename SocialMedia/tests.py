from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import User, Post


class RegisterViewTests(APITestCase):
    def test_register_user(self):

        url = reverse('register')
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpassword123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, 'testuser')

    def test_register_user_invalid_data(self):

        url = reverse('register')
        data = {'username': 'testuser'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        User.objects.create_user(username='existinguser', email='existing@example.com', password='password123')
        data = {
            'username': 'existinguser',
            'email': 'new@example.com',
            'password': 'password123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class ProfileViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_own_profile(self):

        url = reverse('profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')

    def test_get_user_profile(self):

        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='otherpassword123'
        )
        url = reverse('user-profile', args=[other_user.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'otheruser')
        self.assertEqual(response.data['email'], 'other@example.com')

    def test_profile_unauthenticated(self):

        self.client.logout()
        url = reverse('profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class PostTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.post = Post.objects.create(
            user=self.user,
            content='Test post content'
        )

    def test_create_post(self):

        url = reverse('posts')
        data = {'content': 'New test post content'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.filter(content='New test post content').count(), 1)

    def test_get_posts(self):

        url = reverse('posts')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        if isinstance(response.data, dict) and 'results' in response.data:
            posts = response.data['results']
        else:
            posts = response.data

        found = False
        for post in posts:
            if post['content'] == 'Test post content':
                found = True
                break
        self.assertTrue(found, "Test post not found in the response")

    def test_get_post_detail(self):

        url = reverse('post-detail', args=[self.post.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content'], 'Test post content')

    def test_update_post(self):

        url = reverse('post-detail', args=[self.post.id])
        data = {'content': 'Updated content'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.post.refresh_from_db()
        self.assertEqual(self.post.content, 'Updated content')

    def test_delete_post(self):

        url = reverse('post-detail', args=[self.post.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Post.objects.count(), 0)

    def test_update_others_post(self):

        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='otherpassword123'
        )
        other_post = Post.objects.create(
            user=other_user,
            content='Other user post'
        )

        url = reverse('post-detail', args=[other_post.id])
        data = {'content': 'Trying to update'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        other_post.refresh_from_db()
        self.assertEqual(other_post.content, 'Trying to update')

    def test_like_post(self):

        url = reverse('like-post', args=[self.post.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['liked'])
        self.assertEqual(response.data['likes_count'], 1)

        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['liked'])
        self.assertEqual(response.data['likes_count'], 0)

class FollowTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='password123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='password123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user1)

    def test_follow_user(self):

        url = reverse('follow-user', args=[self.user2.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(self.user1.following.filter(id=self.user2.id).exists())
        self.assertTrue(self.user2.followers.filter(id=self.user1.id).exists())

    def test_unfollow_user(self):

        self.user1.following.add(self.user2)
        self.user2.followers.add(self.user1)

        url = reverse('unfollow-user', args=[self.user2.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(self.user1.following.filter(id=self.user2.id).exists())
        self.assertFalse(self.user2.followers.filter(id=self.user1.id).exists())

    def test_follow_status(self):

        url = reverse('follow-status', args=[self.user2.id])

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_following'])

        self.user1.following.add(self.user2)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_following'])

class FeedTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='password123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='password123'
        )
        self.user3 = User.objects.create_user(
            username='user3',
            email='user3@example.com',
            password='password123'
        )

        self.user1.following.add(self.user2)

        self.post1 = Post.objects.create(user=self.user1, content='User1 post')
        self.post2 = Post.objects.create(user=self.user2, content='User2 post')
        self.post3 = Post.objects.create(user=self.user3, content='User3 post')

        self.client = APIClient()
        self.client.force_authenticate(user=self.user1)

    def test_feed(self):

        url = reverse('feed')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(len(response.data), 2)
        post_contents = [post['content'] for post in response.data]
        self.assertIn('User1 post', post_contents)
        self.assertIn('User2 post', post_contents)
        self.assertNotIn('User3 post', post_contents)

class UserPostsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        Post.objects.create(user=self.user, content='Post 1')
        Post.objects.create(user=self.user, content='Post 2')
        Post.objects.create(user=self.user, content='Post 3')

    def test_get_user_posts(self):

        url = reverse('user-posts', args=[self.user.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

        post_contents = [post['content'] for post in response.data]
        self.assertIn('Post 1', post_contents)
        self.assertIn('Post 2', post_contents)
        self.assertIn('Post 3', post_contents)

class UserListTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='password123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='password123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user1)

    def test_get_user_list(self):

        url = reverse('user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        usernames = [user['username'] for user in response.data]
        self.assertIn('user1', usernames)
        self.assertIn('user2', usernames)
