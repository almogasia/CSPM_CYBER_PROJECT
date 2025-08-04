/**
 * Info Component - Security risk level information and guidance
 * Displays risk scoring system, examples, and recommended actions
 */

import React from "react";
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  CogIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

export default function Info() {
  const riskLevels = [
    {
      level: "CRITICAL",
      range: "90-100",
      color: "bg-red-900 text-red-100 dark:bg-red-800 dark:text-red-200",
      icon: ShieldExclamationIcon,
      description: "Immediate action required. These events represent severe security threats that could result in data breaches, system compromise, or significant compliance violations.",
      examples: [
        "Unauthorized root access attempts",
        "Suspicious data exfiltration patterns",
        "Multiple failed authentication attempts from unknown sources",
        "Critical system configuration changes by unauthorized users"
      ],
      actions: [
        "Immediate investigation required",
        "Potential system lockdown",
        "Notify security team immediately",
        "Review access controls"
      ]
    },
    {
      level: "HIGH",
      range: "70-89",
      color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      icon: ExclamationTriangleIcon,
      description: "High priority security events that require prompt attention. These may indicate potential security threats or policy violations.",
      examples: [
        "Unusual API access patterns",
        "Sensitive resource modifications",
        "Access from suspicious IP addresses",
        "Anomalous user behavior detected"
      ],
      actions: [
        "Investigate within 24 hours",
        "Review user permissions",
        "Monitor for similar patterns",
        "Update security policies if needed"
      ]
    },
    {
      level: "MEDIUM",
      range: "40-69",
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      icon: InformationCircleIcon,
      description: "Moderate risk events that should be monitored and reviewed. These may indicate potential security concerns or policy violations.",
      examples: [
        "Unusual login times",
        "Access to non-critical resources",
        "Minor configuration changes",
        "Suspicious but low-impact activities"
      ],
      actions: [
        "Review within 48 hours",
        "Monitor for escalation",
        "Document for trend analysis",
        "Consider policy updates"
      ]
    },
    {
      level: "LOW",
      range: "20-39",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      icon: ShieldCheckIcon,
      description: "Low-risk events that are generally safe but should be logged for monitoring purposes.",
      examples: [
        "Normal administrative tasks",
        "Routine system access",
        "Standard configuration updates",
        "Expected user activities"
      ],
      actions: [
        "Routine monitoring",
        "Log for compliance",
        "No immediate action required",
        "Review during regular audits"
      ]
    },
    {
      level: "SAFE",
      range: "0-19",
      color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      icon: ShieldCheckIcon,
      description: "Safe events that pose no security risk. These are normal operations and expected behaviors.",
      examples: [
        "Regular user logins",
        "Standard API calls",
        "Routine system operations",
        "Expected administrative tasks"
      ],
      actions: [
        "No action required",
        "Continue normal operations",
        "Log for audit purposes",
        "Use as baseline for normal behavior"
      ]
    }
  ];

  const scoringFactors = [
    {
      factor: "Machine Learning Models",
      description: "Advanced AI/ML algorithms analyze multiple features simultaneously",
      components: {
        "Isolation Forest": "Detects anomalies using unsupervised learning",
        "Random Forest": "Classifies events using supervised learning",
        "Autoencoder": "Identifies unusual patterns through reconstruction error"
      }
    },
    {
      factor: "Feature Engineering",
      description: "Sophisticated preprocessing of raw log data",
      components: {
        "IP Analysis": "Extracts octets and patterns from source IP addresses",
        "User Identity": "Analyzes user types and suspicious ARN patterns",
        "Event Features": "Processes event names, sources, and error codes",
        "Numeric Scaling": "Standardizes features for ML models"
      }
    },
    {
      factor: "Multi-Model Ensemble",
      description: "Combines predictions from multiple ML models",
      components: {
        "Isolation Forest (50%)": "Primary anomaly detection",
        "Random Forest (30%)": "Supervised classification",
        "Autoencoder (20%)": "Pattern reconstruction analysis"
      }
    },
    {
      factor: "Threshold-Based Scoring",
      description: "Uses percentile-based thresholds for risk levels",
      components: {
        "99.9th percentile": "CRITICAL risk (90-100)",
        "99th percentile": "HIGH risk (70-89)",
        "95th percentile": "MEDIUM risk (40-69)",
        "Below 95th": "LOW/SAFE risk (0-39)"
      }
    },
    {
      factor: "Conservative Scoring",
      description: "Ensures most events are low-risk by design",
      components: {
        "Low score reduction": "Scores <20 are reduced by 50%",
        "High score amplification": "Scores >80 are increased by 20%",
        "Balanced distribution": "Realistic threat ratios"
      }
    },
    {
      factor: "Real-time Processing",
      description: "Instant scoring of new security events",
      components: {
        "Preprocessing pipeline": "Standardizes incoming log data",
        "Model inference": "Rapid prediction using trained models",
        "Score calculation": "Combines model outputs with thresholds"
      }
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <InformationCircleIcon className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            System Information & Documentation
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Comprehensive documentation of security risk levels, system architecture, and operational guidelines
        </p>
      </div>

      {/* Risk Score Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-6 w-6 text-blue-500" />
          Risk Score Overview
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Our security monitoring system uses a comprehensive scoring algorithm to assess the risk level of each security event. 
          The risk score ranges from 0 to 100, with higher scores indicating greater security risk.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Score Range</h3>
            <p className="text-2xl font-bold text-blue-600">0 - 100</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Higher scores = Higher risk</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Risk Levels</h3>
            <p className="text-2xl font-bold text-blue-600">5 Levels</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">CRITICAL, HIGH, MEDIUM, LOW, SAFE</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Real-time Monitoring</h3>
            <p className="text-2xl font-bold text-blue-600">24/7</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Continuous security assessment</p>
          </div>
        </div>
      </div>

      {/* Risk Levels Detail */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <ShieldExclamationIcon className="h-6 w-6 text-red-500" />
          Risk Levels & Score Ranges
        </h2>
        
        <div className="space-y-6">
          {riskLevels.map((level, index) => (
            <div key={level.level} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className={`px-6 py-4 ${level.color} border-b border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <level.icon className="h-6 w-6" />
                    <h3 className="text-lg font-semibold">{level.level}</h3>
                    <span className="text-sm font-medium">Score: {level.range}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {level.description}
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <DocumentTextIcon className="h-4 w-4 text-blue-500" />
                      Common Examples
                    </h4>
                    <ul className="space-y-2">
                      {level.examples.map((example, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <CogIcon className="h-4 w-4 text-green-500" />
                      Recommended Actions
                    </h4>
                    <ul className="space-y-2">
                      {level.actions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scoring Factors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <LightBulbIcon className="h-6 w-6 text-yellow-500" />
          Risk Score Calculation Factors
        </h2>
        
                 <p className="text-gray-600 dark:text-gray-400 mb-6">
           The risk score is calculated using advanced machine learning models that analyze multiple features simultaneously. 
           The system uses an ensemble of AI/ML algorithms to detect anomalies and classify security events based on learned patterns.
         </p>
        
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {scoringFactors.map((factor, index) => (
             <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
               <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                 {factor.factor}
               </h3>
               <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                 {factor.description}
               </p>
               <div className="space-y-2">
                 {Object.entries(factor.components).map(([key, value]) => (
                   <div key={key} className="text-sm">
                     <span className="font-medium text-gray-700 dark:text-gray-300">{key}:</span>
                     <span className="text-gray-600 dark:text-gray-400 ml-2">{value}</span>
                   </div>
                 ))}
               </div>
             </div>
           ))}
         </div>
      </div>

      {/* System Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-blue-500" />
            Real-time Monitoring
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>• Continuous log analysis</li>
            <li>• Instant risk assessment</li>
            <li>• Immediate alert generation</li>
            <li>• 24/7 security oversight</li>
          </ul>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-green-500" />
            User Behavior Analysis
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>• Pattern recognition</li>
            <li>• Anomaly detection</li>
            <li>• Baseline establishment</li>
            <li>• Behavioral profiling</li>
          </ul>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ComputerDesktopIcon className="h-5 w-5 text-purple-500" />
            System Integration
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>• AWS CloudTrail integration</li>
            <li>• Multi-cloud support</li>
            <li>• API monitoring</li>
            <li>• Configuration tracking</li>
          </ul>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <QuestionMarkCircleIcon className="h-5 w-5 text-orange-500" />
            Incident Response
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>• Automated alerting</li>
            <li>• Escalation procedures</li>
            <li>• Investigation workflows</li>
            <li>• Remediation guidance</li>
          </ul>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
          <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
          Security Best Practices
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-800 dark:text-blue-200">
          <ul className="space-y-2">
            <li>• Regularly review security alerts</li>
            <li>• Monitor CRITICAL and HIGH risk events immediately</li>
            <li>• Maintain updated access controls</li>
            <li>• Document security incidents</li>
          </ul>
          <ul className="space-y-2">
            <li>• Use multi-factor authentication</li>
            <li>• Implement least privilege access</li>
            <li>• Regular security training</li>
            <li>• Keep systems updated</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 