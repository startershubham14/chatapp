# User Profile System Setup Guide

This guide will help you set up the complete user profile system with Cloudinary integration for your React chat application.

## 🎯 **Features Implemented**

- ✅ **Profile Modal**: WhatsApp-inspired profile editing interface
- ✅ **Avatar Upload**: Image cropping and upload to Cloudinary
- ✅ **Profile Fields**: Display name, bio, status message
- ✅ **Avatar Display**: Throughout the app with fallback initials
- ✅ **Real-time Updates**: Profile changes reflect immediately
- ✅ **Image Optimization**: Automatic cropping and compression

## 🚀 **Quick Setup**

### 1. **Cloudinary Setup**

1. **Sign up for Cloudinary** (free tier with 10GB storage):
   - Go to [cloudinary.com](https://cloudinary.com)
   - Create a free account
   - Get your credentials from the dashboard

2. **Update Environment Variables**:
   ```bash
   # In docker-compose.yml, update these values:
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

### 2. **Database Migration**

Run the database migration to add profile fields:

```bash
# From the backend directory
python migrations/add_profile_fields.py
```

### 3. **Install Dependencies**

```bash
# Frontend dependencies
cd frontend
npm install react-image-crop

# Backend dependencies (already added to requirements.txt)
cd ../backend
pip install cloudinary Pillow
```

### 4. **Rebuild and Start**

```bash
# Rebuild containers with new dependencies
docker-compose down
docker-compose build
docker-compose up
```

## 📁 **New Files Created**

### **Backend**
- `backend/cloudinary_config.py` - Cloudinary integration
- `backend/migrations/add_profile_fields.py` - Database migration
- Updated `backend/models.py` - Added profile fields
- Updated `backend/schemas.py` - Added profile schemas
- Updated `backend/main.py` - Added profile API endpoints

### **Frontend**
- `frontend/src/components/common/Avatar.jsx` - Reusable avatar component
- `frontend/src/components/common/AvatarUpload.jsx` - Image upload with cropping
- `frontend/src/components/Profile/ProfileModal.jsx` - Profile editing modal
- `frontend/src/services/profileService.js` - Profile API service

## 🔧 **API Endpoints**

### **Profile Management**
```http
PUT /api/users/profile          # Update profile information
POST /api/users/profile/avatar  # Upload profile picture
DELETE /api/users/profile/avatar # Delete profile picture
```

### **Request Examples**

**Update Profile:**
```json
PUT /api/users/profile
{
  "display_name": "John Doe",
  "bio": "Software developer and coffee enthusiast",
  "status_message": "Available for chat!"
}
```

**Upload Avatar:**
```http
POST /api/users/profile/avatar
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <image_file>
```

## 🎨 **Usage Examples**

### **Display Avatar in Components**
```jsx
import Avatar from '../common/Avatar';

// Basic usage
<Avatar user={user} size="md" />

// With click handler
<Avatar 
  user={user} 
  size="lg" 
  onClick={() => openProfileModal()}
  showStatus={true}
/>
```

### **Profile Modal Integration**
```jsx
import ProfileModal from '../Profile/ProfileModal';

const [isProfileOpen, setIsProfileOpen] = useState(false);
const [currentUser, setCurrentUser] = useState(null);

// In your component
<ProfileModal
  isOpen={isProfileOpen}
  onClose={() => setIsProfileOpen(false)}
  currentUser={currentUser}
  onProfileUpdate={(updatedUser) => setCurrentUser(updatedUser)}
/>
```

## 🎯 **Avatar Sizes Available**

- `xs`: 24px (w-6 h-6)
- `sm`: 32px (w-8 h-8)
- `md`: 40px (w-10 h-10) - **Default**
- `lg`: 48px (w-12 h-12)
- `xl`: 64px (w-16 h-16)
- `2xl`: 80px (w-20 h-20)

## 🔒 **Security Features**

- ✅ **File Type Validation**: Only images allowed
- ✅ **File Size Limit**: 5MB maximum
- ✅ **Image Cropping**: Automatic square crop
- ✅ **Cloudinary Security**: Secure upload URLs
- ✅ **JWT Authentication**: All endpoints protected

## 🎨 **Design Features**

- ✅ **WhatsApp-inspired UI**: Clean, modern design
- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Loading States**: Upload progress indicators
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Fallback Avatars**: Initials when no photo
- ✅ **Hover Effects**: Interactive elements

## 🧪 **Testing the System**

1. **Register/Login** to your chat app
2. **Click your avatar** in the chat interface
3. **Edit your profile**:
   - Upload a profile picture
   - Add a display name
   - Write a bio
   - Set a status message
4. **Save changes** and see them reflected immediately
5. **Test in messages** - avatars should appear next to messages

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Cloudinary Upload Fails**:
   - Check your Cloudinary credentials
   - Verify environment variables are set
   - Check file size (max 5MB)

2. **Avatar Not Displaying**:
   - Check browser console for errors
   - Verify image URL is accessible
   - Check CORS settings

3. **Database Migration Fails**:
   - Ensure PostgreSQL is running
   - Check database connection
   - Verify table structure

### **Debug Commands**

```bash
# Check Cloudinary connection
curl -X GET "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/resources/image" \
  -H "Authorization: Basic $(echo -n 'YOUR_API_KEY:YOUR_API_SECRET' | base64)"

# Check database schema
docker-compose exec db psql -U chatapp_user -d chatapp -c "\d users"

# Check backend logs
docker-compose logs backend
```

## 📈 **Performance Optimizations**

- ✅ **Image Compression**: Automatic optimization via Cloudinary
- ✅ **Lazy Loading**: Images load on demand
- ✅ **Caching**: Cloudinary CDN for fast delivery
- ✅ **Progressive Loading**: Blur-up effect for images

## 🔮 **Future Enhancements**

- [ ] **Profile Privacy Settings**: Control who sees your profile
- [ ] **Profile Themes**: Custom color schemes
- [ ] **Profile Verification**: Badge system
- [ ] **Profile Analytics**: View counts, etc.
- [ ] **Profile Sharing**: Share profile cards
- [ ] **Profile Backup**: Export/import profile data

## 📞 **Support**

If you encounter any issues:

1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check the backend logs for API errors
5. Verify Cloudinary account is active

The profile system is now fully integrated and ready for production use! 🎉
