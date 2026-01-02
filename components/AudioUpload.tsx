
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
      className="group cursor-pointer p-1 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 hover:from-blue-500/40 hover:to-purple-500/40 transition-all"
    >
      <div className="bg-neutral-900/80 backdrop-blur rounded-xl px-8 py-4 border border-white/5 flex items-center gap-3">
        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="font-semibold text-sm">Select Audio File</span>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="audio/*" 
          onChange={handleChange} 
          className="hidden" 
        />
      </div>
    </div>
  );
};

export default AudioUpload;
