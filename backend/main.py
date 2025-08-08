"""
Real-time Chat Application Backend
FastAPI + Socket.IO + PostgreSQL
"""

import os
from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import socketio
import uvicorn
from datetime import datetime, timedelta
from typing import List, Optional

from database import get_db, engine, Base
from models import User, Chat, Message, ChatParticipant
from schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    ChatCreate, ChatResponse, MessageCreate, MessageResponse,
    UserProfileUpdate
)
from auth import (
    create_access_token, verify_token, get_password_hash, verify_password,
    get_current_user
)
from abuse_detection import AbuseDetector  # Placeholder module
from cloudinary_config import CloudinaryService

# Create database tables
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI(title="Real-time Chat API", version="1.0.0")

# Get allowed origins from environment variable, default to localhost for local testing
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,https://81e8d419db2a.ngrok-free.app")
allowed_origins = allowed_origins_str.split(',')

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Support multiple origins including ngrok
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Socket.IO server
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=allowed_origins
)

# Combine FastAPI and Socket.IO
socket_app = socketio.ASGIApp(sio, app)

# Security
security = HTTPBearer()

# Initialize abuse detector (placeholder)
abuse_detector = AbuseDetector()

# ==================== API ROUTES ====================

@app.options("/api/auth/register")
def register_options():
    """Handle OPTIONS request for register endpoint"""
    return {"message": "OK"}

@app.post("/api/auth/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        display_name=new_user.display_name,
        bio=new_user.bio,
        status_message=new_user.status_message,
        profile_image_url=new_user.profile_image_url,
        created_at=new_user.created_at
    )

@app.options("/api/auth/login")
def login_options():
    """Handle OPTIONS request for login endpoint"""
    return {"message": "OK"}

@app.post("/api/auth/login", response_model=Token)
def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            display_name=user.display_name,
            bio=user.bio,
            status_message=user.status_message,
            profile_image_url=user.profile_image_url,
            created_at=user.created_at
        )
    )

@app.get("/api/users/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        display_name=current_user.display_name,
        bio=current_user.bio,
        status_message=current_user.status_message,
        profile_image_url=current_user.profile_image_url,
        created_at=current_user.created_at
    )

@app.get("/api/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all users (for starting chats)"""
    users = db.query(User).filter(User.id != current_user.id).all()
    return [
        UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            display_name=user.display_name,
            bio=user.bio,
            status_message=user.status_message,
            profile_image_url=user.profile_image_url,
            created_at=user.created_at
        )
        for user in users
    ]

@app.put("/api/users/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user profile information"""
    # Update profile fields
    if profile_data.display_name is not None:
        current_user.display_name = profile_data.display_name
    if profile_data.bio is not None:
        current_user.bio = profile_data.bio
    if profile_data.status_message is not None:
        current_user.status_message = profile_data.status_message
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        display_name=current_user.display_name,
        bio=current_user.bio,
        status_message=current_user.status_message,
        profile_image_url=current_user.profile_image_url,
        created_at=current_user.created_at
    )

@app.post("/api/users/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload user profile avatar"""
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Validate file size (max 5MB)
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 5MB"
        )
    
    try:
        # Read file data
        file_data = await file.read()
        
        # Upload to Cloudinary
        image_url, public_id = await CloudinaryService.update_image(
            file_data, 
            current_user.profile_image_public_id
        )
        
        # Update user profile
        current_user.profile_image_url = image_url
        current_user.profile_image_public_id = public_id
        
        db.commit()
        db.refresh(current_user)
        
        return {
            "message": "Avatar uploaded successfully",
            "profile_image_url": image_url
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload avatar: {str(e)}"
        )

@app.delete("/api/users/profile/avatar")
async def delete_avatar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete user profile avatar"""
    if not current_user.profile_image_public_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No avatar to delete"
        )
    
    try:
        # Delete from Cloudinary
        await CloudinaryService.delete_image(current_user.profile_image_public_id)
        
        # Update user profile
        current_user.profile_image_url = None
        current_user.profile_image_public_id = None
        
        db.commit()
        
        return {"message": "Avatar deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete avatar: {str(e)}"
        )

@app.post("/api/chats", response_model=ChatResponse)
def create_chat(chat_data: ChatCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new chat (one-on-one or group)"""
    # Create chat
    new_chat = Chat(
        name=chat_data.name,
        is_group=chat_data.is_group,
        created_by=current_user.id
    )
    
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    
    # Add participants
    participants = [current_user.id] + chat_data.participant_ids
    for participant_id in set(participants):  # Remove duplicates
        chat_participant = ChatParticipant(
            chat_id=new_chat.id,
            user_id=participant_id
        )
        db.add(chat_participant)
    
    db.commit()
    
    # Get participant details
    participant_users = db.query(User).filter(User.id.in_(participants)).all()
    
    return ChatResponse(
        id=new_chat.id,
        name=new_chat.name,
        is_group=new_chat.is_group,
        created_at=new_chat.created_at,
        participants=[
            UserResponse(
                id=user.id,
                username=user.username,
                email=user.email,
                display_name=user.display_name,
                bio=user.bio,
                status_message=user.status_message,
                profile_image_url=user.profile_image_url,
                created_at=user.created_at
            )
            for user in participant_users
        ],
        last_message=None
    )

@app.get("/api/chats", response_model=List[ChatResponse])
def get_user_chats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all chats for current user"""
    # Get chats where user is a participant
    chat_participants = db.query(ChatParticipant).filter(
        ChatParticipant.user_id == current_user.id
    ).all()
    
    chat_responses = []
    for cp in chat_participants:
        chat = db.query(Chat).filter(Chat.id == cp.chat_id).first()
        if not chat:
            continue
            
        # Get all participants
        participants = db.query(User).join(ChatParticipant).filter(
            ChatParticipant.chat_id == chat.id
        ).all()
        
        # Get last message
        last_message = db.query(Message).filter(
            Message.chat_id == chat.id
        ).order_by(Message.created_at.desc()).first()
        
        last_message_response = None
        if last_message:
            sender = db.query(User).filter(User.id == last_message.sender_id).first()
            last_message_response = MessageResponse(
                id=last_message.id,
                content=last_message.content,
                sender=UserResponse(
                    id=sender.id,
                    username=sender.username,
                    email=sender.email,
                    display_name=sender.display_name,
                    bio=sender.bio,
                    status_message=sender.status_message,
                    profile_image_url=sender.profile_image_url,
                    created_at=sender.created_at
                ),
                created_at=last_message.created_at,
                is_delivered=last_message.is_delivered,
                is_read=last_message.is_read
            )
        
        chat_responses.append(ChatResponse(
            id=chat.id,
            name=chat.name,
            is_group=chat.is_group,
            created_at=chat.created_at,
            participants=[
                UserResponse(
                    id=user.id,
                    username=user.username,
                    email=user.email,
                    created_at=user.created_at
                )
                for user in participants
            ],
            last_message=last_message_response
        ))
    
    return chat_responses

@app.get("/api/chats/{chat_id}/messages", response_model=List[MessageResponse])
def get_chat_messages(
    chat_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get messages for a specific chat"""
    # Verify user is participant in chat
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_id == chat_id,
        ChatParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this chat"
        )
    
    # Get messages
    messages = db.query(Message).filter(
        Message.chat_id == chat_id
    ).order_by(Message.created_at.desc()).offset(offset).limit(limit).all()
    
    message_responses = []
    for message in reversed(messages):  # Reverse to show oldest first
        sender = db.query(User).filter(User.id == message.sender_id).first()
        message_responses.append(MessageResponse(
            id=message.id,
            content=message.content,
            sender=UserResponse(
                id=sender.id,
                username=sender.username,
                email=sender.email,
                created_at=sender.created_at
            ),
            created_at=message.created_at,
            is_delivered=message.is_delivered,
            is_read=message.is_read
        ))
    
    return message_responses

# ==================== SOCKET.IO EVENTS ====================

# Store active connections
active_connections = {}

@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    print(f"Client {sid} connected")

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"Client {sid} disconnected")
    # Remove from active connections
    user_id = None
    for uid, connection_sid in active_connections.items():
        if connection_sid == sid:
            user_id = uid
            break
    
    if user_id:
        del active_connections[user_id]
        # Notify other users that this user is offline
        await sio.emit('user_offline', {'user_id': user_id}, skip_sid=sid)

@sio.event
async def authenticate(sid, data):
    """Authenticate socket connection with JWT token"""
    try:
        token = data.get('token')
        if not token:
            await sio.emit('auth_error', {'message': 'Token required'}, room=sid)
            return
        
        # Verify token and get user
        from database import SessionLocal
        db = SessionLocal()
        try:
            payload = verify_token(token)
            user_id = int(payload.get("sub"))
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                await sio.emit('auth_error', {'message': 'Invalid user'}, room=sid)
                return
            
            # Store connection
            active_connections[user_id] = sid
            
            # Join user to their own room for private messaging
            await sio.enter_room(sid, f"user_{user_id}")
            
            # Notify success
            await sio.emit('authenticated', {
                'user_id': user_id,
                'username': user.username
            }, room=sid)
            
            # Notify other users that this user is online
            await sio.emit('user_online', {
                'user_id': user_id,
                'username': user.username
            }, skip_sid=sid)
            
        finally:
            db.close()
            
    except Exception as e:
        await sio.emit('auth_error', {'message': 'Authentication failed'}, room=sid)

@sio.event
async def join_chat(sid, data):
    """Join a chat room"""
    chat_id = data.get('chat_id')
    if chat_id:
        await sio.enter_room(sid, f"chat_{chat_id}")
        print(f"Client {sid} joined chat {chat_id}")

@sio.event
async def leave_chat(sid, data):
    """Leave a chat room"""
    chat_id = data.get('chat_id')
    if chat_id:
        await sio.leave_room(sid, f"chat_{chat_id}")
        print(f"Client {sid} left chat {chat_id}")

@sio.event
async def send_message(sid, data):
    """Handle sending a message"""
    try:
        from database import SessionLocal
        db = SessionLocal()
        
        # Get user from connection
        user_id = None
        for uid, connection_sid in active_connections.items():
            if connection_sid == sid:
                user_id = uid
                break
        
        if not user_id:
            await sio.emit('error', {'message': 'Not authenticated'}, room=sid)
            return
        
        chat_id = data.get('chat_id')
        content = data.get('content', '').strip()
        
        if not chat_id or not content:
            await sio.emit('error', {'message': 'Chat ID and content required'}, room=sid)
            return
        
        # Verify user is participant in chat
        participant = db.query(ChatParticipant).filter(
            ChatParticipant.chat_id == chat_id,
            ChatParticipant.user_id == user_id
        ).first()
        
        if not participant:
            await sio.emit('error', {'message': 'Access denied to this chat'}, room=sid)
            return
        
        # ==================== ABUSE DETECTION PLACEHOLDER ====================
        # TODO: Integrate your NLP abuse detection model here
        # This is where you'll plug in your abuse detection logic
        
        abuse_result = await abuse_detector.check_content(content, user_id)
        
        if abuse_result.is_abusive:
            # Message blocked due to offensive content
            await sio.emit('message_blocked', {
                'reason': 'Message contains offensive content',
                'blocked_content': abuse_result.flagged_words,
                'chat_id': chat_id
            }, room=sid)
            
            # Optionally log the incident
            print(f"Blocked message from user {user_id}: {content}")
            return
        
        # If content passes abuse detection, proceed with sending
        # =================================================================
        
        # Create message in database
        user = db.query(User).filter(User.id == user_id).first()
        new_message = Message(
            chat_id=chat_id,
            sender_id=user_id,
            content=content,
            is_delivered=True  # Assume delivered when sent to socket
        )
        
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        
        # Prepare message response
        message_response = {
            'id': new_message.id,
            'chat_id': chat_id,
            'content': content,
            'sender': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            },
            'created_at': new_message.created_at.isoformat(),
            'is_delivered': True,
            'is_read': False
        }
        
        # Send message to all participants in the chat
        await sio.emit('new_message', message_response, room=f"chat_{chat_id}")
        
        # Send delivery confirmation to sender
        await sio.emit('message_sent', {
            'message_id': new_message.id,
            'status': 'delivered'
        }, room=sid)
        
        db.close()
        
    except Exception as e:
        print(f"Error sending message: {e}")
        await sio.emit('error', {'message': 'Failed to send message'}, room=sid)

@sio.event
async def typing_start(sid, data):
    """Handle typing indicator start"""
    chat_id = data.get('chat_id')
    user_id = None
    
    # Get user from connection
    for uid, connection_sid in active_connections.items():
        if connection_sid == sid:
            user_id = uid
            break
    
    if user_id and chat_id:
        await sio.emit('user_typing', {
            'chat_id': chat_id,
            'user_id': user_id,
            'typing': True
        }, room=f"chat_{chat_id}", skip_sid=sid)

@sio.event
async def typing_stop(sid, data):
    """Handle typing indicator stop"""
    chat_id = data.get('chat_id')
    user_id = None
    
    # Get user from connection
    for uid, connection_sid in active_connections.items():
        if connection_sid == sid:
            user_id = uid
            break
    
    if user_id and chat_id:
        await sio.emit('user_typing', {
            'chat_id': chat_id,
            'user_id': user_id,
            'typing': False
        }, room=f"chat_{chat_id}", skip_sid=sid)

@sio.event
async def mark_messages_read(sid, data):
    """Mark messages as read"""
    try:
        from database import SessionLocal
        db = SessionLocal()
        
        user_id = None
        for uid, connection_sid in active_connections.items():
            if connection_sid == sid:
                user_id = uid
                break
        
        if not user_id:
            return
        
        chat_id = data.get('chat_id')
        if not chat_id:
            return
        
        # Mark all unread messages in this chat as read for this user
        messages = db.query(Message).filter(
            Message.chat_id == chat_id,
            Message.sender_id != user_id,
            Message.is_read == False
        ).all()
        
        for message in messages:
            message.is_read = True
        
        db.commit()
        
        # Notify other participants that messages were read
        await sio.emit('messages_read', {
            'chat_id': chat_id,
            'reader_id': user_id,
            'message_ids': [msg.id for msg in messages]
        }, room=f"chat_{chat_id}", skip_sid=sid)
        
        db.close()
        
    except Exception as e:
        print(f"Error marking messages as read: {e}")

if __name__ == "__main__":
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)