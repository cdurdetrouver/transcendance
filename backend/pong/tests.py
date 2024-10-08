# backend/game/tests.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Game

User = get_user_model()

class GameModelTest(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='player1',
            email='player1@example.com',
            password='testpassword'
        )
        self.user2 = User.objects.create_user(
            username='player2',
            email='player2@example.com',
            password='testpassword'
        )
        self.game = Game.objects.create(
            room_name='Test Room',
            player1=self.user1,
            player2=self.user2,
            player1_score=10,
            player2_score=20,
            finished=True,
            winner=self.user2
        )

    def test_game_creation(self):
        self.assertEqual(self.game.room_name, 'Test Room')
        self.assertEqual(self.game.player1.username, 'player1')
        self.assertEqual(self.game.player2.username, 'player2')
        self.assertEqual(self.game.player1_score, 10)
        self.assertEqual(self.game.player2_score, 20)
        self.assertTrue(self.game.finished)
        self.assertEqual(self.game.winner.username, 'player2')

    def test_get_other_player(self):
        self.assertEqual(self.game.get_other_player(self.user1), self.user2)
        self.assertEqual(self.game.get_other_player(self.user2), self.user1)
        self.assertIsNone(self.game.get_other_player(User.objects.create_user(
            username='player3',
            email='player3@example.com',
            password='testpassword'
        )))
