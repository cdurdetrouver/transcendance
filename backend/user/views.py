from django.http import JsonResponse
from .models import User
from .serializers import UserSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

@swagger_auto_schema(
    method='get',
    responses={200: UserSerializer(many=True)},
    operation_description="Retrieve a list of users"
)
@swagger_auto_schema(
    method='post',
    request_body=UserSerializer,
    responses={201: UserSerializer, 400: 'Bad Request'},
    operation_description="Create a new user"
)
@api_view(['GET', 'POST'])
def user_list(request):

	if request.method == 'GET':
		users = User.objects.all()
		serializer = UserSerializer(users, many=True)
		return JsonResponse({'users': serializer.data})
	elif request.method == 'POST':
		user = request.data
		serializer = UserSerializer(data=user)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=status.HTTP_201_CREATED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@swagger_auto_schema(
    method='get',
    responses={200: UserSerializer, 404: 'Not Found'},
    operation_description="Retrieve a user by ID"
)
@swagger_auto_schema(
    method='put',
    request_body=UserSerializer,
    responses={200: UserSerializer, 400: 'Bad Request', 404: 'Not Found'},
    operation_description="Update a user by ID"
)
@swagger_auto_schema(
    method='delete',
    responses={204: 'No Content', 404: 'Not Found'},
    operation_description="Delete a user by ID"
)
@api_view(['GET', 'PUT', 'DELETE'])
def user_detail(request, pk):
	try:
		user = User.objects.get(pk=pk)
	except User.DoesNotExist:
		return Response(status=status.HTTP_404_NOT_FOUND)

	if request.method == 'GET':
		serializer = UserSerializer(user)
		return JsonResponse(serializer.data)
	elif request.method == 'PUT':
		serializer = UserSerializer(user, data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	elif request.method == 'DELETE':
		user.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)
