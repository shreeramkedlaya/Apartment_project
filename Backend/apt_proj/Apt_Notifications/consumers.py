import json
import logging
import asyncio
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """
        Accept connection instantly, but wait for identify payload to authenticate.
        """
        self.user = None
        self.user_group_name = None
        self.auth_timeout_task = None
        await self.accept()

        # connect immeidately via query_string
        query_string = self.scope.get('query_string', b'').decode('utf8')
        token = parse_qs(query_string).get('token',[None])[0]

        if token:
            await self.authenticate_and_join(token)

        # start background task for 5-sec auth timeout
        self.auth_timeout_task = asyncio.create_task(self.check_auth_timeout())

    async def check_auth_timeout(self):
        await asyncio.sleep(5)

        if not self.user_group_name:
            logger.warning("WebSocket connection timed out")
            await self.close(code=4008)
        
    async def disconnect(self, close_code):
        if getattr(self, "auth_timeout_task", None):
            self.auth_timeout_task.cancel()


        if self.user_group_name:
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

    async def receive(self, text_data=None, bytes_data=None):
        """
        Expects a JSON payload like:
        {"type": "identify", "token": "JWT_TOKEN_HERE"}
        """
        if not text_data:
            return

        try:
            payload = json.loads(text_data)
            msg_type = payload.get('type')
            
            if msg_type == 'identify':
                token = payload.get('token')
                if not token:
                    await self.close(code=4000)
                    return
                
                await self.authenticate_and_join(token)
                
        except json.JSONDecodeError:
            pass
            
    async def authenticate_and_join(self, token_string):
        """
        Validates JWT token and joins the user to their specific notification group.
        """
        try:
            # SimpleJWT AccessToken validation
            access_token = AccessToken(token_string)
            user_id = access_token.payload.get('user_id')
            
            # Note: in a fully async environment, database lookups should be wrapped in sync_to_async.
            # But here we just need the user_id to name the group! No DB hit strictly required.
            if not user_id:
                raise ValueError("No user_id in token")
                
            self.user_group_name = f"user_{user_id}"
            
            # Join room group
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )
            
            await self.send(text_data=json.dumps({
                'type': 'auth_success',
                'message': f'Subscribed to {self.user_group_name}'
            }))
            
        except (TokenError, InvalidToken, ValueError) as e:
            logger.warning(f"WebSocket auth failed: {e}")
            await self.close(code=4001)

    # Receive message from room group
    async def send_notification(self, event):
        """
        This handler corresponds to the `type: send_notification` sent by Celery.
        """
        data = event.get('data', {})
        payload = data.get('payload', {})
        
        # Get the event_type from payload or default to 'notice_published' for backward compatibility
        event_type = payload.get('event_type', 'notice_published')
        
        ws_msg = {
            'type': event_type,
            'title': data.get('title'),
        }
        
        # Pass through all payload fields dynamically
        for key, value in payload.items():
            if key != 'event_type':
                ws_msg[key] = value
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps(ws_msg))
