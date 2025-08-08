import React from 'react';
import { User } from 'lucide-react';

const Avatar = ({ 
  user, 
  size = 'md', 
  className = '', 
  onClick = null,
  showStatus = false 
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl'
  };

  const getDisplayName = () => {
    return user?.display_name || user?.username || 'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = () => {
    // You can implement online/offline status logic here
    return 'bg-green-500'; // Default to online
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full flex items-center justify-center font-semibold
          ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
          ${user?.profile_image_url 
            ? 'bg-cover bg-center' 
            : 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
          }
        `}
        style={user?.profile_image_url ? {
          backgroundImage: `url(${user.profile_image_url})`
        } : {}}
        onClick={onClick}
      >
        {!user?.profile_image_url && (
          user ? getInitials() : <User className="w-1/2 h-1/2" />
        )}
      </div>
      
      {showStatus && (
        <div className={`
          absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white
          ${getStatusColor()}
        `} />
      )}
    </div>
  );
};

export default Avatar;
