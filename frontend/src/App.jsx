import React, { useState } from 'react';
import axios from 'axios';
import { Shield, BarChart3, Info } from 'lucide-react';
import ChurnForm from './components/ChurnForm';
import BatchUpload from './components/BatchUpload';

function App() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async (data) => {
    setLoading(true);
    setPrediction(null);
    try {
      const response = await axios.post('http://localhost:8000/predict', data);
      setPrediction(response.data);
    } catch (error) {
      console.error("Prediction failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="dashboard-header">
        <h1>Bank Customer Churn Dashboard</h1>
        <p>Advanced Machine Learning Prediction System • End-to-End MLOps</p>
      </header>

      <main className="grid-layout">
        <div className="main-content">
          <ChurnForm onPredict={handlePredict} />
          <div style={{ marginTop: '2rem' }}>
            <BatchUpload />
          </div>
        </div>

        <aside className="sidebar">
          <div className="glass-card" style={{ height: '100%' }}>
            <h2 className="section-title"><BarChart3 size={24} color="#6366f1" /> Prediction Analysis</h2>

            {loading && (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <p>Processing...</p>
              </div>
            )}

            {!loading && prediction ? (
              <div className="result-container">
                <div
                  className="probability-circle"
                  style={{
                    borderColor: prediction.churn_prediction === 1 ? '#ef4444' : '#22c55e',
                    boxShadow: `0 0 20px ${prediction.churn_prediction === 1 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                  }}
                >
                  <span className="value">{(prediction.churn_probability * 100).toFixed(1)}%</span>
                  <span className="label">Churn Risk</span>
                </div>

                <span className={`status-badge ${prediction.churn_prediction === 1 ? 'status-exited' : 'status-stayed'}`}>
                  {prediction.status}
                </span>

                <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <p>Based on the current profile, this customer is {prediction.churn_prediction === 1 ? 'likely to leave' : 'likely to stay'}.</p>
                </div>
              </div>
            ) : !loading && (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                <Info size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>Run a prediction to see the analysis results here.</p>
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer style={{ marginTop: '4rem', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
        <p>© 2026 • Advanced Python for Data Science • Tutor: Haythem Ghazouani</p>
      </footer>
    </div>
  );
}

export default App;
