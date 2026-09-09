from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import transaction
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from firebase_admin import auth

from ..services.auth_service import get_tokens_for_user
from ..serializers.user_serializers import UserDetailSerializer
from ..serializers.block_serializers import BlockSerializer
from ..Accounts_models import Block, UserProfile, Role

User = get_user_model()
ph = PasswordHasher()

class SignupView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        token = request.data.get('firebase_token')
        name = request.data.get('name')
        flat_id = request.data.get('flat_id')
        
        if not token:
            return Response({"error": "firebase_token is required"}, status=400)
            
        try:
            decoded_token = auth.verify_id_token(token)
            phone_number = decoded_token.get('phone_number')
        except Exception as e:
            return Response({"error": f"Invalid Firebase token: {str(e)}"}, status=401)
            
        if not phone_number:
            return Response({"error": "Phone number not found in token"}, status=400)
            
        if User.objects.filter(username=phone_number).exists():
            return Response({"error": "Account already exists. Please login."}, status=400)
            
        with transaction.atomic():
            user = User.objects.create_user(username=phone_number)
            
            super_admin_phones = getattr(settings, 'SUPER_ADMIN_PHONES', set())
            if phone_number in super_admin_phones:
                user.is_superuser = True
                user.is_staff = True
                
            if name:
                user.first_name = name
            user.save()
            
            if not hasattr(user, 'profile'):
                profile = UserProfile.objects.create(user=user, phone_number=phone_number)
            else:
                profile = user.profile
                profile.phone_number = phone_number
                
            if user.is_superuser:
                try:
                    profile.role = Role.objects.get(id=1)
                except Role.DoesNotExist:
                    pass
                
            if flat_id:
                profile.flat_id = flat_id
            profile.save()
            
        return Response({"status": "setup_mpin", "uid": user.username})

class SetMPINView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        uid = request.data.get('uid')
        mpin = request.data.get('mpin')
        
        if not uid or not mpin:
            return Response({"error": "uid and mpin are required"}, status=400)
            
        if len(str(mpin)) != 4 or not str(mpin).isdigit():
            return Response({"error": "MPIN must be exactly 4 digits"}, status=400)
            
        try:
            user = User.objects.get(username=uid)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        user.profile.mpin = ph.hash(str(mpin))
        user.profile.save()
        
        tokens = get_tokens_for_user(user)
        return Response(tokens)

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        phone_number = request.data.get('phone_number')
        mpin = request.data.get('mpin')
        
        if not phone_number or not mpin:
            return Response({"error": "phone_number and mpin are required"}, status=400)
            
        try:
            user = User.objects.get(username=phone_number)
        except User.DoesNotExist:
            return Response({"error": "User not found. Please sign up."}, status=404)
            
        if not hasattr(user, 'profile') or not user.profile.mpin:
            return Response({"error": "MPIN not set for this user"}, status=400)
            
        try:
            ph.verify(user.profile.mpin, str(mpin))
        except VerifyMismatchError:
            return Response({"error": "Invalid MPIN"}, status=401)
            
        tokens = get_tokens_for_user(user)
        return Response(tokens)

class ForgotMPINView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        token = request.data.get('firebase_token')
        new_mpin = request.data.get('new_mpin')
        
        if not token or not new_mpin:
            return Response({"error": "firebase_token and new_mpin are required"}, status=400)
            
        if len(str(new_mpin)) != 4 or not str(new_mpin).isdigit():
            return Response({"error": "MPIN must be exactly 4 digits"}, status=400)
            
        try:
            decoded_token = auth.verify_id_token(token)
            phone_number = decoded_token.get('phone_number')
        except Exception as e:
            return Response({"error": f"Invalid Firebase token: {str(e)}"}, status=401)
            
        if not phone_number:
            return Response({"error": "Phone number not found in token"}, status=400)
            
        try:
            user = User.objects.get(username=phone_number)
        except User.DoesNotExist:
            return Response({"error": "User not found. Please sign up."}, status=404)
            
        user.profile.mpin = ph.hash(str(new_mpin))
        user.profile.save()
        
        tokens = get_tokens_for_user(user)
        return Response(tokens)

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)
