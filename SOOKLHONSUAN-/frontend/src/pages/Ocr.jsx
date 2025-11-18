import React, { useState, useCallback } from 'react';


const OCRComponent = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');
    const [ocrResult, setOcrResult] = useState('ผลลัพธ์ข้อความที่สแกนจะปรากฏที่นี่...');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const processFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
            setOcrResult('กดปุ่ม "สแกน" เพื่อเริ่มประมวลผล...');
            setError('');
        } else {
            setSelectedFile(null);
            setImagePreviewUrl('');
            setOcrResult('กรุณาเลือกไฟล์รูปภาพ (jpg, png) ที่ถูกต้อง');
            setError('❌ ไฟล์ที่เลือกไม่ใช่รูปภาพที่ถูกต้อง');
        }
    };

    const handleFileChange = useCallback((event) => {
        processFile(event.target.files[0]);
    }, []);

    const handleDrop = useCallback((event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files[0];
        processFile(file);
    }, []);

    const handleDragOver = useCallback((event) => {
        event.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const runOCR = useCallback(async () => {
        if (!selectedFile) {
            setError('⚠️ กรุณาเลือกรูปภาพก่อนทำการสแกน');
            return;
        }

        setIsLoading(true);
        setError('');
        setOcrResult('⏳ กำลังประมวลผล OCR... กรุณารอสักครู่');

        try {
            await new Promise(resolve => setTimeout(resolve, 3000)); 

            const dummyResponseText = `
                นี่คือข้อความที่แปลงมาจากรูปภาพ
                โดยใช้ React Component และ OCR API (จำลอง)

                "Digital transformation is driven by efficient data capture solutions like OCR, 
                improving document management workflows significantly." 
                
                Project Status: Complete. 
                วัน-เวลา: ${new Date().toLocaleTimeString()}
            `;
            
            setOcrResult(dummyResponseText);
            
        } catch (err) {
            setError('❌ เกิดข้อผิดพลาดในการประมวลผล OCR');
            setOcrResult('ไม่สามารถแปลงรูปภาพเป็นข้อความได้');
        } finally {
            setIsLoading(false);
        }
    }, [selectedFile]);

    const copyToClipboard = () => {
        // Use document.execCommand('copy') for better compatibility in iframe environments
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = ocrResult;
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        try {
            document.execCommand('copy');
            setError('✅ คัดลอกข้อความแล้ว!');
        } catch (err) {
            setError('❌ ไม่สามารถคัดลอกได้');
        }
        document.body.removeChild(tempTextarea);
        setTimeout(() => setError(''), 2000);
    };

    return (
        <div className="min-h-screen bg-emerald-50 p-4 sm:p-10">
            <header className="text-center mb-10">
                <h1 className="text-4xl font-black text-emerald-800 tracking-wider drop-shadow-md">
                    <span role="img" aria-label="document"></span> สแกนข้อมูลเพื่อคำนวณผลผลิต
                </h1>
                <p className="text-emerald-600 mt-2 font-medium">
                    นำเข้าข้อมูลการผลิตอัตโนมัติจากภาพถ่าย
                </p>
            </header>

            {error && (
                <div className="max-w-6xl mx-auto mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl shadow-lg transition-all duration-300 text-center">
                    {error}
                </div>
            )}

            {/* Main Split-View Container */}
            <div className="flex flex-col lg:flex-row max-w-6xl mx-auto gap-8 bg-white p-8 rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,128,0,0.2)]">
                
                {/* 1. INPUT/PREVIEW SECTION (Left Half - 40%) */}
                <div className="lg:w-2/5 w-full bg-emerald-50 p-6 rounded-2xl shadow-inner border border-emerald-200 flex flex-col space-y-5">
                    <h2 className="text-xl font-bold text-emerald-800 border-b border-emerald-300 pb-3 mb-2">
                         อัปโหลดรูปภาพ หรือ ถ่ายรูป
                    </h2>
                     <p className="text-sm font-semibold text-emerald-600 mb-3">
                        เพื่อประสิทธิภาพที่ดี ถ่ายภาพในที่ที่มีแสงสว่างเพียงพอและหลีกเลี่ยงเงา 
                    </p>
                    
                    
                    {/* Drag & Drop Area */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`border-4 border-dashed rounded-xl h-48 flex flex-col justify-center items-center transition-all duration-300 cursor-pointer 
                            ${
                            isDragging 
                            ? 'border-emerald-500 bg-emerald-100/70 scale-[1.02]' 
                            : 'border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50'
                        }`}
                        onClick={() => document.getElementById('file-upload').click()}
                    >
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            id="file-upload"
                            className="hidden"
                        />
                        <svg className={`w-8 h-8 ${isDragging ? 'text-emerald-700' : 'text-emerald-500'} transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        <p className="text-lg font-bold text-gray-700 mt-2">
                            {isDragging ? '📂 ปล่อยไฟล์เพื่ออัปโหลด' : 'ลากไฟล์มาวาง หรือคลิกที่นี่'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">รองรับ JPG, PNG, PDF (สูงสุด 5MB)</p>
                    </div>

                    {/* File Info / Preview */}
                    {selectedFile && (
                        <div className="p-4 bg-white rounded-lg shadow-lg border border-emerald-100">
                            <p className="text-sm font-semibold text-emerald-600 mb-3">
                                ไฟล์ที่พร้อมสแกน: <span className="text-gray-700 font-normal">{selectedFile.name}</span>
                            </p>
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-1">
                                <img 
                                    src={imagePreviewUrl} 
                                    alt="Image Preview" 
                                    className="max-w-full h-auto rounded-md shadow-inner mx-auto"
                                />
                            </div>
                        </div>
                    )}

                    {/* Scan Button */}
                    <button 
                        onClick={runOCR}
                        disabled={!selectedFile || isLoading}
                        className={`w-full py-3 rounded-xl font-extrabold text-white transition-all duration-300 shadow-xl 
                            ${!selectedFile || isLoading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-emerald-600 hover:bg-emerald-700 transform hover:scale-[1.01] active:scale-[0.99] shadow-emerald-400/50'}
                            ${isLoading ? 'animate-pulse bg-lime-500 text-gray-900 shadow-none' : ''}
                        `}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                กำลังสแกน...
                            </span>
                        ) : '🔍 สแกนและแปลงเป็นข้อความ'}
                    </button>
                </div>

                {/* 2. RESULT SECTION (Right Half - 60%) */}
                <div className="lg:w-3/5 w-full bg-gray-50 p-6 rounded-2xl shadow-inner border border-gray-200 flex flex-col space-y-5">
                    <h2 className="text-xl font-bold text-gray-800 border-b border-gray-300 pb-3 mb-2">
                         ผลลัพธ์ที่แปลงแล้ว
                    </h2>
                    <p className="text-sm font-semibold text-emerald-600 mb-3">
                    ตรวจสอบให้แน่ใจว่าภาพ ไม่เบลอ                   
                     </p>
                    <textarea
                        className="w-full h-96 p-4 text-gray-700 bg-white border border-gray-300 rounded-xl resize-none 
                                   focus:ring-4 focus:ring-teal-300/50 focus:border-teal-500 transition-shadow duration-300 
                                   font-mono text-base leading-relaxed shadow-md flex-grow"
                        value={ocrResult}
                        onChange={(e) => setOcrResult(e.target.value)} 
                        readOnly={isLoading} 
                        placeholder="ผลลัพธ์ข้อความจะปรากฏที่นี่หลังจากการสแกน... (สามารถแก้ไขได้)"
                    />

                    <button 
                        onClick={copyToClipboard}
                        disabled={isLoading || ocrResult === 'ผลลัพธ์ข้อความที่สแกนจะปรากฏที่นี่...'}
                        className={`w-full py-3 rounded-xl font-extrabold transition-all duration-300 shadow-lg 
                            ${ocrResult === 'ผลลัพธ์ข้อความที่สแกนจะปรากฏที่นี่...' || isLoading
                                ? 'bg-emerald-300 cursor-not-allowed text-white' 
                                : 'bg-lime-500 text-gray-900 hover:bg-lime-600 transform hover:scale-[1.01] active:scale-[0.99] shadow-lime-400/50'}
                        `}
                    >
                        📋 คัดลอกข้อความ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OCRComponent;