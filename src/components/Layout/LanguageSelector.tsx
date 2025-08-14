import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage, languages } from '../../contexts/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 text-gray-700 hover:text-blue-600 transition-colors rounded-md hover:bg-gray-100"
      >
        <Globe className="w-5 h-5" />
        <span className="text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                setLanguage(language);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                currentLanguage.code === language.code
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{language.nativeName}</span>
                <span className="text-xs text-gray-500">{language.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};