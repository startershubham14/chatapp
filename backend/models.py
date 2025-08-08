"""
SQLAlchemy database models for chat application
Defines User, Chat, Message, and ChatParticipant tables
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    """User model for authentication and profile management"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # Profile fields
    display_name = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    status_message = Column(String(200), nullable=True)
    profile_image_url = Column(String(500), nullable=True)
    profile_image_public_id = Column(String(200), nullable=True)  # Cloudinary public ID
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    chat_participations = relationship("ChatParticipant", back_populates="user")
    created_chats = relationship("Chat", foreign_keys="Chat.created_by", back_populates="creator")

class Chat(Base):
    """Chat model for both one-on-one and group conversations"""
    __tablename__ = "chats"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=True)  # Optional for group chats
    is_group = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")
    participants = relationship("ChatParticipant", back_populates="chat", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_chats")

class Message(Base):
    """Message model for storing chat messages"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default="text")  # text, image, file, etc.
    is_delivered = Column(Boolean, default=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # For abuse detection tracking (optional)
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(String(100), nullable=True)
    
    # Relationships
    chat = relationship("Chat", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")

class ChatParticipant(Base):
    """Association table for many-to-many relationship between chats and users"""
    __tablename__ = "chat_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    is_admin = Column(Boolean, default=False)  # For group chat administration
    
    # Relationships
    chat = relationship("Chat", back_populates="participants")
    user = relationship("User", back_populates="chat_participations")
    
    # Ensure unique chat-user combinations
    __table_args__ = (
        {"schema": None}  # You can add unique constraints here if needed
    )

class AbuseLog(Base):
    """Optional: Log abuse detection results for monitoring and improvement"""
    __tablename__ = "abuse_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message_content = Column(Text, nullable=False)
    detection_result = Column(Boolean, nullable=False)  # True if abuse detected
    confidence_score = Column(String(10), nullable=True)
    flagged_categories = Column(String(200), nullable=True)  # JSON string of categories
    flagged_words = Column(Text, nullable=True)  # JSON string of flagged words
    detection_method = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    user = relationship("User")