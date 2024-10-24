from django.test import TestCase
from .models import Room, User, Message

class MessageModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            username='testuser',
            email='testuser@example.com',
            password='\MVwbDjln(',
            user_type='email'
        )
        self.test_message = Message.objects.create(
            author = self.user,
            message_type = 'announce',
            content = 'test message',
        )

    def test_message_creation(self):
        self.assertEqual(self.test_message.author, self.user)
        self.assertEqual(self.test_message.message_type, 'announce')
        self.assertEqual(self.test_message.content, 'test message')

    def test_message_update(self):
        self.test_message.content = "message changed"
        self.test_message.save()
        self.assertEqual(self.test_message.content, "message changed")

    def test_message_delete(self):
        self.user.delete()
        self.test_message.refresh_from_db()
        self.assertIsNone(self.test_message.author)

        message_id = self.test_message.id
        self.test_message.delete()
        with self.assertRaises(Message.DoesNotExist):
            Message.objects.get(id=message_id)


class RoomModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create(
            username='testuser',
            email='testuser@example.com',
            password='\MVwbDjln(',
            user_type='email'
        )
        self.test_message = Message.objects.create(
            author = self.user,
            message_type = 'announce',
            content = 'test message',
        )
        self.room = Room.objects.create(
            name = "test",
            group_name = "N'importe quoi",
            created_by =  self.user,
        )
        self.room.messages.set([self.test_message])
        self.room.participants.set([self.user])

    def test_room_creation(self):
        self.assertEqual(self.room.name, "test")
        self.assertEqual(self.room.group_name, "N'importe quoi")
        self.assertEqual(self.room.created_by, self.user)
        self.assertEqual(self.room.messages.first(), self.test_message)
        self.assertEqual(self.room.participants.first(), self.user)

    def test_room_update(self):
        self.room.participants.set(self.room.participants.exclude(id=self.user.id))
        self.room.save()
        self.assertEqual(self.room.participants.first(), None)
        self.room.name = 'changed'
        self.room.save()
        self.assertEqual(self.room.name, 'changed')

    def test_room_delete(self):
        self.user.delete()
        self.room.refresh_from_db()
        self.assertIsNone(self.room.created_by)

        room_id = self.room.id
        self.room.delete()
        with self.assertRaises(Room.DoesNotExist):
            Room.objects.get(id=room_id)