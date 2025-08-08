/**
 * Abuse Warning Modal Component
 * 
 * ==================== ABUSE DETECTION UI COMPONENT ====================
 * This modal is shown when a user's message is blocked due to offensive content.
 * It provides feedback about why the message was blocked and educates users
 * about the community guidelines.
 * ====================================================================
 */

import React from 'react';
import { X, AlertTriangle, Shield, Info } from 'lucide-react';

const AbuseWarningModal = ({ isOpen, onClose, blockedMessage }) => {
  if (!isOpen || !blockedMessage) return null;

  const formatBlockedContent = (content) => {
    if (!content || content.length === 0) return 'inappropriate content';
    return content.join(', ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Message Blocked
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Main Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Your message was not sent
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {blockedMessage.reason || 'The message contains content that violates our community guidelines.'}
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          {blockedMessage.blockedContent && blockedMessage.blockedContent.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Flagged content:
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatBlockedContent(blockedMessage.blockedContent)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Guidelines */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              Community Guidelines:
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">•</span>
                <span>Be respectful and kind to all community members</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">•</span>
                <span>Avoid profanity, hate speech, and offensive language</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">•</span>
                <span>No harassment, threats, or harmful content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">•</span>
                <span>Keep conversations constructive and positive</span>
              </li>
            </ul>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-500 pt-2 border-t">
            Blocked at {blockedMessage.timestamp.toLocaleTimeString()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-200"
          >
            I Understand
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-200"
          >
            Continue Chatting
          </button>
        </div>
      </div>
    </div>
  );
};

export default AbuseWarningModal;