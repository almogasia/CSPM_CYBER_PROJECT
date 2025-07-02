import React from "react";

const Logo = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg transform rotate-3 transition-transform hover:rotate-0">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-400 rounded-full animate-pulse"></div>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
          CSPM
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Cloud Security
        </span>
      </div>
    </div>
  );
};

export default Logo;
