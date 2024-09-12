from django.test import TestCase
from .models import User
from django.contrib.auth.hashers import make_password, check_password

class UserModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create(
            username='testuser',
            email='testuser@example.com',
            password='\MVwbDjln('
        )

    def test_user_creation(self):
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.email, 'testuser@example.com')
        self.assertEqual(check_password('\MVwbDjln(', self.user.password), True)

    def test_user_str(self):
        self.assertEqual(str(self.user), 'testuser')

    def test_user_update(self):
        self.user.username = 'updateduser'
        self.user.save()
        self.assertEqual(self.user.username, 'updateduser')

    def test_user_delete(self):
        user_id = self.user.id
        self.user.delete()
        with self.assertRaises(User.DoesNotExist):
            User.objects.get(id=user_id)