import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
} from "chart.js";
import { Pie, Line, Bar } from "react-chartjs-2";
import {
  ShieldExclamationIcon,
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
);

interface LogEvent {
  _id: string;
  event_name: string;
  source_ip: string;
  user_identity_user_name: string;
  aws_region: string;
  risk_score: number;
  risk_level: string;
  timestamp: string;
  user_identity_type: string;
  error_code: string;
}

interface Cluster {
  id: number;
  centroid: number[];
  events: LogEvent[];
  threat_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  attack_type: string;
  confidence: number;
  size: number;
  time_span: string;
  geographic_spread: string[];
  user_targets: string[];
}

interface ClusteringResult {
  clusters: Cluster[];
  total_events: number;
  algorithm_metrics: {
    silhouette_score: number;
    within_cluster_variance: number;
    between_cluster_variance: number;
    processing_time: number;
  };
  threat_analysis: {
    total_threats: number;
    high_risk_clusters: number;
    attack_campaigns: number;
    geographic_origins: string[];
  };
}

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function ThreatClustering() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [clusteringResult, setClusteringResult] = useState<ClusteringResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [algorithmParams, setAlgorithmParams] = useState({
    k: 5,
    minClusterSize: 3,
    similarityThreshold: 0.7,
    timeWindow: 24, // hours
  });

  // K-Means Clustering Algorithm Implementation
  const kMeansClustering = (data: number[][], k: number, maxIterations: number = 100): { clusters: number[], centroids: number[][] } => {
    const n = data.length;
    const d = data[0].length;
    
    // Initialize centroids randomly
    let centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * n);
      centroids.push([...data[randomIndex]]);
    }
    
    let clusters: number[] = new Array(n).fill(0);
    let iterations = 0;
    let converged = false;
    
    while (!converged && iterations < maxIterations) {
      iterations++;
      let newClusters: number[] = new Array(n).fill(0);
      let clusterSums: number[][] = Array(k).fill(null).map(() => Array(d).fill(0));
      let clusterCounts: number[] = new Array(k).fill(0);
      
      // Assign points to nearest centroid
      for (let i = 0; i < n; i++) {
        let minDistance = Infinity;
        let bestCluster = 0;
        
        for (let j = 0; j < k; j++) {
          const distance = euclideanDistance(data[i], centroids[j]);
          if (distance < minDistance) {
            minDistance = distance;
            bestCluster = j;
          }
        }
        
        newClusters[i] = bestCluster;
        clusterCounts[bestCluster]++;
        for (let dim = 0; dim < d; dim++) {
          clusterSums[bestCluster][dim] += data[i][dim];
        }
      }
      
      // Update centroids
      const newCentroids: number[][] = [];
      for (let i = 0; i < k; i++) {
        if (clusterCounts[i] > 0) {
          const centroid = clusterSums[i].map(sum => sum / clusterCounts[i]);
          newCentroids.push(centroid);
        } else {
          newCentroids.push([...centroids[i]]);
        }
      }
      
      // Check convergence
      converged = arraysEqual(clusters, newClusters);
      clusters = newClusters;
      centroids = newCentroids;
    }
    
    return { clusters, centroids };
  };

  // Helper functions for clustering
  const euclideanDistance = (a: number[], b: number[]): number => {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  };

  const arraysEqual = (a: number[], b: number[]): boolean => {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  };

  // Feature extraction for clustering
  const extractFeatures = (events: LogEvent[]): number[][] => {
    return events.map((event, index) => {
      try {
        // Validate required fields
        if (typeof event.risk_score !== 'number' || isNaN(event.risk_score)) {
          console.warn(`Invalid risk_score for event ${index}:`, event.risk_score);
          event.risk_score = 0;
        }
        
        if (!event.timestamp) {
          console.warn(`Missing timestamp for event ${index}`);
          event.timestamp = new Date().toISOString();
        }
        
        // Normalize features for clustering
        const riskScore = Math.max(0, Math.min(1, event.risk_score / 100)); // Normalize to 0-1, clamp values
        const timestamp = new Date(event.timestamp).getTime() / (24 * 60 * 60 * 1000); // Days since epoch
        const regionHash = hashString(event.aws_region || 'unknown') / 1000; // Normalize region hash
        const userTypeHash = hashString(event.user_identity_type || 'unknown') / 1000; // Normalize user type hash
        const errorHash = hashString(event.error_code || 'NoError') / 1000; // Normalize error hash
        
        return [riskScore, timestamp, regionHash, userTypeHash, errorHash];
      } catch (error) {
        console.error(`Error extracting features for event ${index}:`, error, event);
        // Return default feature vector for this event
        return [0, 0, 0, 0, 0];
      }
    });
  };

  const hashString = (str: string): number => {
    if (!str || typeof str !== 'string') {
      return 0;
    }
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };

  // Threat analysis algorithm
  const analyzeThreats = (clusters: Cluster[]): any => {
    const threatAnalysis = {
      total_threats: 0,
      high_risk_clusters: 0,
      attack_campaigns: 0,
      geographic_origins: new Set<string>(),
    };

    clusters.forEach(cluster => {
      if (cluster.threat_level === 'HIGH' || cluster.threat_level === 'CRITICAL') {
        threatAnalysis.high_risk_clusters++;
      }
      
      if (cluster.size >= 5) { // Campaign threshold
        threatAnalysis.attack_campaigns++;
      }
      
      cluster.geographic_spread.forEach(region => {
        threatAnalysis.geographic_origins.add(region);
      });
      
      threatAnalysis.total_threats += cluster.size;
    });

    return {
      ...threatAnalysis,
      geographic_origins: Array.from(threatAnalysis.geographic_origins),
    };
  };

  // Main clustering algorithm
  const performClustering = async () => {
    if (logs.length === 0) {
      alert("No logs available for clustering. Please fetch logs first.");
      return;
    }

    if (logs.length < algorithmParams.k) {
      alert(`Not enough logs for clustering. Need at least ${algorithmParams.k} logs, but only have ${logs.length}.`);
      return;
    }

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      console.log("Starting clustering with", logs.length, "logs");
      
      // Extract features from logs
      const features = extractFeatures(logs);
      console.log("Extracted features:", features.length, "feature vectors");
      
      // Perform K-Means clustering
      const { clusters: clusterAssignments, centroids } = kMeansClustering(
        features, 
        algorithmParams.k
      );
      
      console.log("K-means clustering completed. Found", centroids.length, "centroids");

      // Group events by cluster
      const clusterGroups: { [key: number]: LogEvent[] } = {};
      clusterAssignments.forEach((clusterId, eventIndex) => {
        if (!clusterGroups[clusterId]) {
          clusterGroups[clusterId] = [];
        }
        clusterGroups[clusterId].push(logs[eventIndex]);
      });

      console.log("Cluster groups:", Object.keys(clusterGroups).length, "clusters");

      // Analyze each cluster
      const analyzedClusters: Cluster[] = Object.entries(clusterGroups)
        .filter(([_, events]) => events.length >= algorithmParams.minClusterSize)
        .map(([clusterId, events]) => {
          const avgRiskScore = events.reduce((sum, e) => sum + e.risk_score, 0) / events.length;
          const threatLevel = avgRiskScore > 80 ? 'CRITICAL' : 
                             avgRiskScore > 60 ? 'HIGH' : 
                             avgRiskScore > 40 ? 'MEDIUM' : 'LOW';
          
          const regions = [...new Set(events.map(e => e.aws_region))];
          const users = [...new Set(events.map(e => e.user_identity_user_name).filter(Boolean))];
          
          const timeSpan = calculateTimeSpan(events);
          const attackType = determineAttackType(events);
          const confidence = calculateConfidence(events, avgRiskScore);

          return {
            id: parseInt(clusterId),
            centroid: centroids[parseInt(clusterId)],
            events,
            threat_level: threatLevel,
            attack_type: attackType,
            confidence,
            size: events.length,
            time_span: timeSpan,
            geographic_spread: regions,
            user_targets: users,
          };
        });

      console.log("Analyzed clusters:", analyzedClusters.length, "clusters after filtering");

      const processingTime = Date.now() - startTime;
      
      // Calculate algorithm metrics
      const silhouetteScore = calculateSilhouetteScore(features, clusterAssignments);
      const withinClusterVariance = calculateWithinClusterVariance(features, clusterAssignments, centroids);
      const betweenClusterVariance = calculateBetweenClusterVariance(centroids);

      const result: ClusteringResult = {
        clusters: analyzedClusters,
        total_events: logs.length,
        algorithm_metrics: {
          silhouette_score: silhouetteScore,
          within_cluster_variance: withinClusterVariance,
          between_cluster_variance: betweenClusterVariance,
          processing_time: processingTime,
        },
        threat_analysis: analyzeThreats(analyzedClusters),
      };

      console.log("Clustering completed successfully:", result);
      setClusteringResult(result);
    } catch (error: any) {
      console.error("Clustering error:", error);
      console.error("Error stack:", error.stack);
      
      let errorMessage = "Error performing clustering analysis";
      if (error.message) {
        errorMessage += ": " + error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper functions for analysis
  const calculateTimeSpan = (events: LogEvent[]): string => {
    const timestamps = events.map(e => new Date(e.timestamp).getTime()).sort();
    const duration = timestamps[timestamps.length - 1] - timestamps[0];
    const hours = Math.floor(duration / (1000 * 60 * 60));
    return `${hours} hours`;
  };

  const determineAttackType = (events: LogEvent[]): string => {
    const eventTypes = events.map(e => e.event_name);
    const errorCount = events.filter(e => e.error_code !== 'NoError').length;
    const rootUserCount = events.filter(e => e.user_identity_type === 'Root').length;
    
    if (errorCount > events.length * 0.5) return "Brute Force Attack";
    if (rootUserCount > events.length * 0.3) return "Privilege Escalation";
    if (eventTypes.includes('DeleteUser') || eventTypes.includes('DeleteRole')) return "Destructive Attack";
    if (eventTypes.includes('CreateUser') || eventTypes.includes('CreateRole')) return "Account Creation Attack";
    return "Suspicious Activity";
  };

  const calculateConfidence = (events: LogEvent[], avgRiskScore: number): number => {
    const riskVariance = events.reduce((sum, e) => sum + Math.pow(e.risk_score - avgRiskScore, 2), 0) / events.length;
    const consistencyScore = Math.max(0, 100 - riskVariance);
    const sizeScore = Math.min(100, events.length * 10);
    return Math.round((consistencyScore + sizeScore) / 2);
  };

  const calculateSilhouetteScore = (features: number[][], clusters: number[]): number => {
    // Simplified silhouette score calculation
    let totalSilhouette = 0;
    const uniqueClusters = [...new Set(clusters)];
    
    for (let i = 0; i < features.length; i++) {
      const currentCluster = clusters[i];
      const sameClusterPoints = features.filter((_, idx) => clusters[idx] === currentCluster && idx !== i);
      const otherClusterPoints = features.filter((_, idx) => clusters[idx] !== currentCluster);
      
      if (sameClusterPoints.length === 0 || otherClusterPoints.length === 0) continue;
      
      const a = sameClusterPoints.reduce((sum, point) => sum + euclideanDistance(features[i], point), 0) / sameClusterPoints.length;
      const b = otherClusterPoints.reduce((sum, point) => sum + euclideanDistance(features[i], point), 0) / otherClusterPoints.length;
      
      totalSilhouette += (b - a) / Math.max(a, b);
    }
    
    return Math.round((totalSilhouette / features.length) * 100);
  };

  const calculateWithinClusterVariance = (features: number[][], clusters: number[], centroids: number[][]): number => {
    let totalVariance = 0;
    for (let i = 0; i < features.length; i++) {
      const clusterId = clusters[i];
      const distance = euclideanDistance(features[i], centroids[clusterId]);
      totalVariance += distance * distance;
    }
    return Math.round(totalVariance / features.length);
  };

  const calculateBetweenClusterVariance = (centroids: number[][]): number => {
    let totalVariance = 0;
    let count = 0;
    
    for (let i = 0; i < centroids.length; i++) {
      for (let j = i + 1; j < centroids.length; j++) {
        const distance = euclideanDistance(centroids[i], centroids[j]);
        totalVariance += distance * distance;
        count++;
      }
    }
    
    return count > 0 ? Math.round(totalVariance / count) : 0;
  };

  // Fetch logs for clustering
  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("No authentication token found. Please log in again.");
        return;
      }

      console.log("Fetching logs from:", `${API_BASE_URL}/logs?limit=1000`);
      
      const response = await axios.get(`${API_BASE_URL}/logs?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Logs response:", response.data);
      
      if (response.data.success) {
        // Map the database fields to the expected interface
        const mappedLogs = response.data.logs.map((log: any) => ({
          _id: log._id,
          event_name: log.event_name,
          source_ip: log.source_ip,
          user_identity_user_name: log.userIdentityuserName || log.user_identity_user_name || 'Unknown',
          aws_region: log.awsRegion || log.aws_region || 'Unknown',
          risk_score: log.risk_score,
          risk_level: log.risk_level,
          timestamp: log.timestamp,
          user_identity_type: log.user_identity_type,
          error_code: log.errorCode || log.error_code || 'NoError'
        }));
        
        console.log("Mapped logs:", mappedLogs.length, "logs found");
        setLogs(mappedLogs);
      } else {
        console.error("API returned success: false", response.data);
        alert("Failed to fetch logs: " + (response.data.error || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error fetching logs:", error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);
        alert(`Error fetching logs: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        alert("Error fetching logs: No response from server. Please check your connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error setting up request:", error.message);
        alert("Error fetching logs: " + error.message);
      }
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Chart data for visualizations
  const getClusterChartData = () => {
    if (!clusteringResult) return null;

    const clusterSizes = clusteringResult.clusters.map(c => c.size);
    const clusterLabels = clusteringResult.clusters.map(c => `Cluster ${c.id}`);
    const clusterColors = clusteringResult.clusters.map(c => {
      switch (c.threat_level) {
        case 'CRITICAL': return '#DC2626';
        case 'HIGH': return '#EA580C';
        case 'MEDIUM': return '#D97706';
        case 'LOW': return '#059669';
        default: return '#6B7280';
      }
    });

    return {
      labels: clusterLabels,
      datasets: [{
        data: clusterSizes,
        backgroundColor: clusterColors,
        borderColor: clusterColors.map(c => c + '80'),
        borderWidth: 2,
      }]
    };
  };

  const getThreatLevelChartData = () => {
    if (!clusteringResult) return null;

    const threatLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const counts = threatLevels.map(level => 
      clusteringResult.clusters.filter(c => c.threat_level === level).length
    );

    return {
      labels: threatLevels,
      datasets: [{
        data: counts,
        backgroundColor: ['#059669', '#D97706', '#EA580C', '#DC2626'],
        borderColor: ['#047857', '#B45309', '#C2410C', '#B91C1C'],
        borderWidth: 2,
      }]
    };
  };

  const getAttackTypeChartData = () => {
    if (!clusteringResult) return null;

    const attackTypes = [...new Set(clusteringResult.clusters.map(c => c.attack_type))];
    const counts = attackTypes.map(type => 
      clusteringResult.clusters.filter(c => c.attack_type === type).length
    );

    return {
      labels: attackTypes,
      datasets: [{
        data: counts,
        backgroundColor: ['#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B'],
        borderColor: ['#2563EB', '#7C3AED', '#DC2626', '#059669', '#D97706'],
        borderWidth: 1,
      }]
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Threat Clustering Analysis
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Advanced clustering algorithm for threat intelligence and attack pattern detection
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        {/* Algorithm Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Clustering Algorithm Parameters
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Clusters (K)
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={algorithmParams.k}
                onChange={(e) => setAlgorithmParams(prev => ({ ...prev, k: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Min Cluster Size
              </label>
              <input
                type="number"
                min="2"
                max="20"
                value={algorithmParams.minClusterSize}
                onChange={(e) => setAlgorithmParams(prev => ({ ...prev, minClusterSize: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Similarity Threshold
              </label>
              <input
                type="number"
                min="0.1"
                max="1.0"
                step="0.1"
                value={algorithmParams.similarityThreshold}
                onChange={(e) => setAlgorithmParams(prev => ({ ...prev, similarityThreshold: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Window (hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={algorithmParams.timeWindow}
                onChange={(e) => setAlgorithmParams(prev => ({ ...prev, timeWindow: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={performClustering}
              disabled={isProcessing || logs.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5" />
                  Run Clustering Algorithm
                </>
              )}
            </button>
            
            <button
              onClick={fetchLogs}
              className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Refresh Logs ({logs.length} available)
            </button>
          </div>
        </div>

        {/* Results */}
        {clusteringResult && (
          <div className="space-y-8">
            {/* Algorithm Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Algorithm Performance Metrics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {clusteringResult.algorithm_metrics.silhouette_score}%
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Silhouette Score</div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {clusteringResult.algorithm_metrics.processing_time}ms
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Processing Time</div>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {clusteringResult.clusters.length}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Clusters Found</div>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {clusteringResult.threat_analysis.high_risk_clusters}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">High Risk Clusters</div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Cluster Distribution
                </h3>
                {getClusterChartData() && (
                  <Pie 
                    data={getClusterChartData()!}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                          }
                        }
                      }
                    }}
                  />
                )}
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Threat Level Distribution
                </h3>
                {getThreatLevelChartData() && (
                  <Bar 
                    data={getThreatLevelChartData()!}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                          }
                        },
                        x: {
                          ticks: {
                            color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                          }
                        }
                      }
                    }}
                  />
                )}
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Attack Types
                </h3>
                {getAttackTypeChartData() && (
                  <Pie 
                    data={getAttackTypeChartData()!}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                          }
                        }
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* Cluster Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Detected Threat Clusters
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {clusteringResult.clusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    onClick={() => setSelectedCluster(cluster)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                      cluster.threat_level === 'CRITICAL' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                      cluster.threat_level === 'HIGH' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                      cluster.threat_level === 'MEDIUM' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                      'border-green-500 bg-green-50 dark:bg-green-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Cluster {cluster.id}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cluster.threat_level === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        cluster.threat_level === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        cluster.threat_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {cluster.threat_level}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div><strong>Attack Type:</strong> {cluster.attack_type}</div>
                      <div><strong>Size:</strong> {cluster.size} events</div>
                      <div><strong>Confidence:</strong> {cluster.confidence}%</div>
                      <div><strong>Time Span:</strong> {cluster.time_span}</div>
                      <div><strong>Regions:</strong> {cluster.geographic_spread.join(', ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cluster Detail Modal */}
        {selectedCluster && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Cluster {selectedCluster.id} Details
                  </h2>
                  <button
                    onClick={() => setSelectedCluster(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Cluster Analysis
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Threat Level:</strong> {selectedCluster.threat_level}</div>
                      <div><strong>Attack Type:</strong> {selectedCluster.attack_type}</div>
                      <div><strong>Confidence:</strong> {selectedCluster.confidence}%</div>
                      <div><strong>Size:</strong> {selectedCluster.size} events</div>
                      <div><strong>Time Span:</strong> {selectedCluster.time_span}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Geographic Spread
                    </h3>
                    <div className="space-y-1">
                      {selectedCluster.geographic_spread.map((region, index) => (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          • {region}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Events in Cluster
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Event
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Source IP
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Risk Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Timestamp
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedCluster.events.slice(0, 10).map((event) => (
                          <tr key={event._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {event.event_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {event.source_ip}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {event.user_identity_user_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.risk_score > 80 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                event.risk_score > 60 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                event.risk_score > 40 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {event.risk_score}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(event.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {selectedCluster.events.length > 10 && (
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Showing first 10 of {selectedCluster.events.length} events
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 