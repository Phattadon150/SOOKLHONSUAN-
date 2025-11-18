// src/components/AlertModal.jsx (ไฟล์เดิม)

import { motion, AnimatePresence } from "framer-motion";

// (ไอคอน SVG สำหรับ Success และ Error)
const SuccessIcon = () => (
  <svg className="w-16 h-16 text-green-600 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-16 h-16 text-red-600 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);


export default function AlertModal({ 
  isOpen, 
  onClose, 
  type = 'success', // 'success' หรือ 'error'
  title, 
  message 
}) {

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
    exit: { opacity: 0, scale: 0.9, y: 20 },
  };

  const buttonClass = type === 'success' 
    ? 'bg-green-600 hover:bg-green-700' 
    : 'bg-red-600 hover:bg-red-700';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose} // 👈 ปิดเมื่อคลิกฉากหลัง
        >
          <motion.div
            className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()} // 👈 กันไม่ให้ปิดเมื่อคลิกที่ตัว Modal
          >
            {type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
            
            <h3 className="text-2xl font-bold text-center text-gray-900 mt-4">
              {title}
            </h3>
            
            <p className="text-gray-600 text-center mt-2 mb-6">
              {message}
            </p>

            <button
              onClick={onClose}
              className={`w-full py-3 px-4 rounded-full text-white font-semibold ${buttonClass} transition`}
            >
              ตกลง
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}