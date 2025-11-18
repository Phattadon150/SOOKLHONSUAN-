// components/Modal.jsx

import React, { useEffect } from 'react';

/**
 * Modal สำหรับ "แจ้งเตือน" (Info/Error)
 * Props:
 * - isOpen: (boolean)
 * - onClose: (function)
 * - title: (string)
 * - message: (string)
 * - isError: (boolean) - (ถ้า true ปุ่มจะเป็นสีแดง)
 */
export default function Modal({ isOpen, onClose, title, message, isError = false }) {
  
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm m-4 p-6 text-center animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={`text-xl font-bold mb-2 ${isError ? 'text-red-700' : 'text-green-900'}`}>{title}</h3>
        
        <p className="text-gray-700 mb-6">{message}</p>
        
        <button
          onClick={onClose}
          className={`w-full font-bold py-2 px-6 rounded-full shadow-md transition ${
            isError 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-green-700 text-white hover:bg-green-800'
          }`}
        >
          ตกลง
        </button>
      </div>
    </div>
  );
}