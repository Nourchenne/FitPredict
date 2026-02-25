export interface PredictionRequest {
  Gender: string;
  Age: number;
  Height: number;
  Weight: number;
  family_history_with_overweight: string;
  FAVC: string;
  FCVC: number;
  NCP: number;
  CAEC: string;
  SMOKE: string;
  CH2O: number;
  SCC: string;
  FAF: number;
  TUE: number;
  CALC: string;
  MTRANS: string;
}

export interface PredictionResponse {
  prediction_id: number;
  prediction_label: string;
  probability: number;
  status: string;
  message?: string;
}

export interface BatchPredictionResult {
  Gender?: string;
  Age?: number;
  obesity_level: string;
  probability: number;
  [key: string]: any;
}
