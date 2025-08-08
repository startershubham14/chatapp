"""
Cloudinary configuration for image upload and management
"""

import os
import cloudinary
import cloudinary.uploader
import cloudinary.api
from typing import Optional, Tuple

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

class CloudinaryService:
    """Service class for Cloudinary operations"""
    
    @staticmethod
    async def upload_image(file_data: bytes, public_id: Optional[str] = None) -> Tuple[str, str]:
        """
        Upload image to Cloudinary
        
        Args:
            file_data: Image file data
            public_id: Optional public ID for the image
            
        Returns:
            Tuple of (image_url, public_id)
        """
        try:
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                file_data,
                public_id=public_id,
                folder="chat_app_profiles",
                transformation=[
                    {"width": 400, "height": 400, "crop": "fill", "gravity": "face"},
                    {"quality": "auto", "fetch_format": "auto"}
                ]
            )
            
            return result["secure_url"], result["public_id"]
            
        except Exception as e:
            raise Exception(f"Failed to upload image to Cloudinary: {str(e)}")
    
    @staticmethod
    async def delete_image(public_id: str) -> bool:
        """
        Delete image from Cloudinary
        
        Args:
            public_id: Cloudinary public ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get("result") == "ok"
        except Exception as e:
            print(f"Failed to delete image from Cloudinary: {str(e)}")
            return False
    
    @staticmethod
    async def update_image(file_data: bytes, old_public_id: Optional[str] = None) -> Tuple[str, str]:
        """
        Update image (delete old one if exists and upload new one)
        
        Args:
            file_data: New image file data
            old_public_id: Old image public ID to delete
            
        Returns:
            Tuple of (image_url, public_id)
        """
        # Delete old image if exists
        if old_public_id:
            await CloudinaryService.delete_image(old_public_id)
        
        # Upload new image
        return await CloudinaryService.upload_image(file_data)
