import React, { useState, useEffect, useRef } from "react";
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
  explanation: string;
  risk_factors: string[];
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
  
  // Fixed seed for reproducible results (hidden from user)
  const seedRef = useRef(42);
  
  // Deterministic random number generator with fixed seed
  const deterministicRandom = () => {
    seedRef.current = (seedRef.current * 9301 + 49297) % 233280;
    return seedRef.current / 233280;
  };

  // K-Means++ initialization for optimal clustering
  // This algorithm chooses initial centroids more intelligently than random selection,
  // leading to better clustering quality and consistent results
  const kMeansPlusPlusInit = (data: number[][], k: number): number[][] => {
    const n = data.length;
    const centroids: number[][] = [];
    
    // Choose first centroid randomly but deterministically
    const firstIndex = Math.floor(deterministicRandom() * n);
    centroids.push([...data[firstIndex]]);
    
    // Choose remaining centroids using K-Means++ algorithm
    for (let i = 1; i < k; i++) {
      const distances: number[] = [];
      let totalDistance = 0;
      
      // Calculate minimum distance to existing centroids for each point
      for (let j = 0; j < n; j++) {
        let minDistance = Infinity;
        for (const centroid of centroids) {
          const distance = euclideanDistance(data[j], centroid);
          minDistance = Math.min(minDistance, distance);
        }
        // Use distance squared for better spread (K-Means++ standard)
        distances[j] = minDistance * minDistance;
        totalDistance += distances[j];
      }
      
      // Choose next centroid with probability proportional to distance squared
      const threshold = deterministicRandom() * totalDistance;
      let cumulativeDistance = 0;
      let selectedIndex = 0;
      
      for (let j = 0; j < n; j++) {
        cumulativeDistance += distances[j];
        if (cumulativeDistance >= threshold) {
          selectedIndex = j;
          break;
        }
      }
      
      centroids.push([...data[selectedIndex]]);
    }
    
    return centroids;
  };

  const kMeansClustering = (data: number[][], k: number, maxIterations: number = 100): { clusters: number[], centroids: number[][] } => {
    const n = data.length;
    const d = data[0].length;
    
    // Initialize centroids using K-Means++ for optimal results
    let centroids: number[][] = kMeansPlusPlusInit(data, k);
    
    let clusters: number[] = new Array(n).fill(0);
    let iterations = 0;
    let converged = false;
    let previousCentroids: number[][] = [];
    
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
          // Handle empty clusters by reinitializing from data
          const randomIndex = Math.floor(deterministicRandom() * n);
          newCentroids.push([...data[randomIndex]]);
        }
      }
      
      // Check convergence using both cluster assignments and centroid movement
      const clusterConverged = arraysEqual(clusters, newClusters);
      const centroidConverged = previousCentroids.length > 0 && 
        centroids.every((centroid, i) => 
          euclideanDistance(centroid, previousCentroids[i]) < 1e-6
        );
      
      converged = clusterConverged || centroidConverged;
      clusters = newClusters;
      previousCentroids = [...centroids];
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

  // Feature extraction for clustering with improved normalization
  const extractFeatures = (events: LogEvent[]): number[][] => {
    // Calculate global statistics for better normalization
    const riskScores = events.map(e => e.risk_score).filter(score => !isNaN(score) && isFinite(score));
    const timestamps = events.map(e => new Date(e.timestamp).getTime()).filter(ts => !isNaN(ts));
    
    const minRisk = riskScores.length > 0 ? Math.min(...riskScores) : 0;
    const maxRisk = riskScores.length > 0 ? Math.max(...riskScores) : 100;
    const minTime = timestamps.length > 0 ? Math.min(...timestamps) : Date.now();
    const maxTime = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
    
    return events.map((event, index) => {
      try {
        // Validate and sanitize required fields
        let riskScore = event.risk_score;
        if (typeof riskScore !== 'number' || isNaN(riskScore) || !isFinite(riskScore)) {
          console.warn(`Invalid risk_score for event ${index}:`, riskScore);
          riskScore = 0;
        }
        
        let timestamp = event.timestamp;
        if (!timestamp) {
          console.warn(`Missing timestamp for event ${index}`);
          timestamp = new Date().toISOString();
        }
        
        // Normalize features for clustering with improved scaling
        const normalizedRiskScore = maxRisk > minRisk ? (riskScore - minRisk) / (maxRisk - minRisk) : 0.5;
        const normalizedTimestamp = maxTime > minTime ? (new Date(timestamp).getTime() - minTime) / (maxTime - minTime) : 0.5;
        
        // Hash-based features with better normalization
        const regionHash = (hashString(event.aws_region || 'unknown') % 1000) / 1000; // Normalize to 0-1
        const userTypeHash = (hashString(event.user_identity_type || 'unknown') % 1000) / 1000; // Normalize to 0-1
        const errorHash = (hashString(event.error_code || 'NoError') % 1000) / 1000; // Normalize to 0-1
        
        return [normalizedRiskScore, normalizedTimestamp, regionHash, userTypeHash, errorHash];
      } catch (error) {
        console.error(`Error extracting features for event ${index}:`, error, event);
        // Return default feature vector for this event
        return [0.5, 0.5, 0.5, 0.5, 0.5];
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

  const determineThreatLevel = (events: LogEvent[], avgRiskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
    // Analyze multiple threat indicators
    const errorCodes = events.map(e => e.error_code).filter(code => code !== 'NoError');
    const userTypes = events.map(e => e.user_identity_type);
    const eventTypes = events.map(e => e.event_name);
    const sourceIPs = events.map(e => e.source_ip);
    const regions = events.map(e => e.aws_region);
    
    // Calculate threat indicators
    const errorRate = errorCodes.length / events.length;
    const rootUserRate = userTypes.filter(type => type === 'Root').length / events.length;
    const uniqueIPs = new Set(sourceIPs).size;
    const uniqueRegions = new Set(regions).size;
    
    // Time-based analysis
    const timestamps = events.map(e => new Date(e.timestamp).getTime()).sort();
    const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
    
    // Calculate events per hour with proper mathematical handling
    let eventsPerHour: number;
    if (timeSpan === 0) {
      // All events have the same timestamp - this is a burst event
      // For burst events, we cannot calculate a meaningful hourly rate
      // Instead, we'll use the actual event count as a burst indicator
      eventsPerHour = events.length; // This represents the burst size, not hourly rate
    } else if (timeSpan < 60000) { // Less than 1 minute
      // For very short spans, calculate the actual rate
      const eventsPerMinute = events.length / (timeSpan / (1000 * 60));
      eventsPerHour = eventsPerMinute * 60; // Convert to hourly rate
    } else if (timeSpan < 3600000) { // Less than 1 hour
      // For spans less than 1 hour, calculate the actual rate
      eventsPerHour = events.length / (timeSpan / (1000 * 60 * 60));
    } else {
      // For spans of 1 hour or more, use the actual calculation
      eventsPerHour = events.length / (timeSpan / (1000 * 60 * 60));
    }
    
    // Threat scoring based on multiple factors - More realistic thresholds
    let threatScore = 0;
    
    // Base score from risk assessment (reduced weight)
    threatScore += avgRiskScore * 0.3;
    
    // Error rate contribution (more conservative)
    if (errorRate > 0.9) threatScore += 20;
    else if (errorRate > 0.7) threatScore += 15;
    else if (errorRate > 0.5) threatScore += 10;
    else if (errorRate > 0.3) threatScore += 5;
    
    // Root user activity (more conservative)
    if (rootUserRate > 0.7) threatScore += 20;
    else if (rootUserRate > 0.5) threatScore += 15;
    else if (rootUserRate > 0.3) threatScore += 10;
    else if (rootUserRate > 0.1) threatScore += 5;
    
    // Geographic spread (more conservative)
    if (uniqueRegions > 8) threatScore += 15;
    else if (uniqueRegions > 5) threatScore += 10;
    else if (uniqueRegions > 3) threatScore += 5;
    
    // IP diversity (more conservative)
    if (uniqueIPs > 20) threatScore += 15;
    else if (uniqueIPs > 10) threatScore += 10;
    else if (uniqueIPs > 5) threatScore += 5;
    
    // Activity volume (more conservative)
    if (eventsPerHour > 200) threatScore += 15;
    else if (eventsPerHour > 100) threatScore += 10;
    else if (eventsPerHour > 50) threatScore += 5;
    
    // Destructive operations (high impact)
    if (eventTypes.some(type => type.includes('Delete') || type.includes('Terminate'))) {
      threatScore += 20;
    }
    
    // Administrative operations (high impact)
    if (eventTypes.some(type => type.includes('CreateUser') || type.includes('CreateRole') || type.includes('AttachPolicy'))) {
      threatScore += 15;
    }
    
    // Normalize threat score to 0-100 range
    threatScore = Math.min(100, Math.max(0, threatScore));
    
    // More realistic threat level thresholds
    if (threatScore >= 75) return 'CRITICAL';
    if (threatScore >= 55) return 'HIGH';
    if (threatScore >= 30) return 'MEDIUM';
    return 'LOW';
  };

  const determineAttackType = (events: LogEvent[]): string => {
    // Analyze multiple characteristics of the cluster
    const eventTypes = events.map(e => e.event_name);
    const errorCodes = events.map(e => e.error_code).filter(code => code !== 'NoError');
    const userTypes = events.map(e => e.user_identity_type);
    const riskScores = events.map(e => e.risk_score);
    const sourceIPs = events.map(e => e.source_ip);
    const regions = events.map(e => e.aws_region);
    const userNames = events.map(e => e.user_identity_user_name);
    
    // Calculate various metrics
    const avgRiskScore = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
    const errorRate = errorCodes.length / events.length;
    const uniqueIPs = new Set(sourceIPs).size;
    const uniqueRegions = new Set(regions).size;
    const uniqueUsers = new Set(userNames).size;
    const rootUserCount = userTypes.filter(type => type === 'Root').length;
    const rootUserRate = rootUserCount / events.length;
    
    // Time-based analysis
    const timestamps = events.map(e => new Date(e.timestamp).getTime()).sort();
    const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
    
    // Calculate events per hour with proper mathematical handling
    let eventsPerHour: number;
    if (timeSpan === 0) {
      // All events have the same timestamp - this is a burst event
      // For burst events, we cannot calculate a meaningful hourly rate
      // Instead, we'll use the actual event count as a burst indicator
      eventsPerHour = events.length; // This represents the burst size, not hourly rate
    } else if (timeSpan < 60000) { // Less than 1 minute
      // For very short spans, calculate the actual rate
      const eventsPerMinute = events.length / (timeSpan / (1000 * 60));
      eventsPerHour = eventsPerMinute * 60; // Convert to hourly rate
    } else if (timeSpan < 3600000) { // Less than 1 hour
      // For spans less than 1 hour, calculate the actual rate
      eventsPerHour = events.length / (timeSpan / (1000 * 60 * 60));
    } else {
      // For spans of 1 hour or more, use the actual calculation
      eventsPerHour = events.length / (timeSpan / (1000 * 60 * 60));
    }
    
    // Event type frequency analysis
    const eventTypeCounts = eventTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonEvent = Object.entries(eventTypeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';
    
    // Error code analysis
    const errorCodeCounts = errorCodes.reduce((acc, code) => {
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonError = Object.entries(errorCodeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'NoError';
    
    // Attack type determination based on comprehensive analysis - More realistic thresholds
    
    // 1. Brute Force Attack - High error rate, multiple failed attempts
    if (errorRate > 0.8 && eventsPerHour > 20 && uniqueIPs <= 2) {
      return "Brute Force Attack";
    }
    
    // 2. Credential Stuffing - Multiple IPs, high error rate, authentication events
    if (errorRate > 0.6 && uniqueIPs > 10 && 
        eventTypes.some(type => type.includes('Login') || type.includes('Auth'))) {
      return "Credential Stuffing";
    }
    
    // 3. Privilege Escalation - High root user activity, administrative actions
    if (rootUserRate > 0.5 || 
        eventTypes.some(type => type.includes('CreateUser') || type.includes('CreateRole') || type.includes('AttachPolicy'))) {
      return "Privilege Escalation";
    }
    
    // 4. Data Exfiltration - S3/Data access events, high risk scores
    if (eventTypes.some(type => type.includes('GetObject') || type.includes('ListBucket') || type.includes('DescribeInstances')) &&
        avgRiskScore > 80 && uniqueRegions > 3) {
      return "Data Exfiltration";
    }
    
    // 5. Resource Abuse - High volume of resource creation/modification
    if (eventTypes.some(type => type.includes('CreateInstance') || type.includes('CreateBucket') || type.includes('CreateFunction')) &&
        eventsPerHour > 50) {
      return "Resource Abuse";
    }
    
    // 6. Destructive Attack - Delete operations, high risk
    if (eventTypes.some(type => type.includes('Delete') || type.includes('Terminate')) &&
        avgRiskScore > 90) {
      return "Destructive Attack";
    }
    
    // 7. Reconnaissance - Information gathering events, low risk but suspicious pattern
    if (eventTypes.some(type => type.includes('Describe') || type.includes('List') || type.includes('Get')) &&
        avgRiskScore < 60 && uniqueRegions > 5) {
      return "Reconnaissance";
    }
    
    // 8. Account Takeover - User creation, role modification, high risk
    if (eventTypes.some(type => type.includes('CreateUser') || type.includes('CreateRole') || type.includes('AttachPolicy'))) {
      return "Account Takeover";
    }
    
    // 9. API Abuse - High volume of API calls, moderate risk
    if (eventsPerHour > 100 && avgRiskScore > 50 && avgRiskScore < 80) {
      return "API Abuse";
    }
    
    // 10. Geographic Anomaly - Unusual geographic distribution
    if (uniqueRegions > 8 && events.length > 15) {
      return "Geographic Anomaly";
    }
    
    // 11. Time-based Anomaly - Unusual activity patterns
    if (eventsPerHour > 200 || (eventsPerHour < 0.5 && events.length > 10)) {
      return "Time-based Anomaly";
    }
    
    // 12. Suspicious Activity - General catch-all for other patterns
    if (avgRiskScore > 70 || errorRate > 0.3) {
      return "Suspicious Activity";
    }
    
    // Default fallback - More likely to be normal
    return "Normal Activity";
  };

  const calculateConfidence = (events: LogEvent[], avgRiskScore: number): number => {
    const riskVariance = events.reduce((sum, e) => sum + Math.pow(e.risk_score - avgRiskScore, 2), 0) / events.length;
    const consistencyScore = Math.max(0, 100 - riskVariance);
    const sizeScore = Math.min(100, events.length * 10);
    return Math.round((consistencyScore + sizeScore) / 2);
  };

  const calculateSilhouetteScore = (features: number[][], clusters: number[]): number => {
    // Improved silhouette score calculation with better handling of edge cases
    let totalSilhouette = 0;
    let validPoints = 0;
    const uniqueClusters = [...new Set(clusters)];
    
    // Need at least 2 clusters for meaningful silhouette score
    if (uniqueClusters.length < 2) {
      return 0;
    }
    
    for (let i = 0; i < features.length; i++) {
      const currentCluster = clusters[i];
      const sameClusterPoints = features.filter((_, idx) => clusters[idx] === currentCluster && idx !== i);
      const otherClusterPoints = features.filter((_, idx) => clusters[idx] !== currentCluster);
      
      // Skip points that are alone in their cluster or when no other clusters exist
      if (sameClusterPoints.length === 0 || otherClusterPoints.length === 0) continue;
      
      // Calculate average distance to points in same cluster (cohesion)
      const a = sameClusterPoints.reduce((sum, point) => sum + euclideanDistance(features[i], point), 0) / sameClusterPoints.length;
      
      // Calculate minimum average distance to points in other clusters (separation)
      const clusterDistances = uniqueClusters
        .filter(clusterId => clusterId !== currentCluster)
        .map(clusterId => {
          const clusterPoints = features.filter((_, idx) => clusters[idx] === clusterId);
          return clusterPoints.reduce((sum, point) => sum + euclideanDistance(features[i], point), 0) / clusterPoints.length;
        });
      
      const b = Math.min(...clusterDistances);
      
      // Calculate silhouette coefficient for this point
      const silhouette = (b - a) / Math.max(a, b);
      totalSilhouette += silhouette;
      validPoints++;
    }
    
    // Return average silhouette score, scaled to 0-100
    return validPoints > 0 ? Math.round((totalSilhouette / validPoints) * 100) : 0;
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

  // Generate detailed explanation for cluster
  const generateClusterExplanation = (events: LogEvent[], attackType: string, threatLevel: string): string => {
    const eventTypes = events.map(e => e.event_name);
    const errorCodes = events.map(e => e.error_code).filter(code => code !== 'NoError');
    const userTypes = events.map(e => e.user_identity_type);
    const sourceIPs = events.map(e => e.source_ip);
    const regions = events.map(e => e.aws_region);
    const riskScores = events.map(e => e.risk_score);
    
    const uniqueIPs = new Set(sourceIPs).size;
    const uniqueRegions = new Set(regions).size;
    const avgRiskScore = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
    const errorRate = errorCodes.length / events.length;
    const rootUserRate = userTypes.filter(type => type === 'Root').length / events.length;
    
    // Time-based analysis
    const timestamps = events.map(e => new Date(e.timestamp).getTime()).sort();
    const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
    
    // Calculate events per hour with proper mathematical handling
    let eventsPerHour: number;
    if (timeSpan === 0) {
      // All events have the same timestamp - this is a burst event
      // For burst events, we cannot calculate a meaningful hourly rate
      // Instead, we'll use the actual event count as a burst indicator
      eventsPerHour = events.length; // This represents the burst size, not hourly rate
    } else if (timeSpan < 60000) { // Less than 1 minute
      // For very short spans, calculate the actual rate
      const eventsPerMinute = events.length / (timeSpan / (1000 * 60));
      eventsPerHour = eventsPerMinute * 60; // Convert to hourly rate
    } else if (timeSpan < 3600000) { // Less than 1 hour
      // For spans less than 1 hour, calculate the actual rate
      eventsPerHour = events.length / (timeSpan / (1000 * 60 * 60));
    } else {
      // For spans of 1 hour or more, use the actual calculation
      eventsPerHour = events.length / (timeSpan / (1000 * 60 * 60));
    }
    
    let explanation = `This cluster contains ${events.length} events that were grouped together based on similar patterns. `;
    
    // Add attack type specific explanation
    switch (attackType) {
      case "Brute Force Attack":
        if (timeSpan === 0) {
          explanation += `The high error rate (${Math.round(errorRate * 100)}%) and burst activity (${events.length} events simultaneously) from ${uniqueIPs} source IP(s) indicates a brute force attack attempting to gain unauthorized access. `;
        } else {
          explanation += `The high error rate (${Math.round(errorRate * 100)}%) and rapid activity (${Math.round(eventsPerHour)} events/hour) from ${uniqueIPs} source IP(s) indicates a brute force attack attempting to gain unauthorized access. `;
        }
        break;
      case "Credential Stuffing":
        explanation += `Multiple IP addresses (${uniqueIPs}) are attempting authentication with a high failure rate (${Math.round(errorRate * 100)}%), suggesting stolen credentials are being tested across your infrastructure. `;
        break;
      case "Privilege Escalation":
        explanation += `High root user activity (${Math.round(rootUserRate * 100)}%) and administrative operations suggest an attacker is attempting to gain elevated privileges. `;
        break;
      case "Data Exfiltration":
        explanation += `High-risk data access operations (avg risk: ${Math.round(avgRiskScore)}) across ${uniqueRegions} regions indicate potential data theft attempts. `;
        break;
      case "Resource Abuse":
        if (timeSpan === 0) {
          explanation += `High volume of resource creation (${events.length} events in burst) suggests potential resource hijacking or crypto mining activity. `;
        } else {
          explanation += `High volume of resource creation (${Math.round(eventsPerHour)} events/hour) suggests potential resource hijacking or crypto mining activity. `;
        }
        break;
      case "Destructive Attack":
        explanation += `Delete/terminate operations with high risk scores (${Math.round(avgRiskScore)}) indicate a destructive attack attempting to damage your infrastructure. `;
        break;
      case "Reconnaissance":
        explanation += `Information gathering activities across ${uniqueRegions} regions suggest an attacker is mapping your infrastructure for future attacks. `;
        break;
      case "Account Takeover":
        explanation += `User and role creation activities indicate an attacker is attempting to establish persistent access. `;
        break;
      case "API Abuse":
        if (timeSpan === 0) {
          explanation += `High volume of API calls (${events.length} events in burst) suggests potential API abuse or rate limit testing. `;
        } else {
          explanation += `High volume of API calls (${Math.round(eventsPerHour)} events/hour) suggests potential API abuse or rate limit testing. `;
        }
        break;
      case "Geographic Anomaly":
        explanation += `Unusual geographic distribution across ${uniqueRegions} regions suggests coordinated attack from multiple locations. `;
        break;
      case "Time-based Anomaly":
        if (timeSpan === 0) {
          explanation += `Unusual activity patterns (${events.length} events in burst) suggest automated or coordinated attack behavior. `;
        } else {
          explanation += `Unusual activity patterns (${Math.round(eventsPerHour)} events/hour) suggest automated or coordinated attack behavior. `;
        }
        break;
      case "Suspicious Activity":
        explanation += `Multiple suspicious indicators including high risk scores (${Math.round(avgRiskScore)}) and error rates (${Math.round(errorRate * 100)}%) suggest potential malicious activity. `;
        break;
      default:
        explanation += `The events show normal operational patterns with no significant security concerns. `;
    }
    
    // Add threat level context
    if (threatLevel === 'CRITICAL') {
      explanation += `This is classified as CRITICAL due to the immediate and severe impact potential.`;
    } else if (threatLevel === 'HIGH') {
      explanation += `This is classified as HIGH due to significant security implications.`;
    } else if (threatLevel === 'MEDIUM') {
      explanation += `This is classified as MEDIUM due to moderate security concerns.`;
    } else {
      explanation += `This is classified as LOW due to minimal security impact.`;
    }
    
    return explanation;
  };

  // Generate risk factors for cluster
  const generateRiskFactors = (events: LogEvent[]): string[] => {
    const riskFactors: string[] = [];
    const eventTypes = events.map(e => e.event_name);
    const errorCodes = events.map(e => e.error_code).filter(code => code !== 'NoError');
    const userTypes = events.map(e => e.user_identity_type);
    const sourceIPs = events.map(e => e.source_ip);
    const regions = events.map(e => e.aws_region);
    const riskScores = events.map(e => e.risk_score);
    
    const uniqueIPs = new Set(sourceIPs).size;
    const uniqueRegions = new Set(regions).size;
    const avgRiskScore = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
    const errorRate = errorCodes.length / events.length;
    const rootUserRate = userTypes.filter(type => type === 'Root').length / events.length;
    
    // Time-based analysis
    const timestamps = events.map(e => new Date(e.timestamp).getTime()).sort();
    const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
    
    // Calculate events per hour with proper mathematical handling
    let eventsPerHour: number;
    if (timeSpan === 0) {
      // All events have the same timestamp - this is a burst event
      // For burst events, we cannot calculate a meaningful hourly rate
      // Instead, we'll use the actual event count as a burst indicator
      eventsPerHour = events.length; // This represents the burst size, not hourly rate
    } else if (timeSpan < 60000) { // Less than 1 minute
      // For very short spans, calculate the actual rate
      const eventsPerMinute = events.length / (timeSpan / (1000 * 60));
      eventsPerHour = eventsPerMinute * 60; // Convert to hourly rate
    } else if (timeSpan < 3600000) { // Less than 1 hour
      // For spans less than 1 hour, calculate the actual rate
      eventsPerHour = events.length / (timeSpan / (1000 * 60 * 60));
    } else {
      // For spans of 1 hour or more, use the actual calculation
      eventsPerHour = events.length / (timeSpan / (1000 * 60 * 60));
    }
    
    // Add risk factors based on thresholds
    if (errorRate > 0.3) {
      riskFactors.push(`High error rate (${Math.round(errorRate * 100)}%) indicates failed attack attempts`);
    }
    
    if (rootUserRate > 0.1) {
      riskFactors.push(`Root user activity (${Math.round(rootUserRate * 100)}%) suggests privilege escalation attempts`);
    }
    
    if (uniqueRegions > 3) {
      riskFactors.push(`Geographic spread across ${uniqueRegions} regions indicates coordinated attack`);
    }
    
    if (uniqueIPs > 5) {
      riskFactors.push(`Multiple source IPs (${uniqueIPs}) suggests botnet or distributed attack`);
    }
    
    if (timeSpan === 0 && events.length > 10) {
      riskFactors.push(`Burst activity (${events.length} events simultaneously) suggests automated attack`);
    } else if (eventsPerHour > 50) {
      riskFactors.push(`High activity volume (${Math.round(eventsPerHour)} events/hour) suggests automated attack`);
    }
    
    if (avgRiskScore > 70) {
      riskFactors.push(`High average risk score (${Math.round(avgRiskScore)}) indicates dangerous operations`);
    }
    
    if (eventTypes.some(type => type.includes('Delete') || type.includes('Terminate'))) {
      riskFactors.push(`Destructive operations detected (delete/terminate actions)`);
    }
    
    if (eventTypes.some(type => type.includes('CreateUser') || type.includes('CreateRole'))) {
      riskFactors.push(`Account manipulation detected (user/role creation)`);
    }
    
    if (eventTypes.some(type => type.includes('GetObject') || type.includes('ListBucket'))) {
      riskFactors.push(`Data access operations detected (potential data exfiltration)`);
    }
    
    if (timeSpan < 1000 * 60 * 60) { // Less than 1 hour
      riskFactors.push(`Rapid execution (${Math.round(timeSpan / (1000 * 60))} minutes) suggests automated attack`);
    }
    
    return riskFactors;
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

    // Reset seed to ensure deterministic results
    seedRef.current = 42;

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
          
          // Enhanced threat level determination based on multiple factors
          const threatLevel = determineThreatLevel(events, avgRiskScore);
          
          const regions = [...new Set(events.map(e => e.aws_region))];
          const users = [...new Set(events.map(e => e.user_identity_user_name).filter(Boolean))];
          
          const timeSpan = calculateTimeSpan(events);
          const attackType = determineAttackType(events);
          const confidence = calculateConfidence(events, avgRiskScore);
          const explanation = generateClusterExplanation(events, attackType, threatLevel);
          const riskFactors = generateRiskFactors(events);

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
            explanation,
            risk_factors: riskFactors,
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
    
    // Handle edge cases where all events have the same timestamp
    if (duration === 0) {
      return "0 minutes";
    }
    
    const hours = duration / (1000 * 60 * 60);
    const minutes = duration / (1000 * 60);
    
    if (hours >= 1) {
      return `${Math.round(hours * 10) / 10} hours`;
    } else if (minutes >= 1) {
      return `${Math.round(minutes)} minutes`;
    } else {
      return `${Math.round(duration / 1000)} seconds`;
    }
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
                     
                     <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                       <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                         {cluster.explanation}
                       </p>
                     </div>
                     
                     {cluster.risk_factors.length > 0 && (
                       <div className="mt-2">
                         <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                           Risk Factors:
                         </div>
                         <div className="space-y-1">
                           {cluster.risk_factors.slice(0, 3).map((factor, index) => (
                             <div key={index} className="text-xs text-red-600 dark:text-red-400 flex items-start">
                               <span className="mr-1">•</span>
                               <span>{factor}</span>
                             </div>
                           ))}
                           {cluster.risk_factors.length > 3 && (
                             <div className="text-xs text-gray-500 dark:text-gray-400">
                               +{cluster.risk_factors.length - 3} more factors
                             </div>
                           )}
                         </div>
                       </div>
                     )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cluster Detail Modal */}
        {selectedCluster && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedCluster(null)}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
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
                     
                     <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                       <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                         Analysis Explanation
                       </h4>
                       <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                         {selectedCluster.explanation}
                       </p>
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
                     
                     {selectedCluster.risk_factors.length > 0 && (
                       <div className="mt-4">
                         <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                           Risk Factors
                         </h4>
                         <div className="space-y-2">
                           {selectedCluster.risk_factors.map((factor, index) => (
                             <div key={index} className="text-sm text-red-600 dark:text-red-400 flex items-start">
                               <span className="mr-2 mt-0.5">•</span>
                               <span>{factor}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
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