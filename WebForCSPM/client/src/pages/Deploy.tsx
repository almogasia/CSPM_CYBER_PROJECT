import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CloudArrowUpIcon,
  ServerIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CpuChipIcon,
  CircleStackIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:5000/api";

interface DeploymentTarget {
  id: string;
  name: string;
  type: string;
  region: string;
  status: "active" | "inactive";
  lastDeployment?: string;
  resources: number;
  securityScore: number;
}

interface Deployment {
  _id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  deployment_type: string;
  status: string;
  timestamp: string;
}

interface DeploymentTemplate {
  id: string;
  name: string;
  description: string;
  type: "security" | "monitoring" | "compliance" | "custom";
  estimatedTime: string;
  resources: string[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const deploymentTargets: DeploymentTarget[] = [
  {
    id: "aws-prod",
    name: "AWS Production",
    type: "AWS",
    region: "us-east-1",
    status: "active",
    lastDeployment: "2024-03-24T10:30:00Z",
    resources: 45,
    securityScore: 92,
  },
  {
    id: "azure-dev",
    name: "Azure Development",
    type: "Azure",
    region: "eastus",
    status: "active",
    lastDeployment: "2024-03-24T10:25:00Z",
    resources: 28,
    securityScore: 87,
  },
  {
    id: "gcp-staging",
    name: "GCP Staging",
    type: "GCP",
    region: "us-central1",
    status: "inactive",
    lastDeployment: "2024-03-24T10:20:00Z",
    resources: 32,
    securityScore: 78,
  },
  {
    id: "aws-staging",
    name: "AWS Staging",
    type: "AWS",
    region: "us-west-2",
    status: "active",
    lastDeployment: "2024-03-24T09:45:00Z",
    resources: 18,
    securityScore: 85,
  },
  {
    id: "azure-prod",
    name: "Azure Production",
    type: "Azure",
    region: "westus2",
    status: "active",
    lastDeployment: "2024-03-24T08:30:00Z",
    resources: 67,
    securityScore: 94,
  },
];

const deploymentTemplates: DeploymentTemplate[] = [
  {
    id: "security-monitoring",
    name: "Security Monitoring Agent",
    description: "Deploy comprehensive security monitoring and threat detection",
    type: "security",
    estimatedTime: "5-10 minutes",
    resources: ["EC2", "CloudWatch", "S3", "IAM"],
    icon: ShieldCheckIcon,
  },
  {
    id: "log-collection",
    name: "Log Collection Service",
    description: "Centralized log collection and analysis infrastructure",
    type: "monitoring",
    estimatedTime: "3-7 minutes",
    resources: ["Lambda", "S3", "CloudTrail", "Kinesis"],
    icon: DocumentTextIcon,
  },
  {
    id: "compliance-scanner",
    name: "Compliance Scanner",
    description: "Automated compliance checking and reporting tools",
    type: "compliance",
    estimatedTime: "8-15 minutes",
    resources: ["Config", "GuardDuty", "SecurityHub", "CloudFormation"],
    icon: CheckCircleIcon,
  },
  {
    id: "network-monitoring",
    name: "Network Security Monitor",
    description: "Network traffic analysis and security monitoring",
    type: "security",
    estimatedTime: "6-12 minutes",
    resources: ["VPC", "Flow Logs", "WAF", "Shield"],
    icon: GlobeAltIcon,
  },
  {
    id: "data-protection",
    name: "Data Protection Suite",
    description: "Data encryption and protection mechanisms",
    type: "security",
    estimatedTime: "4-8 minutes",
    resources: ["KMS", "S3", "RDS", "Secrets Manager"],
    icon: CircleStackIcon,
  },
  {
    id: "performance-monitor",
    name: "Performance Monitor",
    description: "Application performance monitoring and optimization",
    type: "monitoring",
    estimatedTime: "3-6 minutes",
    resources: ["CloudWatch", "X-Ray", "APM", "Lambda"],
    icon: CpuChipIcon,
  },
];

const recentDeployments: Deployment[] = [
  {
    _id: "1",
    file_name: "security_config.yaml",
    file_type: "YAML",
    file_size: 45000,
    deployment_type: "Security",
    status: "completed",
    timestamp: "2024-03-24T10:30:00Z",
  },
  {
    _id: "2",
    file_name: "log_config.json",
    file_type: "JSON",
    file_size: 12000,
    deployment_type: "Monitoring",
    status: "in_progress",
    timestamp: "2024-03-24T10:25:00Z",
  },
  {
    _id: "3",
    file_name: "compliance_report.pdf",
    file_type: "PDF",
    file_size: 50000,
    deployment_type: "Compliance",
    status: "failed",
    timestamp: "2024-03-24T10:20:00Z",
  },
  {
    _id: "4",
    file_name: "network_policy.yaml",
    file_type: "YAML",
    file_size: 30000,
    deployment_type: "Security",
    status: "completed",
    timestamp: "2024-03-24T09:45:00Z",
  },
  {
    _id: "5",
    file_name: "data_encryption.yaml",
    file_type: "YAML",
    file_size: 20000,
    deployment_type: "Security",
    status: "completed",
    timestamp: "2024-03-24T08:30:00Z",
  },
];

export default function Deploy() {
  const [selectedTarget, setSelectedTarget] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/deployments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.data.success) {
        setDeployments(response.data.deployments);
      } else {
        setError("Failed to fetch deployments.");
      }
    } catch (err) {
      setError("Failed to fetch deployments.");
      console.error(err);
    }
  };

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDeploy = async () => {
    if (!file) {
      setError("Please select a file to deploy.");
      return;
    }

    setIsDeploying(true);
    
    try {
      const deploymentData = {
        file_name: file.name,
        file_type: file.type || 'Unknown',
        file_size: file.size,
        deployment_type: selectedTemplate || 'General'
      };

      const response = await axios.post(`${API_BASE_URL}/deploy`, deploymentData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.data.success) {
        // Add new deployment to the list
        setDeployments(prev => [response.data.deployment, ...prev]);
        setFile(null); // Clear file after deployment
        setError(null);
      } else {
        setError("Deployment failed. Please try again.");
      }
    } catch (err) {
      setError("Deployment failed. Please try again.");
      console.error(err);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDeployments();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Deployment Management
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

      {/* Deployment Targets */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Deployment Targets
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deploymentTargets.map((target) => (
            <button
              key={target.id}
              onClick={() => setSelectedTarget(target.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedTarget === target.id
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                    <ServerIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {target.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {target.type} • {target.region}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  target.status === "active" 
                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                }`}>
                  {target.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Resources:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                    {target.resources}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Security:</span>
                  <span className={`ml-1 font-medium ${getSecurityScoreColor(target.securityScore)}`}>
                    {target.securityScore}/100
                  </span>
                </div>
              </div>
              
              {target.lastDeployment && (
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Last deployed: {formatTimeAgo(target.lastDeployment)}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Deployment Templates */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Deployment Templates
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deploymentTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedTemplate === template.id
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                  <template.icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>⏱ {template.estimatedTime}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      template.type === "security" ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" :
                      template.type === "monitoring" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" :
                      template.type === "compliance" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" :
                      "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
                    }`}>
                      {template.type}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Deployment Configuration */}
      {selectedTarget && selectedTemplate && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Deployment Configuration
          </h2>
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Environment
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {deploymentTargets.find(t => t.id === selectedTarget)?.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {deploymentTargets.find(t => t.id === selectedTarget)?.type} • 
                    {deploymentTargets.find(t => t.id === selectedTarget)?.region}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {deploymentTemplates.find(t => t.id === selectedTemplate)?.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {deploymentTemplates.find(t => t.id === selectedTemplate)?.estimatedTime}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                {showAdvanced ? "Hide" : "Show"} Advanced Options
              </button>
              
              {showAdvanced && (
                <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Configuration File
                    </label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Environment Variables
                    </label>
                    <textarea
                      placeholder="KEY=value&#10;ANOTHER_KEY=another_value"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isDeploying
                  ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  : "bg-primary-600 hover:bg-primary-700 text-white"
              }`}
            >
              {isDeploying ? (
                <div className="flex items-center justify-center gap-2">
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  Deploying...
                </div>
              ) : (
                "Deploy Now"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Recent Deployments */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent Deployments
          </h2>
          <button className="text-sm text-primary-600 hover:text-primary-700">
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {deployments.map((deployment) => (
            <div key={deployment._id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                  <CloudArrowUpIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {deployment.file_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Type: {deployment.file_type}, Size: {deployment.file_size} bytes
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Deployment Type: {deployment.deployment_type} • Status: {deployment.status}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Timestamp: {formatTimeAgo(deployment.timestamp)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(deployment.status)}`}>
                  {deployment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deployment Statistics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Successful
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {deployments.filter(d => d.status === "completed").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                In Progress
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {deployments.filter(d => d.status === "in_progress").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Failed
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {deployments.filter(d => d.status === "failed").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <ServerIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Active Targets
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {deploymentTargets.filter(t => t.status === "active").length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
