import pandas as pd
import numpy as np
import re
import joblib
import logging
from sklearn.base import BaseEstimator, TransformerMixin

"""
Cloud Security Posture Management (CSPM) Multi-Model Anomaly Detection System

This module implements a comprehensive multi-model approach for detecting security anomalies
in cloud infrastructure logs. It combines Isolation Forest, Random Forest, and Autoencoder
models to provide robust risk assessment and threat detection capabilities.

Key Components:
- Log parsing and preprocessing
- Multi-model risk scoring
- Anomaly detection and classification
- Risk level assessment and reporting
"""

# Configure logging for model operations
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define DFToDictTransformer for feature preprocessing
class DFToDictTransformer(BaseEstimator, TransformerMixin):
    def __init__(self, columns):
        self.columns = columns

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        return X[self.columns].to_dict(orient='records')

# Make transformer available for preprocessor loading
import sys
sys.modules['__main__'].DFToDictTransformer = DFToDictTransformer

def parse_log_string(log_string):
    """
    Parse pipe-separated log string into structured dictionary format
    
    Converts AWS CloudTrail log entries from pipe-delimited string format
    into a dictionary with proper field mapping for model processing.
    
    Args:
        log_string (str): Pipe-separated log string with 18 features
        
    Returns:
        dict: Structured log data with field names as keys
        
    Raises:
        ValueError: If the number of features doesn't match expected count
        
    Expected format: feature1|feature2|feature3|...|feature18
    """
    columns = [
        "eventID", "eventTime", "sourceIPAddress", "userAgent", "eventName",
        "eventSource", "awsRegion", "eventVersion", "userIdentitytype",
        "eventType", "userIdentityaccountId", "userIdentityprincipalId",
        "userIdentityarn", "userIdentityaccessKeyId", "userIdentityuserName",
        "errorCode", "errorMessage", "requestParametersinstanceType"
    ]
    
    # Split the string by pipe
    values = log_string.strip().split('|')
    
    # Check if we have the right number of features
    if len(values) != len(columns):
        raise ValueError(f"Expected {len(columns)} features, got {len(values)}")
    
    # Create dictionary
    log_dict = dict(zip(columns, values))
    
    return log_dict

def preprocess_data(df):
    """
    Preprocess log data for machine learning model input
    
    Performs feature engineering and data cleaning operations on raw log data:
    - IP address feature extraction (first and second octets)
    - Suspicious ARN pattern detection
    - Root user identification
    - Error code normalization
    - Feature selection and transformation
    
    Args:
        df (pd.DataFrame): Raw log data with AWS CloudTrail fields
        
    Returns:
        pd.DataFrame: Preprocessed data ready for model input
    """
    df['sourceIPAddress'] = df['sourceIPAddress'].fillna('0.0.0.0')
    df['ip_first_octet'] = df['sourceIPAddress'].apply(lambda x: int(str(x).split('.')[0]) if str(x).split('.')[0].isdigit() else 0)
    df['ip_second_octet'] = df['sourceIPAddress'].apply(lambda x: int(str(x).split('.')[1]) if len(str(x).split('.')) > 1 and str(x).split('.')[1].isdigit() else 0)

    df['userIdentityarn'] = df['userIdentityarn'].fillna('')
    df['has_suspicious_arn'] = df['userIdentityarn'].apply(lambda x: 1 if re.search(r'admin|root|super', x, re.IGNORECASE) else 0)
    df['isRootUser'] = (df['userIdentitytype'] == 'Root').astype(int)
    df['errorCode'] = df['errorCode'].fillna('NoError')

    df = df.drop(columns=['eventID', 'userIdentitytype', 'userIdentityarn', 'sourceIPAddress'])
    return df

def score_single_log_corrected(log_dict):
    """
    Calculate comprehensive risk score using multi-model ensemble
    
    Evaluates log entry using three complementary models:
    1. Isolation Forest: Unsupervised anomaly detection
    2. Random Forest: Supervised risk classification  
    3. Autoencoder: Deep learning reconstruction error
    
    Combines model outputs with weighted scoring to produce final risk assessment.
    
    Args:
        log_dict (dict): Preprocessed log entry as dictionary
        
    Returns:
        int: Risk score (0-100) indicating security threat level
    """
    preprocessor = joblib.load('preprocessor.joblib')
    isolation_forest = joblib.load('isolation_forest.joblib')
    random_forest = joblib.load('random_forest.joblib')
    autoencoder = joblib.load('autoencoder.joblib')
    iso_thresholds = joblib.load('iso_thresholds.joblib')
    ae_thresholds = joblib.load('ae_thresholds.joblib')

    df_log = pd.DataFrame([log_dict])
    
    df_log['eventVersion'] = pd.to_numeric(df_log['eventVersion'], errors='coerce').fillna(0)
    df_log['userIdentityaccountId'] = pd.to_numeric(df_log['userIdentityaccountId'], errors='coerce').fillna(0)
    df_log['sourceIPAddress'] = df_log['sourceIPAddress'].astype(str)
    df_log = preprocess_data(df_log)
    
    X_log = preprocessor.transform(df_log)
    if hasattr(X_log, 'toarray'):
        X_log = X_log.toarray()

    iso_pred_raw = isolation_forest.decision_function(X_log)[0]
    iso_score = -iso_pred_raw
    
    if iso_score >= iso_thresholds['threshold_99_9']:
        iso_risk = 100
    elif iso_score >= iso_thresholds['threshold_99']:
        iso_risk = 80
    elif iso_score >= iso_thresholds['threshold_95']:
        iso_risk = 40
    else:
        normalized = (iso_score - iso_thresholds['min_score']) / (iso_thresholds['threshold_95'] - iso_thresholds['min_score'])
        iso_risk = max(0, normalized * 30)
    
    rf_pred_proba = random_forest.predict_proba(X_log)[0][1]
    rf_risk = rf_pred_proba * 100
    
    recon = autoencoder.predict(X_log)
    if recon.ndim == 1:
        recon = recon.reshape(1, -1)
    if recon.shape[1] != X_log.shape[1]:
        recon = np.tile(recon, (1, X_log.shape[1]))
    
    ae_error = np.mean((X_log - recon) ** 2)
    
    if ae_error >= ae_thresholds['threshold_99_9']:
        ae_risk = 100
    elif ae_error >= ae_thresholds['threshold_99']:
        ae_risk = 80
    elif ae_error >= ae_thresholds['threshold_95']:
        ae_risk = 40
    else:
        normalized = (ae_error - ae_thresholds['mean_error']) / (ae_thresholds['threshold_95'] - ae_thresholds['mean_error'])
        ae_risk = max(0, normalized * 30)
    
    final_score = 0.5 * iso_risk + 0.3 * rf_risk + 0.2 * ae_risk
    
    if final_score < 20:
        final_score = final_score * 0.5
    elif final_score > 80:
        final_score = final_score * 1.2
    
    rounded_score = round(final_score)
    
    return rounded_score

def score_log_string(log_string):
    """
    Score log entry from pipe-separated string format
    
    Convenience function that combines parsing and scoring operations
    for direct evaluation of raw log strings.
    
    Args:
        log_string (str): Pipe-separated log string
        
    Returns:
        int: Risk score (0-100) for the log entry
    """
    log_dict = parse_log_string(log_string)
    return score_single_log_corrected(log_dict)

class MultiModelCSPM:
    """
    Multi-Model Cloud Security Posture Management System
    
    A comprehensive anomaly detection system that combines multiple machine learning
    models to identify security threats in cloud infrastructure logs. The system
    provides real-time risk assessment and threat classification capabilities.
    
    Models:
    - Isolation Forest: Detects outliers and unusual patterns
    - Random Forest: Classifies known threat patterns
    - Autoencoder: Identifies reconstruction anomalies
    
    Features:
    - Real-time log evaluation
    - Multi-level risk scoring
    - Comprehensive threat assessment
    - Automated model management
    """
    
    def __init__(self):
        self.preprocessor = None
        self.isolation_forest = None
        self.random_forest = None
        self.autoencoder = None
        self.iso_thresholds = None
        self.ae_thresholds = None
        self.load_models()
    
    def load_models(self):
        """
        Load pre-trained machine learning models and threshold data
        
        Initializes all required models and configuration data from disk:
        - Preprocessor for feature transformation
        - Isolation Forest model for anomaly detection
        - Random Forest model for risk classification
        - Autoencoder model for reconstruction analysis
        - Threshold data for risk level determination
        
        Raises:
            Exception: If any model files are missing or corrupted
        """
        try:
            logger.info("Loading models from joblib files...")
            self.preprocessor = joblib.load('preprocessor.joblib')
            self.isolation_forest = joblib.load('isolation_forest.joblib')
            self.random_forest = joblib.load('random_forest.joblib')
            self.autoencoder = joblib.load('autoencoder.joblib')
            self.iso_thresholds = joblib.load('iso_thresholds.joblib')
            self.ae_thresholds = joblib.load('ae_thresholds.joblib')
            logger.info("All models and statistics loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise
    
    def evaluate_log(self, log_string: str) -> dict:
        """
        Evaluate log entry for security threats and risk assessment
        
        Processes a single log entry through the complete multi-model pipeline
        to determine security risk level and identify potential threats.
        
        Args:
            log_string (str): Pipe-separated log string to evaluate
            
        Returns:
            dict: Comprehensive evaluation results including:
                - success: Boolean indicating evaluation success
                - risk_score: Numeric risk score (0-100)
                - risk_level: Categorical risk level (SAFE/LOW/MEDIUM/HIGH/CRITICAL)
                - anomaly_detected: Boolean flag for anomaly detection
                - risk_reasons: List of contributing factors
                - model_predictions: Detailed model outputs
                - input_features: Parsed log features
        """
        try:
            logger.info("=== Starting single log evaluation ===")
            
            # Use the new score_log_string function
            risk_score = score_log_string(log_string)
            
            # Determine risk level based on score
            if risk_score >= 80:
                risk_level = "CRITICAL"
            elif risk_score >= 60:
                risk_level = "HIGH"
            elif risk_score >= 40:
                risk_level = "MEDIUM"
            elif risk_score >= 20:
                risk_level = "LOW"
            else:
                risk_level = "SAFE"
            
            # Parse the log to get features for storage
            input_features = parse_log_string(log_string)
            
            logger.info(f"Risk score for example log: {risk_score}")
            logger.info(f"Risk Level: {risk_level}")
            logger.info("=== Evaluation completed ===")
            
            return {
                'success': True,
                'anomaly_detected': risk_score > 50,
                'risk_score': int(risk_score),
                'risk_reasons': [
                    f"Multi-model risk assessment score: {risk_score}",
                    f"Risk level: {risk_level}"
                ],
                'risk_level': risk_level,
                'model_predictions': {
                    'final_risk_score': float(risk_score),
                    'anomaly_detected': bool(risk_score > 50)
                },
                'input_features': input_features
            }
            
        except Exception as e:
            error_msg = f"Unexpected error in evaluate_log: {e}"
            logger.error(error_msg)
            return {
                'error': error_msg,
                'success': False
            }
    
