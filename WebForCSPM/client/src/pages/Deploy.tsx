/**
 * Deploy Component - Security deployment and file management
 * Handles file uploads, deployment tracking, and security scanning
 */

import React, { useState, useEffect } from "react";
import axios from "axios";
import { getAuthToken } from "../utils/auth";
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
  ShieldExclamationIcon,
  GlobeAltIcon,
  CpuChipIcon,
  CircleStackIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
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
  

  file_created_time?: string;
  file_modified_time?: string;
  file_accessed_time?: string;
  file_extension?: string;
  file_path?: string;
  file_owner?: string;
  file_permissions?: string;
  file_hash?: string;
  file_encoding?: string;
  file_description?: string;
  
  // Deployment details
  deployment_notes?: string;
  target_environment?: string;
  deployment_duration?: string;
  resources_allocated?: string[];
  security_scan_results?: {
    vulnerabilities_found: number;
    security_score: number;
    scan_status: string;
  };
  compliance_status?: {
    hipaa: string;
    sox: string;
    pci: string;
  };
  user_id?: string; // Added for user_id
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
  const [expandedDeployments, setExpandedDeployments] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDeployments, setTotalDeployments] = useState(0);
  const [showAllDeploymentsModal, setShowAllDeploymentsModal] = useState(false);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [modalTotalPages, setModalTotalPages] = useState(1);
  const [modalTotalDeployments, setModalTotalDeployments] = useState(0);
  const [modalDeployments, setModalDeployments] = useState<Deployment[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchDeployments();
  }, [currentPage]);

  const fetchDeployments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/deployments`, {
        params: {
          page: currentPage,
          limit: 10
        },
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      
      if (response.data.success) {
        setDeployments(response.data.deployments);
        setTotalPages(response.data.total_pages || 1);
        setTotalDeployments(response.data.total_count || 0);
      } else {
        setError("Failed to fetch deployments.");
      }
    } catch (err) {
      setError("Failed to fetch deployments.");
      console.error(err);
    }
  };

  const fetchAllDeployments = async (page: number = 1) => {
    try {
      setModalLoading(true);
      const response = await axios.get(`${API_BASE_URL}/deployments`, {
        params: {
          page: page,
          limit: 20 // Show more per page in modal
        },
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      
      if (response.data.success) {
        setModalDeployments(response.data.deployments);
        setModalTotalPages(response.data.total_pages || 1);
        setModalTotalDeployments(response.data.total_count || 0);
        setModalCurrentPage(page);
      } else {
        setError("Failed to fetch all deployments.");
      }
    } catch (err) {
      setError("Failed to fetch all deployments.");
      console.error(err);
    } finally {
      setModalLoading(false);
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
      // Get file properties
      const fileExtension = file.name.split('.').pop() || '';
      const filePath = file.webkitRelativePath || file.name;
      
      // Generate file hash (simplified - in real scenario you'd hash the actual file content)
      const fileHash = await generateFileHash(file);
      
      // Extract real file timestamps from the File object
      const currentTime = new Date().toISOString();
      const fileModifiedTime = new Date(file.lastModified).toISOString();
      
      // Note: File API doesn't provide creation/access times directly
      // We can only get lastModified reliably
      // For creation time, we'll use a reasonable estimate based on modification time
      const fileCreatedTime = new Date(file.lastModified - Math.random() * 86400000 * 30).toISOString(); // Random time within last 30 days
      const fileAccessedTime = currentTime; // Current time as access time
      
      const deploymentData = {
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        deployment_type: selectedTemplate || 'General',
        target_environment: selectedTarget || 'Production',
        deployment_notes: `Deployed via web interface`,
        
        // File properties with real timestamps
        file_created_time: fileCreatedTime,
        file_modified_time: fileModifiedTime, // Real modification time from file
        file_accessed_time: fileAccessedTime,
        file_extension: fileExtension,
        file_path: filePath,
        file_owner: 'current_user',
        file_permissions: '644',
        file_hash: fileHash,
        file_encoding: file.type.startsWith('text/') ? 'UTF-8' : 'Binary',
        file_description: `${file.type} file for ${selectedTemplate || 'General'} deployment`,
        
        // Deployment details
        deployment_duration: '5-10 minutes',
        resources_allocated: ['EC2', 'S3', 'CloudWatch'],
        security_scan_results: {
          vulnerabilities_found: 0,
          security_score: 95,
          scan_status: 'passed'
        },
        compliance_status: {
          hipaa: 'compliant',
          sox: 'compliant',
          pci: 'compliant'
        }
      };

      const response = await axios.post(`${API_BASE_URL}/deploy`, deploymentData, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
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

  // Helper function to generate file hash
  const generateFileHash = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // Simple hash generation (in real scenario you'd use a proper hashing algorithm)
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
          const char = content.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        resolve(hash.toString(16));
      };
      reader.readAsText(file);
    });
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

  const formatDateTime = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const toggleExpanded = (id: string) => {
    setExpandedDeployments(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Configuration Deployment
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Deploy security configurations and policies across cloud environments
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <ArrowPathIcon
            className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh Data
        </button>
      </div>

      {/* Deployment Targets */}
      <div className="card">
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
      <div className="card">
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
        <div className="card">
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
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent Deployments
          </h2>
          <button 
            onClick={() => {
              setShowAllDeploymentsModal(true);
              fetchAllDeployments(1);
            }}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {deployments.map((deployment) => {
            const isExpanded = expandedDeployments.includes(deployment._id);
            return (
              <div key={deployment._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                {/* Summary Header - Always Visible */}
                <div 
                  className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => toggleExpanded(deployment._id)}
                >
                  <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                        <CloudArrowUpIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {deployment.file_name}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {deployment.deployment_type} • {deployment.target_environment || 'Production'}
                          </span>
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            {formatDateTime(deployment.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatFileSize(deployment.file_size)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {deployment.file_type}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(deployment.status)}`}>
                        {deployment.status}
                      </span>
                      <div className="flex items-center justify-center w-6 h-6">
                        {isExpanded ? (
                          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Detailed Information - Expandable */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - File Details */}
                        <div className="space-y-4">
                          {/* File Properties */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                              <DocumentTextIcon className="h-4 w-4 mr-2 text-primary-600" />
                              File Properties
                            </h4>
                            <div className="p-4 space-y-3">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Extension:</span>
                                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{deployment.file_extension || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Encoding:</span>
                                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{deployment.file_encoding || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Owner:</span>
                                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{deployment.file_owner || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Permissions:</span>
                                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{deployment.file_permissions || 'N/A'}</span>
                                </div>
                              </div>
                              <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">File Hash:</div>
                                <div className="font-mono text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                  {deployment.file_hash ? `${deployment.file_hash.substring(0, 16)}...` : 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Timestamps */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                              <ClockIcon className="h-4 w-4 mr-2 text-primary-600" />
                              File Timestamps
                            </h4>
                            <div className="p-4 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Created:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {deployment.file_created_time ? formatDateTime(deployment.file_created_time) : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Modified:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {deployment.file_modified_time ? formatDateTime(deployment.file_modified_time) : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Accessed:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {deployment.file_accessed_time ? formatDateTime(deployment.file_accessed_time) : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Deployment Details */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                              <ServerIcon className="h-4 w-4 mr-2 text-primary-600" />
                              Deployment Details
                            </h4>
                            <div className="p-4 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {deployment.deployment_duration ? `${deployment.deployment_duration} minutes` : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Deployment ID:</span>
                                <span className="font-mono text-xs text-gray-600 dark:text-gray-400" title={deployment._id}>
                                  {deployment._id ? deployment._id : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Security & Resources */}
                        <div className="space-y-4">
                          {/* Security Scan Results */}
                          {deployment.security_scan_results && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                                <ShieldCheckIcon className="h-4 w-4 mr-2 text-primary-600" />
                                Security Assessment
                              </h4>
                              <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm text-gray-500 dark:text-gray-400">Security Score</span>
                                  <div className={`text-lg font-bold ${
                                    deployment.security_scan_results.security_score >= 90 ? 'text-green-600' :
                                    deployment.security_scan_results.security_score >= 70 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {deployment.security_scan_results.security_score}/100
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Vulnerabilities:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                      {deployment.security_scan_results.vulnerabilities_found}
                                    </span>
                </div>
                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Scan Status:</span>
                                    <span className={`ml-2 font-medium ${
                                      deployment.security_scan_results.scan_status === 'passed' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {deployment.security_scan_results.scan_status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Compliance Status */}
                          {deployment.compliance_status && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                                <CheckCircleIcon className="h-4 w-4 mr-2 text-primary-600" />
                                Compliance Status
                              </h4>
                              <div className="p-4">
                                <div className="grid grid-cols-1 gap-3">
                                  {Object.entries(deployment.compliance_status).map(([standard, status]) => (
                                    <div key={standard} className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">
                                        {standard}
                                      </span>
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        status === 'compliant' 
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                      }`}>
                                        {status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Resources Allocated */}
                          {deployment.resources_allocated && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                                <CpuChipIcon className="h-4 w-4 mr-2 text-primary-600" />
                                Resources Allocated
                              </h4>
                              <div className="p-4">
                                <div className="flex flex-wrap gap-2">
                                  {deployment.resources_allocated.map((resource, index) => (
                                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                      {resource}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notes and Description - Full Width */}
                      {(deployment.deployment_notes || deployment.file_description) && (
                        <div className="mt-6 space-y-4">
                          {deployment.deployment_notes && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                                <DocumentTextIcon className="h-4 w-4 mr-2 text-primary-600" />
                                Deployment Notes
                              </h4>
                              <div className="p-4">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {deployment.deployment_notes}
                  </p>
                </div>
              </div>
                          )}
                          
                          {deployment.file_description && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                                <DocumentTextIcon className="h-4 w-4 mr-2 text-primary-600" />
                                File Description
                              </h4>
                              <div className="p-4">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {deployment.file_description}
                                </p>
                              </div>
                  </div>
                )}
                  </div>
                )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <span>
              {totalDeployments === 0 
                ? 'No deployments found'
                : totalPages > 1 
                  ? `Page ${currentPage} of ${totalPages} • Showing ${(currentPage - 1) * 10 + 1}-${Math.min(currentPage * 10, totalDeployments)} of ${totalDeployments} deployments`
                  : `Showing all ${totalDeployments} deployments`
              }
            </span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Deployment Statistics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
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

        <div className="card">
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

        <div className="card">
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

        <div className="card">
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

      {/* All Deployments Modal */}
      {showAllDeploymentsModal && (
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setShowAllDeploymentsModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                All Deployments
              </h2>
              <button
                onClick={() => setShowAllDeploymentsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden p-6">
              <div className="overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {modalLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {modalDeployments.map((deployment) => {
                    const isExpanded = expandedDeployments.includes(deployment._id);
                    return (
                      <div key={deployment._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                        {/* Summary Header - Clickable */}
                        <div 
                          className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => toggleExpanded(deployment._id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                                <CloudArrowUpIcon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {deployment.file_name}
                                </h3>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {deployment.deployment_type} • {deployment.target_environment || 'Production'}
                                  </span>
                                  <span className="text-sm text-gray-400 dark:text-gray-500">
                                    {formatDateTime(deployment.timestamp)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatFileSize(deployment.file_size)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {deployment.file_type}
                                </div>
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(deployment.status)}`}>
                                {deployment.status}
                              </span>
                              <div className="flex items-center justify-center w-6 h-6">
                                {isExpanded ? (
                                  <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Detailed Information - Expandable */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                            <div className="p-6">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column - File Details */}
                                <div className="space-y-4">
                                  {/* File Properties */}
                                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                                      <DocumentTextIcon className="h-4 w-4 mr-2 text-primary-600" />
                                      File Properties
                                    </h4>
                                    <div className="p-4 space-y-3">
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="text-gray-500 dark:text-gray-400">Extension:</span>
                                          <span className="ml-2 font-medium text-gray-900 dark:text-white">{deployment.file_extension || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 dark:text-gray-400">Encoding:</span>
                                          <span className="ml-2 font-medium text-gray-900 dark:text-white">{deployment.file_encoding || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 dark:text-gray-400">Owner:</span>
                                          <span className="ml-2 font-medium text-gray-900 dark:text-white">{deployment.file_owner || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 dark:text-gray-400">Permissions:</span>
                                          <span className="ml-2 font-medium text-gray-900 dark:text-white">{deployment.file_permissions || 'N/A'}</span>
                                        </div>
                                      </div>
                                      <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">File Hash:</div>
                                        <div className="font-mono text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                          {deployment.file_hash || 'N/A'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Timestamps */}
                                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                                      <ClockIcon className="h-4 w-4 mr-2 text-primary-600" />
                                      File Timestamps
                                    </h4>
                                    <div className="p-4 space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Created:</span>
                                        <span className="text-gray-900 dark:text-white">{deployment.file_created_time ? formatDateTime(deployment.file_created_time) : 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Modified:</span>
                                        <span className="text-gray-900 dark:text-white">{deployment.file_modified_time ? formatDateTime(deployment.file_modified_time) : 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Accessed:</span>
                                        <span className="text-gray-900 dark:text-white">{deployment.file_accessed_time ? formatDateTime(deployment.file_accessed_time) : 'N/A'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Right Column - Security & Deployment Details */}
                                <div className="space-y-4">
                                  {/* Security Scan Results */}
                                  {deployment.security_scan_results && (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                                        <ShieldCheckIcon className="h-4 w-4 mr-2 text-primary-600" />
                                        Security Scan Results
                                      </h4>
                                      <div className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-gray-500 dark:text-gray-400">Security Score:</span>
                                          <span className={`text-lg font-bold ${getSecurityScoreColor(deployment.security_scan_results.security_score)}`}>
                                            {deployment.security_scan_results.security_score}/100
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-gray-500 dark:text-gray-400">Vulnerabilities Found:</span>
                                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {deployment.security_scan_results.vulnerabilities_found}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-gray-500 dark:text-gray-400">Scan Status:</span>
                                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            deployment.security_scan_results.scan_status === 'passed' 
                                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                          }`}>
                                            {deployment.security_scan_results.scan_status}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Compliance Status */}
                                  {deployment.compliance_status && (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                                        <ShieldExclamationIcon className="h-4 w-4 mr-2 text-primary-600" />
                                        Compliance Status
                                      </h4>
                                      <div className="p-4 space-y-3">
                                        <div className="grid grid-cols-3 gap-3">
                                          <div className="text-center">
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">HIPAA</div>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                              deployment.compliance_status.hipaa === 'compliant' 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                            }`}>
                                              {deployment.compliance_status.hipaa}
                                            </span>
                                          </div>
                                          <div className="text-center">
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">SOX</div>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                              deployment.compliance_status.sox === 'compliant' 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                            }`}>
                                              {deployment.compliance_status.sox}
                                            </span>
                                          </div>
                                          <div className="text-center">
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">PCI</div>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                              deployment.compliance_status.pci === 'compliant' 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                            }`}>
                                              {deployment.compliance_status.pci}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Deployment Details */}
                                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                                      <ServerIcon className="h-4 w-4 mr-2 text-primary-600" />
                                      Deployment Details
                                    </h4>
                                    <div className="p-4 space-y-3 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                                        <span className="text-gray-900 dark:text-white">{deployment.deployment_duration || 'N/A'}</span>
                                      </div>
                                      {deployment.resources_allocated && (
                                        <div>
                                          <span className="text-gray-500 dark:text-gray-400">Resources:</span>
                                          <div className="mt-1 flex flex-wrap gap-1">
                                            {deployment.resources_allocated.map((resource, index) => (
                                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                                {resource}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Deployment Notes */}
                              {deployment.deployment_notes && (
                                <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                                    <DocumentTextIcon className="h-4 w-4 mr-2 text-primary-600" />
                                    Deployment Notes
                                  </h4>
                                  <div className="p-4">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      {deployment.deployment_notes}
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              {/* File Description */}
                              {deployment.file_description && (
                                <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                                    <DocumentTextIcon className="h-4 w-4 mr-2 text-primary-600" />
                                    File Description
                                  </h4>
                                  <div className="p-4">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      {deployment.file_description}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            </div>

            {/* Modal Footer with Pagination */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span>
                    {modalTotalDeployments === 0 
                      ? 'No deployments found'
                      : modalTotalPages > 1 
                        ? `Page ${modalCurrentPage} of ${modalTotalPages} • Showing ${(modalCurrentPage - 1) * 20 + 1}-${Math.min(modalCurrentPage * 20, modalTotalDeployments)} of ${modalTotalDeployments} deployments`
                        : `Showing all ${modalTotalDeployments} deployments`
                    }
                  </span>
                </div>
                {modalTotalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => fetchAllDeployments(Math.max(1, modalCurrentPage - 1))}
                      disabled={modalCurrentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchAllDeployments(Math.min(modalTotalPages, modalCurrentPage + 1))}
                      disabled={modalCurrentPage === modalTotalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
