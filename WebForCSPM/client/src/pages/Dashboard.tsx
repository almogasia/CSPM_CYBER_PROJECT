import React from "react";
import {
  CloudArrowUpIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

const stats = [
  {
    name: "Total Assessments",
    value: "12",
    change: "+2.5%",
    trend: "up",
    icon: ClipboardDocumentCheckIcon,
  },
  {
    name: "Active Logs",
    value: "2,543",
    change: "+12.3%",
    trend: "up",
    icon: DocumentTextIcon,
  },
  {
    name: "Deployments",
    value: "8",
    change: "-1.2%",
    trend: "down",
    icon: CloudArrowUpIcon,
  },
  {
    name: "Security Issues",
    value: "3",
    change: "-5.0%",
    trend: "up",
    icon: ExclamationTriangleIcon,
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            New Assessment
          </button>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-12 pt-5 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <dt>
              <div className="absolute rounded-md bg-primary-500 p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                {item.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {item.value}
              </p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  item.trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {item.trend === "up" ? (
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                )}
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Assessments
            </h2>
            <button className="text-sm text-primary-600 hover:text-primary-700">
              View All
            </button>
          </div>
          <div className="flow-root">
            <ul
              role="list"
              className="-my-5 divide-y divide-gray-200 dark:divide-gray-700"
            >
              <li className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <ClipboardDocumentCheckIcon
                        className="h-6 w-6 text-primary-600 dark:text-primary-400"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      AWS Infrastructure Assessment
                    </p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      Completed 2 days ago
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                      Completed
                    </span>
                  </div>
                </div>
              </li>
              <li className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <ClipboardDocumentCheckIcon
                        className="h-6 w-6 text-primary-600 dark:text-primary-400"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      Azure Security Review
                    </p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      Completed 5 days ago
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                      Completed
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Deployments
            </h2>
            <button className="text-sm text-primary-600 hover:text-primary-700">
              View All
            </button>
          </div>
          <div className="flow-root">
            <ul
              role="list"
              className="-my-5 divide-y divide-gray-200 dark:divide-gray-700"
            >
              <li className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <CloudArrowUpIcon
                        className="h-6 w-6 text-primary-600 dark:text-primary-400"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      Security Monitoring Agent
                    </p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      Deployed 1 day ago
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
                      Active
                    </span>
                  </div>
                </div>
              </li>
              <li className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <CloudArrowUpIcon
                        className="h-6 w-6 text-primary-600 dark:text-primary-400"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      Log Collection Service
                    </p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      Deployed 3 days ago
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
                      Active
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
