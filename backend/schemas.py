"""
Pydantic schemas for request/response validation
Data models for API endpoints
"""

from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# ==================== USER SCHEMAS ====================

class UserBase(BaseModel):
    """Base user schema with common fields"""
    username: str
    email: EmailStr

class UserCreate(UserBase):
    """Schema for user registration"""
    password: str

class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str

class UserResponse(UserBase):
    """Schema for user data in responses"""
    id: int
    display_name: Optional[str] = None
    bio: Optional[str] = None
    status_message: Optional[str] = None
    profile_image_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    """Schema for updating user profile"""
    display_name: Optional[str] = None
    bio: Optional[str] = None
    status_message: Optional[str] = None

class Token(BaseModel):
    """Schema for authentication token response"""
    access_token: str
    token_type: str
    user: UserResponse

# ==================== CHAT SCHEMAS ====================

class ChatBase(BaseModel):
    """Base chat schema"""
    name: Optional[str] = None
    is_group: bool = False

class ChatCreate(ChatBase):
    """Schema for creating a new chat"""
    participant_ids: List[int]  # List of user IDs to add to the chat

class ChatResponse(ChatBase):
    """Schema for chat data in responses"""
    id: int
    created_at: datetime
    participants: List[UserResponse]
    last_message: Optional['MessageResponse'] = None
    
    class Config:
        from_attributes = True

# ==================== MESSAGE SCHEMAS ====================

class MessageBase(BaseModel):
    """Base message schema"""
    content: str

class MessageCreate(MessageBase):
    """Schema for creating a new message"""
    chat_id: int

class MessageResponse(MessageBase):
    """Schema for message data in responses"""
    id: int
    sender: UserResponse
    created_at: datetime
    is_delivered: bool
    is_read: bool
    
    class Config:
        from_attributes = True

# ==================== SOCKET.IO SCHEMAS ====================

class SocketAuthData(BaseModel):
    """Schema for socket authentication data"""
    token: str

class SocketMessageData(BaseModel):
    """Schema for socket message data"""
    chat_id: int
    content: str

class SocketTypingData(BaseModel):
    """Schema for typing indicator data"""
    chat_id: int

class SocketJoinChatData(BaseModel):
    """Schema for joining chat room"""
    chat_id: int

# ==================== ABUSE DETECTION SCHEMAS ====================

class AbuseDetectionResult(BaseModel):
    """Schema for abuse detection results"""
    is_abusive: bool
    confidence: float
    flagged_words: List[str]
    category: Optional[str] = None
    severity: Optional[str] = None
    reason: Optional[str] = None

class MessageBlockedResponse(BaseModel):
    """Schema for blocked message response"""
    reason: str
    blocked_content: List[str]
    chat_id: int

# Update forward references
ChatResponse.model_rebuild()