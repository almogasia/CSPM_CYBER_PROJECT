import joblib
import numpy as np
import pandas as pd
import re
from typing import List, Dict, Any, Tuple, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def log_line_to_df(log_line: str) -> pd.DataFrame:
    columns = [
        "eventID", "eventTime", "sourceIPAddress", "userAgent", "eventName",
        "eventSource", "awsRegion", "eventVersion", "userIdentitytype",
        "eventType", "userIdentityaccountId", "userIdentityprincipalId",
        "userIdentityarn", "userIdentityaccessKeyId", "userIdentityuserName",
        "errorCode", "errorMessage", "requestParametersinstanceType"
    ]
    values = log_line.split('|')
    if len(values) != len(columns):
        raise ValueError(f"Expected {len(columns)} features, but got {len(values)}")
    return pd.DataFrame([values], columns=columns)

class MultiModelCSPM:
    """
    Multi-Model CSPM System using Isolation Forest, Random Forest, and Autoencoder
    Based on the new Kaggle notebook implementation
    """
    
    # Expected field names for validation
    EXPECTED_FIELDS = [
        'eventID', 'eventTime', 'sourceIPAddress', 'userAgent', 'eventName', 
        'eventSource', 'awsRegion', 'eventVersion', 'userIdentitytype', 'eventType',
        'userIdentityaccountId', 'userIdentityprincipalId', 'userIdentityarn', 
        'userIdentityaccessKeyId', 'userIdentityuserName', 'errorCode', 
        'errorMessage', 'requestParametersinstanceType'
    ]
    
    def __init__(self):
        self.preprocessor = None
        self.isolation_forest = None
        self.random_forest = None
        self.autoencoder = None
        self.ae_threshold = None
        self.iso_min = None
        self.iso_max = None
        self.ae_mean = None
        self.ae_std = None
        self.load_models()
    
    def load_models(self):
        """Load pre-trained models and statistics"""
        try:
            logger.info("Loading new multi-model system...")
            self.preprocessor = joblib.load('preprocessor.joblib')
            self.isolation_forest = joblib.load('isolation_forest.joblib')
            self.random_forest = joblib.load('random_forest.joblib')
            self.autoencoder = joblib.load('autoencoder.joblib')
            self.ae_threshold = joblib.load('ae_threshold.joblib')
            self.iso_min, self.iso_max = joblib.load('iso_min_max.joblib')
            self.ae_mean, self.ae_std = joblib.load('ae_mean_std.joblib')
            logger.info("All models and statistics loaded successfully")
            
            # Log the loaded statistics for verification
            logger.info(f"Loaded statistics:")
            logger.info(f"  iso_min: {self.iso_min}, iso_max: {self.iso_max}")
            logger.info(f"  ae_mean: {self.ae_mean}, ae_std: {self.ae_std}")
            logger.info(f"  ae_threshold: {self.ae_threshold}")
            
            # Verify models are working by checking their basic properties
            logger.info(f"Model verification:")
            logger.info(f"  Isolation Forest contamination: {self.isolation_forest.contamination}")
            logger.info(f"  Random Forest n_estimators: {self.random_forest.n_estimators}")
            logger.info(f"  Autoencoder hidden_layer_sizes: {self.autoencoder.hidden_layer_sizes}")
            logger.info(f"  Preprocessor transformers: {[name for name, _, _ in self.preprocessor.transformers]}")
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise
    
    def validate_log_input(self, log_string: str) -> Tuple[bool, str, Optional[List[str]]]:
        """
        Validate input log string format and parse fields
        Returns: (is_valid, error_message, parsed_fields)
        """
        try:
            # Split by pipe and check field count
            fields = log_string.strip().split('|')
            
            if len(fields) != len(self.EXPECTED_FIELDS):
                return False, f"Expected {len(self.EXPECTED_FIELDS)} fields, got {len(fields)}", None
            
            # Check for empty or None fields
            for i, field in enumerate(fields):
                if field is None or field == '':
                    logger.warning(f"Empty field at position {i}: {self.EXPECTED_FIELDS[i]}")
                    fields[i] = 'unknown'  # Safe fallback
            
            return True, "", fields
            
        except Exception as e:
            return False, f"Error parsing log string: {e}", None
    
    def preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess data exactly as in the new Kaggle notebook
        """
        # Clean and engineer features
        df['sourceIPAddress'] = df['sourceIPAddress'].fillna('0.0.0.0')
        df['ip_first_octet'] = df['sourceIPAddress'].apply(lambda x: int(str(x).split('.')[0]) if str(x).split('.')[0].isdigit() else 0)
        df['ip_second_octet'] = df['sourceIPAddress'].apply(lambda x: int(str(x).split('.')[1]) if len(str(x).split('.')) > 1 and str(x).split('.')[1].isdigit() else 0)

        df['userIdentityarn'] = df['userIdentityarn'].fillna('')
        df['has_suspicious_arn'] = df['userIdentityarn'].apply(lambda x: 1 if re.search(r'admin|root|super', x, re.IGNORECASE) else 0)
        df['isRootUser'] = (df['userIdentitytype'] == 'Root').astype(int)
        df['errorCode'] = df['errorCode'].fillna('NoError')
        
        # Convert eventVersion to float to match working system
        df['eventVersion'] = pd.to_numeric(df['eventVersion'], errors='coerce').fillna(1.0)

        # Drop irrelevant fields
        df = df.drop(columns=['eventID', 'userIdentitytype', 'userIdentityarn', 'sourceIPAddress'])
        
        return df
    
    def evaluate_log(self, log_string: str) -> Dict[str, Any]:
        """
        Evaluate a single log using the exact same logic as Kaggle notebook
        """
        try:
            logger.info("=== Starting single log evaluation with new system ===")
            
            # Step 1: Convert pipe-separated string to DataFrame
            df_log = log_line_to_df(log_string)
            logger.info(f"Created DataFrame with shape: {df_log.shape}")
            
            # Step 2: Convert DataFrame to dictionary
            example_log = df_log.iloc[0].to_dict()
            logger.info(f"Converted to dictionary with {len(example_log)} fields")
            
            # Step 3: Use the exact same logic as score_single_log
            df_log = pd.DataFrame([example_log])
            df_log = self.preprocess_data(df_log)
            
            # DON'T filter columns - send the full DataFrame to the preprocessor
            # The preprocessor was trained on the full DataFrame, not just 7 columns
            
            X_log = self.preprocessor.transform(df_log)
            
            logger.info(f"Processing log with eventID: {example_log['eventID']}")
            logger.info(f"Created dictionary with {len(example_log)} fields including engineered features")
            
            # Use the exact same logic as the second version of score_single_log
            # df_log = pd.DataFrame([log_dict]) # REMOVED - this was causing double preprocessing
            
            logger.info(f"Preprocessed DataFrame shape: {df_log.shape}")
            logger.info(f"Preprocessed DataFrame columns: {list(df_log.columns)}")
            logger.info(f"Preprocessed DataFrame sample:")
            for col in df_log.columns:
                logger.info(f"  {col}: {df_log[col].iloc[0]} (type: {type(df_log[col].iloc[0])})")
            
            # Check data types before transformation
            logger.info(f"Data type verification:")
            for col in df_log.columns:
                logger.info(f"  {col}: {df_log[col].dtype}")
            
            # Check if categorical values are known to the preprocessor
            logger.info(f"Checking categorical values:")
            logger.info(f"  eventName: '{df_log['eventName'].iloc[0]}'")
            logger.info(f"  eventSource: '{df_log['eventSource'].iloc[0]}'")
            logger.info(f"  errorCode: '{df_log['errorCode'].iloc[0]}'")
            
            # Check what features the preprocessor expects
            logger.info(f"Preprocessor feature names:")
            logger.info(f"  Numeric features: {self.preprocessor.named_transformers_['num'].get_feature_names_out()}")
            logger.info(f"  Categorical features: {self.preprocessor.named_transformers_['cat'].get_feature_names_out()}")
            
            # Check what categorical values the preprocessor was trained on
            try:
                cat_transformer = self.preprocessor.named_transformers_['cat']
                if hasattr(cat_transformer, 'named_steps') and 'onehot' in cat_transformer.named_steps:
                    onehot = cat_transformer.named_steps['onehot']
                    if hasattr(onehot, 'categories_'):
                        logger.info(f"Categorical categories:")
                        for i, cat_name in enumerate(['eventName', 'eventSource', 'errorCode']):
                            if i < len(onehot.categories_):
                                logger.info(f"  {cat_name}: {len(onehot.categories_[i])} unique values")
                                # Check if current value is in the training categories
                                current_value = df_log[cat_name].iloc[0]
                                if current_value in onehot.categories_[i]:
                                    logger.info(f"    '{current_value}' is KNOWN")
                                else:
                                    logger.info(f"    '{current_value}' is UNKNOWN")
            except Exception as e:
                logger.info(f"Could not inspect categorical categories: {e}")
            
            # X_log = self.preprocessor.transform(df_log) # REMOVED - this line was moved up
            logger.info(f"Transformed data shape: {X_log.shape}")
            logger.info(f"Transformed data sample (first 10 values): {X_log[0][:10]}")
            logger.info(f"Transformed data min/max: {X_log.min()}, {X_log.max()}")
            
            # Check sparsity of the transformed data
            non_zero_count = np.count_nonzero(X_log)
            total_elements = X_log.size
            sparsity = 1 - (non_zero_count / total_elements)
            logger.info(f"Data sparsity: {sparsity:.4f} ({non_zero_count}/{total_elements} non-zero elements)")
            
            # If the data is too sparse, this might be causing the high scores
            if sparsity > 0.95:  # More than 95% zeros
                logger.warning(f"WARNING: Very sparse data detected! This might cause high anomaly scores.")
                logger.warning(f"The models were trained on denser data patterns, not single isolated logs.")

            # Isolation Forest score normalization (EXACT from Kaggle)
            iso_pred_raw = self.isolation_forest.decision_function(X_log)[0]
            iso_score = -iso_pred_raw
            iso_score = (iso_score - self.iso_min) / (self.iso_max - self.iso_min)
            iso_score = np.clip(iso_score, 0, 1)

            # Random Forest probability (EXACT from Kaggle)
            rf_pred_proba = self.random_forest.predict_proba(X_log)[0][1]

            # Autoencoder error and scoring with sigmoid scaling (EXACT from Kaggle)
            recon = self.autoencoder.predict(X_log)
            if recon.ndim == 1:
                recon = recon.reshape(1, -1)
            if recon.shape[1] != X_log.shape[1]:
                recon = np.tile(recon, (1, X_log.shape[1]))

            ae_error = np.mean((X_log - recon) ** 2)
            ae_score_raw = (ae_error - self.ae_mean) / self.ae_std
            ae_score = 1 / (1 + np.exp(-ae_score_raw))  # sigmoid to [0,1]

            # Weighted combination (EXACT from Kaggle)
            final_score = 0.4 * iso_score + 0.3 * rf_pred_proba + 0.3 * ae_score
            final_score_percentage = final_score * 100

            # Round to nearest multiple of 5 (EXACT from Kaggle)
            rounded_score = round(final_score_percentage / 5) * 5
            
            # Determine risk level based on rounded score - EXACT from user specification
            if rounded_score >= 90:
                risk_level = "CRITICAL"
            elif rounded_score >= 70:
                risk_level = "HIGH"
            elif rounded_score >= 40:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"
            
            logger.info(f"=== DETAILED DEBUG ===")
            logger.info(f"Raw Isolation Forest decision: {iso_pred_raw}")
            logger.info(f"Isolation Forest min/max: {self.iso_min}, {self.iso_max}")
            logger.info(f"Normalized Isolation Forest score: {iso_score:.6f}")
            logger.info(f"Random Forest probability: {rf_pred_proba:.6f}")
            logger.info(f"Autoencoder reconstruction error: {ae_error:.8f}")
            logger.info(f"Autoencoder mean/std: {self.ae_mean:.8f}, {self.ae_std:.8f}")
            logger.info(f"Autoencoder raw score: {ae_score_raw:.6f}")
            logger.info(f"Autoencoder sigmoid score: {ae_score:.6f}")
            logger.info(f"Weighted combination: {final_score:.6f}")
            logger.info(f"Final percentage: {final_score_percentage:.2f}")
            logger.info(f"Rounded score: {rounded_score}")
            logger.info(f"Risk level: {risk_level}")
            logger.info(f"=== END DEBUG ===")
            
            logger.info(f"Risk Level: {risk_level}")
            logger.info("=== Evaluation completed ===")
            
            return {
                'success': True,
                'anomaly_detected': rounded_score > 20,
                'risk_score': int(rounded_score),
                'risk_reasons': [
                    f"Isolation Forest anomaly score: {iso_score:.2f}",
                    f"Random Forest risk probability: {rf_pred_proba:.2f}",
                    f"Autoencoder reconstruction error: {ae_error:.4f}"
                ],
                'risk_level': risk_level,
                'model_predictions': {
                    'isolation_forest_score': float(iso_score),
                    'random_forest_probability': float(rf_pred_proba),
                    'autoencoder_error': float(ae_error),
                    'autoencoder_score': float(ae_score),
                    'isolation_anomaly': bool(iso_score > 0.5),
                    'random_forest_risk': bool(rf_pred_proba > 0.5),
                    'autoencoder_anomaly': bool(ae_score > 0.5)
                },
                'input_features': example_log
            }
            
        except Exception as e:
            error_msg = f"Unexpected error in evaluate_log: {e}"
            logger.error(error_msg)
            return {
                'error': error_msg,
                'success': False
            }
    
