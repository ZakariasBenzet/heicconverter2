
import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/solid';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-100 py-4">
      <div className="container mx-auto px-4 flex items-center justify-between max-w-6xl">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">LiveHEIC</h1>
            <p className="text-xs text-gray-500 font-medium">Batch Converter</p>
          </div>
        </div>
        
        <nav className="hidden sm:flex items-center gap-6">
          <a href="#" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">How it works</a>
          <a href="#" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Privacy</a>
          <div className="h-4 w-px bg-gray-200"></div>
          <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">v1.0.0</span>
        </nav>
      </div>
    </header>
  );
};

export default Header;
