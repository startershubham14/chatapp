import React, { useState, useRef } from 'react';
import { Upload, X, Check, RotateCcw } from 'lucide-react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const AvatarUpload = ({ 
  currentImageUrl, 
  onUpload, 
  onCancel, 
  className = '' 
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    aspect: 1
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (crop, pixelCrop) => {
    setCrop(pixelCrop);
  };

  const getCroppedImg = (image, crop) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxSize = Math.min(crop.width, crop.height);
    canvas.width = maxSize;
    canvas.height = maxSize;

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      maxSize,
      maxSize
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !imageRef.current) return;

    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imageRef.current, crop);
      await onUpload(croppedBlob);
      handleCancel();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCrop({
      unit: '%',
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      aspect: 1
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onCancel();
  };

  const handleRotate = () => {
    // Simple rotation by 90 degrees
    setCrop(prev => ({
      ...prev,
      x: prev.y,
      y: prev.x,
      width: prev.height,
      height: prev.width
    }));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Input */}
      <div className="flex justify-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="avatar-upload"
        />
        <label
          htmlFor="avatar-upload"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors"
        >
          <Upload className="w-4 h-4" />
          Choose Image
        </label>
      </div>

      {/* Preview and Crop */}
      {previewUrl && (
        <div className="space-y-4">
          <div className="relative max-w-md mx-auto">
            <ReactCrop
              crop={crop}
              onChange={setCrop}
              onComplete={handleCropComplete}
              aspect={1}
              circularCrop
            >
              <img
                ref={imageRef}
                src={previewUrl}
                alt="Crop preview"
                className="max-w-full h-auto"
              />
            </ReactCrop>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-2">
            <button
              onClick={handleRotate}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Rotate
            </button>
            
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Upload
                </>
              )}
            </button>
            
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Current Avatar Display */}
      {currentImageUrl && !previewUrl && (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Current Avatar:</p>
          <img
            src={currentImageUrl}
            alt="Current avatar"
            className="w-20 h-20 rounded-full mx-auto object-cover"
          />
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;
