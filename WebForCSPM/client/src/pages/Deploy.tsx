import React, { useState } from "react";
import {
  CloudArrowUpIcon,
  ServerIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface DeploymentTarget {
  id: string;
  name: string;
  type: string;
  region: string;
  status: "active" | "inactive";
  lastDeployment?: string;
}

interface Deployment {
  id: number;
  name: string;
  target: string;
  status: "completed" | "in_progress" | "failed";
  timestamp: string;
  progress?: number;
}

const deploymentTargets: DeploymentTarget[] = [
  {
    id: "aws-prod",
    name: "AWS Production",
    type: "AWS",
    region: "us-east-1",
    status: "active",
    lastDeployment: "2024-03-24T10:30:00Z",
  },
  {
    id: "azure-dev",
    name: "Azure Development",
    type: "Azure",
    region: "eastus",
    status: "active",
    lastDeployment: "2024-03-24T10:25:00Z",
  },
  {
    id: "gcp-staging",
    name: "GCP Staging",
    type: "GCP",
    region: "us-central1",
    status: "inactive",
    lastDeployment: "2024-03-24T10:20:00Z",
  },
];

const recentDeployments: Deployment[] = [
  {
    id: 1,
    name: "Security Monitoring Agent",
    target: "AWS Production",
    status: "completed",
    timestamp: "2024-03-24T10:30:00Z",
  },
  {
    id: 2,
    name: "Log Collection Service",
    target: "Azure Development",
    status: "in_progress",
    timestamp: "2024-03-24T10:25:00Z",
    progress: 65,
  },
  {
    id: 3,
    name: "Compliance Scanner",
    target: "GCP Staging",
    status: "failed",
    timestamp: "2024-03-24T10:20:00Z",
  },
];

export default function Deploy() {
  const [selectedTarget, setSelectedTarget] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    // Simulate deployment
    setTimeout(() => {
      setIsDeploying(false);
    }, 3000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Deploy
        </h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <ArrowPathIcon
            className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Deployment Targets
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deploymentTargets.map((target) => (
            <button
              key={target.id}
              onClick={() => setSelectedTarget(target.id)}
              className={`relative flex items-start space-x-3 rounded-lg border p-4 hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 ${
                selectedTarget === target.id
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <div className="flex-shrink-0">
                <div
                  className={`rounded-lg p-2 ${
                    target.type === "AWS"
                      ? "bg-orange-100 dark:bg-orange-900/20"
                      : target.type === "Azure"
                      ? "bg-blue-100 dark:bg-blue-900/20"
                      : "bg-green-100 dark:bg-green-900/20"
                  }`}
                >
                  <ServerIcon
                    className={`h-6 w-6 ${
                      target.type === "AWS"
                        ? "text-orange-600 dark:text-orange-400"
                        : target.type === "Azure"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                  {target.name}
                </span>
                <span className="block text-sm text-gray-500 dark:text-gray-400">
                  {target.type} • {target.region}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    target.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400"
                  }`}
                >
                  {target.status}
                </span>
                {target.lastDeployment && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Last deployment:{" "}
                    {new Date(target.lastDeployment).toLocaleString()}
                  </p>
                )}
              </div>
              {selectedTarget === target.id && (
                <div className="absolute top-2 right-2">
                  <CheckCircleIcon className="h-5 w-5 text-primary-600" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedTarget && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Deploy File
          </h2>
          <div className="space-y-6">
            <div>
              <label
                htmlFor="file-upload"
                className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 text-center hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
              >
                <div className="text-center">
                  <CloudArrowUpIcon
                    className="mx-auto h-12 w-12 text-gray-400"
                    aria-hidden="true"
                  />
                  <div className="mt-4 flex text-sm leading-6 text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white dark:bg-gray-800 font-semibold text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 hover:text-primary-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
                    Any file type up to 10MB
                  </p>
                </div>
              </label>
              {file && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Selected file: {file.name}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleDeploy}
                disabled={!file || isDeploying}
                className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-colors ${
                  isDeploying || !file
                    ? "bg-primary-400 cursor-not-allowed"
                    : "bg-primary-600 hover:bg-primary-700"
                }`}
              >
                {isDeploying ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  "Deploy"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Recent Deployments
        </h2>
        <div className="flow-root">
          <ul
            role="list"
            className="-my-5 divide-y divide-gray-200 dark:divide-gray-700"
          >
            {recentDeployments.map((deployment) => (
              <li
                key={deployment.id}
                className="py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-lg px-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon
                      className="h-6 w-6 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {deployment.name}
                    </p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      {deployment.target} •{" "}
                      {new Date(deployment.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {deployment.progress && (
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 transition-all duration-500"
                          style={{ width: `${deployment.progress}%` }}
                        />
                      </div>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        deployment.status === "completed"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : deployment.status === "in_progress"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      {deployment.status === "completed" ? (
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                      ) : deployment.status === "in_progress" ? (
                        <ClockIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 mr-1" />
                      )}
                      {deployment.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
