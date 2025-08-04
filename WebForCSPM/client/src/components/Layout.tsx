/**
 * Layout Component - Main application layout with sidebar navigation
 * Provides responsive sidebar, navigation menu, and user interface framework
 */

import React, { Fragment, useState, useEffect } from "react";
import { Dialog, Menu, Transition } from "@headlessui/react";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  InformationCircleIcon,
  CubeIcon,
  ShieldCheckIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";

const navigation = [
  // Main Dashboard
  { name: "Dashboard", href: "/", icon: HomeIcon },
  
  // Security Monitoring
  { name: "Security Monitoring", icon: ShieldCheckIcon, children: [
    { name: "Security Logs", href: "/logs", icon: DocumentTextIcon },
    { name: "Urgent Issues", href: "/urgent-issues", icon: ExclamationTriangleIcon },
    { name: "Threat Clustering", href: "/threat-clustering", icon: CubeIcon },
  ]},
  
  // Analytics & Reporting
  { name: "Analytics & Reporting", icon: ChartBarIcon, children: [
    { name: "Security Analytics", href: "/analytics", icon: ChartBarIcon },
    { name: "AI Model Evaluation", href: "/model", icon: ClipboardDocumentListIcon },
  ]},
  
  // Security Operations
  { name: "Security Operations", icon: CogIcon, children: [
    { name: "Security Assessment", href: "/assessment", icon: ClipboardDocumentListIcon },
    { name: "Configuration Deployment", href: "/deploy", icon: CloudArrowUpIcon },
    { name: "Tickets", href: "/tickets", icon: DocumentTextIcon },
  ]},
  
  // Administration
  { name: "Administration", icon: UserGroupIcon, children: [
    { name: "User Management", href: "/users", icon: UserGroupIcon },
    { name: "System Information", href: "/info", icon: InformationCircleIcon },
  ]},
];

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  username: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Layout({
  children,
  onLogout,
  username,
  isDarkMode,
  toggleDarkMode,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const location = useLocation();

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <Logo />
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          {item.children ? (
                            <div>
                              <button
                                onClick={() => toggleCategory(item.name)}
                                className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 dark:text-gray-300 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <item.icon
                                  className="h-6 w-6 shrink-0"
                                  aria-hidden="true"
                                />
                                {item.name}
                              </button>
                              {expandedCategories[item.name] && (
                                <ul className="pl-6">
                                  {item.children.map((child) => (
                                    <li key={child.name}>
                                      <Link
                                        to={child.href}
                                        className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 dark:text-gray-300 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                      >
                                        <child.icon
                                          className="h-6 w-6 shrink-0"
                                          aria-hidden="true"
                                        />
                                        {child.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ) : (
                            <Link
                              to={item.href}
                              className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                                location.pathname === item.href
                                  ? "bg-gray-50 dark:bg-gray-700 text-primary-600"
                                  : "text-gray-700 dark:text-gray-300 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                            >
                              <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                              {item.name}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Logo />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              {navigation.map((item) => (
                <li key={item.name}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => toggleCategory(item.name)}
                        className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 dark:text-gray-300 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                        {item.name}
                      </button>
                      {expandedCategories[item.name] && (
                        <ul className="pl-6">
                          {item.children.map((child) => (
                            <li key={child.name}>
                              <Link
                                to={child.href}
                                className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 dark:text-gray-300 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <child.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                        location.pathname === item.href
                          ? "bg-gray-50 dark:bg-gray-700 text-primary-600"
                          : "text-gray-700 dark:text-gray-300 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-64">
        {/* Professional Top Bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 shadow-lg sm:gap-x-6 sm:px-6 lg:px-8 lg:pl-0">
          {/* Mobile menu button */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            
            {/* Right side controls */}
            <div className="flex items-center gap-x-3 lg:gap-x-4">
              {/* User welcome message */}
              <div className="hidden sm:flex items-center gap-x-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium">Welcome, {username}</span>
              </div>
              
              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
              
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <SunIcon className="h-5 w-5 text-yellow-400" />
                ) : (
                  <MoonIcon className="h-5 w-5 text-gray-600" />
                )}
              </button>
              
              {/* Logout button */}
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}