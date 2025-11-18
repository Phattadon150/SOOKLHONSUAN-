// components/ConfirmModal.jsx

import React, { useEffect } from 'react';

/**
 * Modal สำหรับ "ยืนยัน" (Confirm Yes/No)
 * Props:
 * - isOpen: (boolean)
 * - onClose: (function) - (เมื่อกดยกเลิก)
 * - onConfirm: (function) - (เมื่อกดยืนยัน)
 * - title: (string)
 * - message: (string)
 */
export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {

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
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        
        <p className="text-gray-700 mb-6">{message}</p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="w-1/2 bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-full hover:bg-gray-300 transition"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="w-1/2 bg-red-600 text-white font-bold py-2 px-6 rounded-full shadow-md hover:bg-red-700 transition"
          >
            ยืนยันการลบ
          </button>
        </div>
      </div>
    </div>
  );
}