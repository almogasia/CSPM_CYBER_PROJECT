import pandas as pd
import numpy as np
import re
import joblib
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


def preprocess_data(df):
    # Clean and engineer features
    df['sourceIPAddress'] = df['sourceIPAddress'].fillna('0.0.0.0')
    df['ip_first_octet'] = df['sourceIPAddress'].apply(lambda x: int(str(x).split('.')[0]) if str(x).split('.')[0].isdigit() else 0)
    df['ip_second_octet'] = df['sourceIPAddress'].apply(lambda x: int(str(x).split('.')[1]) if len(str(x).split('.')) > 1 and str(x).split('.')[1].isdigit() else 0)

    df['userIdentityarn'] = df['userIdentityarn'].fillna('')
    df['has_suspicious_arn'] = df['userIdentityarn'].apply(lambda x: 1 if re.search(r'admin|root|super', x, re.IGNORECASE) else 0)
    df['isRootUser'] = (df['userIdentitytype'] == 'Root').astype(int)
    df['errorCode'] = df['errorCode'].fillna('NoError')

    # Drop irrelevant fields
    df = df.drop(columns=['eventID', 'userIdentitytype', 'userIdentityarn', 'sourceIPAddress'])

    return df


def score_single_log(log_dict):
    preprocessor = joblib.load('preprocessor.joblib')
    isolation_forest = joblib.load('isolation_forest.joblib')
    random_forest = joblib.load('random_forest.joblib')
    autoencoder = joblib.load('autoencoder.joblib')
    ae_threshold = joblib.load('ae_threshold.joblib')
    iso_min, iso_max = joblib.load('iso_min_max.joblib')
    ae_mean, ae_std = joblib.load('ae_mean_std.joblib')

    df_log = pd.DataFrame([log_dict])
    df_log = preprocess_data(df_log)
    X_log = preprocessor.transform(df_log)
    
    # Check sparsity
    non_zero_count = np.count_nonzero(X_log)
    total_elements = X_log.size
    sparsity = 1 - (non_zero_count / total_elements)
    print(f"Data sparsity: {sparsity:.4f} ({non_zero_count}/{total_elements} non-zero elements)")
    
    # Check the actual model inputs
    iso_pred_raw = isolation_forest.decision_function(X_log)[0]
    print(f"Raw Isolation Forest decision: {iso_pred_raw}")
    iso_score = -iso_pred_raw
    iso_score = (iso_score - iso_min) / (iso_max - iso_min)
    iso_score = np.clip(iso_score, 0, 1)

    # Random Forest probability
    rf_pred_proba = random_forest.predict_proba(X_log)[0][1]

    # Autoencoder error and scoring with sigmoid scaling
    recon = autoencoder.predict(X_log)
    if recon.ndim == 1:
        recon = recon.reshape(1, -1)
    if recon.shape[1] != X_log.shape[1]:
        recon = np.tile(recon, (1, X_log.shape[1]))

    ae_error = np.mean((X_log - recon) ** 2)
    ae_score_raw = (ae_error - ae_mean) / ae_std
    ae_score = 1 / (1 + np.exp(-ae_score_raw))  # sigmoid to [0,1]

    # Weighted combination
    final_score = 0.4 * iso_score + 0.3 * rf_pred_proba + 0.3 * ae_score
    final_score_percentage = final_score * 100

    # Round to nearest multiple of 5
    rounded_score = round(final_score_percentage / 5) * 5

    return rounded_score


class MultiModelCSPM:
    """
    Multi-Model CSPM System using the exact implementation from the provided code
    """
    
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
            logger.info("Loading models from joblib files...")
            self.preprocessor = joblib.load('preprocessor.joblib')
            self.isolation_forest = joblib.load('isolation_forest.joblib')
            self.random_forest = joblib.load('random_forest.joblib')
            self.autoencoder = joblib.load('autoencoder.joblib')
            self.ae_threshold = joblib.load('ae_threshold.joblib')
            self.iso_min, self.iso_max = joblib.load('iso_min_max.joblib')
            self.ae_mean, self.ae_std = joblib.load('ae_mean_std.joblib')
            logger.info("All models and statistics loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise
    
    def evaluate_log(self, log_string: str) -> dict:
        """
        Evaluate a single log using the exact same logic as provided code
        """
        try:
            logger.info("=== Starting single log evaluation ===")
            
            # Step 1: Convert pipe-separated string to DataFrame
            df_log = log_line_to_df(log_string)
            logger.info(f"Created DataFrame with shape: {df_log.shape}")
            
            # Step 2: Convert DataFrame to dictionary
            example_log = df_log.iloc[0].to_dict()
            logger.info(f"Converted to dictionary with {len(example_log)} fields")
            
            # Step 3: Use the exact same logic as score_single_log
            risk_score = score_single_log(example_log)
            
            # Determine risk level based on rounded score
            if risk_score >= 90:
                risk_level = "CRITICAL"
            elif risk_score >= 70:
                risk_level = "HIGH"
            elif risk_score >= 40:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"
            
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
                'input_features': example_log
            }
            
        except Exception as e:
            error_msg = f"Unexpected error in evaluate_log: {e}"
            logger.error(error_msg)
            return {
                'error': error_msg,
                'success': False
            }
    
