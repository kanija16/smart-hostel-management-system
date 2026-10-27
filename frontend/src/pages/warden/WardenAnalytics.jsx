import React, { useState, useEffect } from 'react';
import { statsAPI } from '../../api/client';
import { MetricCard } from '../../components/MetricCard';
import { CategoryBadge } from '../../components/CategoryBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { 
  BarChart3, 
  Sparkles, 
  PieChart, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Info,
  ShieldCheck 
} from 'lucide-react';

export const WardenAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await statsAPI.getDashboard();
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load analytics stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading AI triage analytics...
        </div>
      </div>
    );
  }

  const categoryData = stats?.complaints_by_category || {};
  const priorityData = stats?.complaints_by_priority || {};
  const statusData = stats?.complaints_by_status || {};
  const total = stats?.total_complaints || 1;

  return (
    <div className="page-container">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Analytics & AI Classification Insights</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Real-time machine learning grievance distribution, priority metrics, and resolution rates
        </p>
      </div>

      {/* Overview Cards */}
      <div className="stats-grid">
        <MetricCard
          title="Total Complaints Triaged"
          value={stats?.total_complaints || 0}
          icon={BarChart3}
          color="#3b82f6"
        />
        <MetricCard
          title="Active Open Complaints"
          value={stats?.active_complaints || 0}
          icon={AlertTriangle}
          color="#f59e0b"
          subtitle="Submitted & In Progress"
        />
        <MetricCard
          title="Resolved Complaints"
          value={stats?.resolved_complaints || 0}
          icon={CheckCircle2}
          color="#10b981"
          subtitle={`${Math.round(((stats?.resolved_complaints || 0) / total) * 100)}% Resolution Rate`}
        />
        <MetricCard
          title="Pending Room Requests"
          value={stats?.pending_room_requests || 0}
          icon={Cpu}
          color="#8b5cf6"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Complaints by Category</h3>
              <p className="card-subtitle">Classified by TF-IDF + Multinomial Naive Bayes Model</p>
            </div>
            <Sparkles size={18} color="#6366f1" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.keys(categoryData).length === 0 ? (
              <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No complaints recorded yet.</div>
            ) : (
              Object.entries(categoryData).map(([cat, count]) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <CategoryBadge category={cat} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        {count} tickets ({pct}%)
                      </span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                        borderRadius: '4px'
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Complaints by Priority</h3>
              <p className="card-subtitle">Assigned by Hazard & Urgency Evaluation Engine</p>
            </div>
            <ShieldCheck size={18} color="#ef4444" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {['Critical', 'High', 'Medium', 'Low'].map(prio => {
              const count = priorityData[prio] || 0;
              const pct = Math.round((count / total) * 100);
              const colorMap = {
                Critical: '#ef4444',
                High: '#f97316',
                Medium: '#eab308',
                Low: '#64748b'
              };
              return (
                <div key={prio}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <PriorityBadge priority={prio} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      {count} tickets ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: colorMap[prio],
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Architecture Transparency Box */}
      <div className="card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Sparkles size={20} color="#4338ca" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e1b4b' }}>
            AI Classification System Specifications & Transparency
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '0.86rem', color: '#334155', lineHeight: 1.6 }}>
          <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>1. Category Machine Learning</h4>
            <p>
              Trained scikit-learn pipeline utilizing <strong>TfidfVectorizer</strong> (sublinear term frequency scaling, n-gram range 1-2) and <strong>Multinomial Naive Bayes</strong> (alpha=0.1) on 150+ diverse hostel complaint samples.
            </p>
          </div>

          <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>2. Documented Fallback Mechanism</h4>
            <p>
              When input tokens are out-of-vocabulary (unrecognized gibberish) or the ML model's maximum prediction probability falls below the confidence threshold (0.35), the system routes to category <strong>Other</strong> with <strong>Low</strong> priority and sets <code>is_fallback: True</code>.
            </p>
          </div>

          <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>3. Deterministic Priority Engine</h4>
            <p>
              Prioritization (Critical, High, Medium, Low) uses an explicit domain severity protocol to detect fire/spark safety hazards, pipe bursts, and security breaches. Keyword heuristics are never misrepresented as ML.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
