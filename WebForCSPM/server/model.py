import pandas as pd
import numpy as np
import re
import joblib
import os
from typing import List, Tuple, Dict, Any

class MultiModelCSPM:
    """
    Multi-Model Cloud Security Posture Management System
    Uses Isolation Forest, Random Forest, Autoencoder, and Rule-based analysis
    """
    
    def __init__(self):
        self.isolation_forest = None
        self.random_forest = None
        self.autoencoder = None
        self.preprocessor = None
        self.models_loaded = False
        self.load_models()
    
    def load_models(self):
        """Load all trained models"""
        try:
            model_dir = os.path.dirname(os.path.abspath(__file__))
            
            # Load models
            isolation_path = os.path.join(model_dir, 'model_isolation_forest.pkl')
            random_forest_path = os.path.join(model_dir, 'model_random_forest.pkl')
            autoencoder_path = os.path.join(model_dir, 'model_autoencoder.pkl')
            preprocessor_path = os.path.join(model_dir, 'preprocessor.pkl')
            
            if (os.path.exists(isolation_path) and os.path.exists(random_forest_path) and 
                os.path.exists(autoencoder_path) and os.path.exists(preprocessor_path)):
                
                self.isolation_forest = joblib.load(isolation_path)
                self.random_forest = joblib.load(random_forest_path)
                self.autoencoder = joblib.load(autoencoder_path)
                self.preprocessor = joblib.load(preprocessor_path)
                self.models_loaded = True
                print("All models loaded successfully")
            else:
                print("Some model files are missing")
                self.models_loaded = False
                
        except Exception as e:
            print(f"Error loading models: {e}")
            self.models_loaded = False
    
    def preprocess_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str], List[str]]:
        """
        Preprocess data exactly as in the Kaggle training code
        """
        # Handle missing values
        df['errorCode'] = df['errorCode'].fillna('NoError')
        
        # Extract features
        df['isRootUser'] = df['userIdentitytype'].apply(lambda x: 1 if x == 'Root' else 0)
        
        # Parse IP address
        def extract_ip_features(ip):
            parts = str(ip).split('.')
            if len(parts) >= 2:
                return int(parts[0]), int(parts[1])
            return 0, 0
        
        df['ip_first_octet'], df['ip_second_octet'] = zip(*df['sourceIPAddress'].apply(extract_ip_features))
        
        # Flag suspicious ARN patterns
        df['has_suspicious_arn'] = df['userIdentityarn'].apply(
            lambda x: 1 if re.search(r'role/.*admin|user/admin|root', str(x).lower()) else 0
        )
        
        # Sensitive actions
        sensitive_actions = ['Create', 'Delete', 'Modify', 'Put', 'Update']
        df['is_sensitive_action'] = df['eventName'].apply(
            lambda x: 1 if any(action in str(x) for action in sensitive_actions) else 0
        )
        
        # Error flag
        df['has_error'] = df['errorCode'].apply(lambda x: 0 if x == 'NoError' else 1)
        
        # Define columns
        categorical_columns = [
            'eventSource', 'awsRegion', 'userIdentitytype', 
            'eventType', 'eventName', 'userAgent'
        ]
        
        feature_columns = [
            'isRootUser', 'ip_first_octet', 'ip_second_octet', 
            'has_suspicious_arn', 'is_sensitive_action', 'has_error'
        ]
        
        all_feature_columns = categorical_columns + feature_columns
        
        return df, all_feature_columns, feature_columns
    
    def apply_rules(self, df: pd.DataFrame) -> List[List[str]]:
        """
        Apply rule-based detection exactly as in Kaggle code
        """
        flags = []
        for _, row in df.iterrows():
            reasons = []
            if row['isRootUser'] == 1 and row['is_sensitive_action'] == 1:
                reasons.append("Root user performing sensitive action")
            if row['has_error'] == 1:
                reasons.append(f"Error code detected: {row['errorCode']}")
            if row['ip_first_octet'] > 223:
                reasons.append(f"Unusual IP range: {row['sourceIPAddress']}")
            if row['has_suspicious_arn'] == 1:
                reasons.append("Suspicious ARN pattern")
            flags.append(reasons)
        return flags
    
    def calculate_risk_scores(self, df: pd.DataFrame, iso_preds: np.ndarray, 
                            rf_preds: np.ndarray, ae_errors: np.ndarray, 
                            rule_explanations: List[List[str]]) -> List[Tuple[int, List[str]]]:
        """
        Calculate risk scores exactly as in Kaggle code
        """
        scores = []
        for i in range(len(df)):
            score = 0
            reasons = []
            
            # Isolation Forest weight (40 points)
            if iso_preds[i] == -1:
                score += 40
                reasons.append("Anomaly detected by Isolation Forest")
            
            # Random Forest weight (30 points)
            if rf_preds[i] == 1:
                score += 30
                reasons.append("Risky pattern detected by Random Forest")
            
            # Autoencoder Reconstruction Error (20 points)
            if ae_errors[i] > np.percentile(ae_errors, 95):
                score += 20
                reasons.append("Anomaly detected by Autoencoder")
            
            # Rule-based detections (10 points each)
            if rule_explanations[i]:
                score += 10 * len(rule_explanations[i])
                reasons += rule_explanations[i]
            
            # Cap score to 100
            score = min(score, 100)
            scores.append((score, reasons))
        
        return scores
    
    def evaluate_log(self, log_data: str) -> Dict[str, Any]:
        """
        Evaluate a single log entry in pipe-separated format
        Format: feature1|feature2|feature3|feature4|...
        """
        try:
            # Parse pipe-separated log data
            features = log_data.split('|')
            if len(features) != 18:
                return {
                    'error': f'Expected 18 features, got {len(features)}',
                    'success': False
                }
            
            # Create DataFrame with original column names
            columns = [
                'eventID', 'eventTime', 'sourceIPAddress', 'userAgent', 'eventName',
                'eventSource', 'awsRegion', 'eventVersion', 'userIdentitytype', 'eventType',
                'userIdentityaccountId', 'userIdentityprincipalId', 'userIdentityarn',
                'userIdentityaccessKeyId', 'userIdentityuserName', 'errorCode',
                'errorMessage', 'requestParametersinstanceType'
            ]
            
            df = pd.DataFrame([features], columns=columns)
            
            # Preprocess data
            df, all_feature_columns, feature_columns = self.preprocess_data(df)
            
            if not self.models_loaded:
                # Fallback to rule-based only
                rule_explanations = self.apply_rules(df)
                risk_scores = [(10 * len(reasons), reasons) for reasons in rule_explanations]
                
                return {
                    'success': True,
                    'models_loaded': False,
                    'risk_score': risk_scores[0][0],
                    'risk_reasons': risk_scores[0][1],
                    'risk_level': 'HIGH' if risk_scores[0][0] >= 80 else 'MEDIUM' if risk_scores[0][0] >= 50 else 'LOW',
                    'model_predictions': {
                        'isolation_forest': None,
                        'random_forest': None,
                        'autoencoder': None
                    }
                }
            
            # Transform features using preprocessor
            X = df[all_feature_columns]
            X_transformed = self.preprocessor.transform(X)
            
            # Get model predictions
            iso_preds = self.isolation_forest.predict(X_transformed)
            rf_preds = self.random_forest.predict(X_transformed)
            ae_reconstructions = self.autoencoder.predict(X_transformed)
            ae_errors = np.mean((ae_reconstructions - X_transformed) ** 2, axis=1)
            
            # Apply rule-based analysis
            rule_explanations = self.apply_rules(df)
            
            # Calculate risk scores
            risk_scores = self.calculate_risk_scores(df, iso_preds, rf_preds, ae_errors, rule_explanations)
            
            # Get results for this log
            risk_score, risk_reasons = risk_scores[0]
            
            # Determine risk level
            if risk_score >= 80:
                risk_level = "HIGH"
            elif risk_score >= 50:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"
            
            return {
                'success': True,
                'models_loaded': True,
                'risk_score': risk_score,
                'risk_reasons': risk_reasons,
                'risk_level': risk_level,
                'model_predictions': {
                    'isolation_forest': int(iso_preds[0]),
                    'random_forest': int(rf_preds[0]),
                    'autoencoder_error': float(ae_errors[0]),
                    'isolation_anomaly': bool(iso_preds[0] == -1),
                    'random_forest_risk': bool(rf_preds[0] == 1),
                    'autoencoder_anomaly': bool(ae_errors[0] > np.percentile(ae_errors, 95))
                },
                'input_features': {
                    'eventID': features[0],
                    'eventName': features[4],
                    'userIdentitytype': features[8],
                    'sourceIPAddress': features[2],
                    'isRootUser': int(df['isRootUser'].iloc[0]),
                    'is_sensitive_action': int(df['is_sensitive_action'].iloc[0]),
                    'has_error': int(df['has_error'].iloc[0])
                }
            }
            
        except Exception as e:
            return {
                'error': f'Evaluation failed: {str(e)}',
                'success': False
            }
    
    def evaluate_batch(self, log_data_list: List[str]) -> List[Dict[str, Any]]:
        """
        Evaluate multiple log entries
        """
        results = []
        for log_data in log_data_list:
            result = self.evaluate_log(log_data)
            results.append(result)
        return results 