/**
 * Logo Component - CSPM platform branding and navigation
 * Displays animated logo with gradient styling and hover effects
 */

import React from "react";
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
}

const Logo = ({ className = "", showSubtitle = true }: LogoProps) => {
  return (
    <Link 
      to="/" 
      className={`flex items-center space-x-3 group transition-all duration-200 hover:scale-105 ${className}`}
    >
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-primary-600 to-blue-700 rounded-xl shadow-lg transform group-hover:rotate-0 rotate-3 transition-all duration-300 border border-blue-200 dark:border-blue-800">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-xl drop-shadow-sm">C</span>
          </div>
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-sm"></div>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-primary-600 to-blue-700 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-primary-700 transition-all duration-300">
          CSPM
        </span>
        {showSubtitle && (
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-200">
            Cloud Security Posture Management
          </span>
        )}
      </div>
    </Link>
  );
};

export default Logo;
