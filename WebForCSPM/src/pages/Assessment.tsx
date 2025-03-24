import React, { useState } from "react";
import {
  CloudIcon,
  ServerIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const cloudProviders = [
  {
    id: "aws",
    name: "Amazon Web Services",
    icon: CloudIcon,
    color: "from-orange-500 to-orange-600",
    description:
      "Comprehensive cloud security assessment for AWS infrastructure",
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    icon: CloudIcon,
    color: "from-blue-500 to-blue-600",
    description: "Security evaluation for Azure cloud resources and services",
  },
  {
    id: "gcp",
    name: "Google Cloud Platform",
    icon: CloudIcon,
    color: "from-green-500 to-green-600",
    description: "GCP security assessment and compliance verification",
  },
];

const assessmentTypes = [
  {
    id: "infrastructure",
    name: "Infrastructure Security",
    icon: ServerIcon,
    description: "Evaluate network, compute, and storage security",
  },
  {
    id: "data",
    name: "Data Security",
    icon: CircleStackIcon,
    description: "Assess data protection and encryption measures",
  },
  {
    id: "compliance",
    name: "Compliance Check",
    icon: ShieldCheckIcon,
    description: "Verify compliance with security standards",
  },
];

export default function Assessment() {
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleStartAssessment = () => {
    setIsRunning(true);
    // Simulate assessment running
    setTimeout(() => {
      setIsRunning(false);
    }, 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Cloud Environment Assessment
        </h1>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
          <ArrowPathIcon className="h-5 w-5" />
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Select Cloud Provider
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {cloudProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              className={`relative flex flex-col items-start space-y-3 rounded-lg border p-4 hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 ${
                selectedProvider === provider.id
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <div
                className={`rounded-lg p-2 bg-gradient-to-r ${provider.color}`}
              >
                <provider.icon
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                  {provider.name}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {provider.description}
                </span>
              </div>
              {selectedProvider === provider.id && (
                <div className="absolute top-2 right-2">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedProvider && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Select Assessment Type
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {assessmentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`relative flex flex-col items-start space-y-3 rounded-lg border p-4 hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 ${
                  selectedType === type.id
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className="rounded-lg p-2 bg-primary-100 dark:bg-primary-900/20">
                  <type.icon
                    className="h-6 w-6 text-primary-600 dark:text-primary-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">
                    {type.name}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {type.description}
                  </span>
                </div>
                {selectedType === type.id && (
                  <div className="absolute top-2 right-2">
                    <CheckCircleIcon className="h-5 w-5 text-primary-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedProvider && selectedType && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Assessment Configuration
          </h2>
          <div className="space-y-6">
            <div>
              <label
                htmlFor="scope"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Assessment Scope
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="scope"
                  id="scope"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="e.g., us-east-1, eu-west-2"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="credentials"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Cloud Credentials
              </label>
              <div className="mt-1">
                <textarea
                  id="credentials"
                  name="credentials"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="Enter your cloud credentials (JSON format)"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleStartAssessment}
                disabled={isRunning}
                className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-colors ${
                  isRunning
                    ? "bg-primary-400 cursor-not-allowed"
                    : "bg-primary-600 hover:bg-primary-700"
                }`}
              >
                {isRunning ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Running Assessment...
                  </>
                ) : (
                  "Start Assessment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
