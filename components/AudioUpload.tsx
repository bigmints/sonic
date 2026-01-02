
import React, { useRef } from 'react';

interface Props {
  onFileSelect: (file: File) => void;
}

const AudioUpload: React.FC<Props> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div 
      onClick={() => fileInputRef.current?.click()}
      className="bg-[#15151b] border border-[#2a2a3a] rounded-xl px-12 py-5 flex items-center gap-4 hover:bg-[#1c1c25] hover:border-blue-500/50 transition-all cursor-pointer group shadow-2xl"
    >
      <div className="w-5 h-5 flex items-center justify-center">
        <svg className="w-4 h-4 text-blue-400 group-hover:scale-125 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <span className="font-bold text-base uppercase tracking-widest text-white/90">Select Audio File</span>
      <input 
        ref={fileInputRef}
        type="file" 
        accept="audio/*" 
        onChange={handleChange} 
        className="hidden" 
      />
    </div>
  );
};

export default AudioUpload;
