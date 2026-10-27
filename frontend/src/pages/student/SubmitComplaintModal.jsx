import React, { useState, useEffect } from 'react';
import { complaintsAPI } from '../../api/client';
import { Modal } from '../../components/Modal';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge } from '../../components/CategoryBadge';
import { Sparkles, AlertCircle, Info, Send } from 'lucide-react';

export const SubmitComplaintModal = ({ isOpen, onClose, defaultRoom = '', onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roomNumber, setRoomNumber] = useState(defaultRoom || '');
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (defaultRoom) {
      setRoomNumber(defaultRoom);
    }
  }, [defaultRoom]);

  // Debounced live AI prediction preview
  useEffect(() => {
    if (!description || description.trim().length < 5) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await complaintsAPI.preview({ title, description });
        setPreview(res.data);
      } catch (err) {
        console.error("Preview failed:", err);
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [title, description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a complaint title.');
      return;
    }
    if (!description.trim()) {
      setError('Please describe the issue in detail.');
      return;
    }
    if (!roomNumber.trim()) {
      setError('Please specify the room number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await complaintsAPI.submit({
        title: title.trim(),
        description: description.trim(),
        room_number: roomNumber.trim()
      });
      onSuccess?.(res.data);
      handleClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit complaint. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPreview(null);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Submit New Hostel Complaint"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleSubmit} 
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Complaint'}
            <Send size={15} />
          </button>
        </>
      }
    >
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#ef4444',
          borderRadius: '6px',
          fontSize: '0.85rem',
          marginBottom: '16px'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Complaint Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Leaking washroom pipe"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Room / Location *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., A-101"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Detailed Description *</label>
          <textarea
            className="form-textarea"
            placeholder="Describe the problem accurately. Our machine learning model will automatically triage and categorize the issue in real time..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </div>

        {/* Live AI Classification Preview */}
        {preview && (
          <div className="ai-preview-card">
            <div className="ai-preview-header">
              <Sparkles size={16} />
              <span>Real-Time AI Classification (TF-IDF + Naive Bayes)</span>
              {previewLoading && <span style={{ fontSize: '0.75rem', color: '#6366f1' }}>(Updating...)</span>}
            </div>

            <div className="ai-preview-grid">
              <div className="ai-preview-metric">
                <div className="ai-preview-metric-lbl">Predicted Category</div>
                <div className="ai-preview-metric-val">
                  <CategoryBadge category={preview.predicted_category} />
                </div>
              </div>
              <div className="ai-preview-metric">
                <div className="ai-preview-metric-lbl">Severity / Priority</div>
                <div className="ai-preview-metric-val">
                  <PriorityBadge priority={preview.predicted_priority} />
                </div>
              </div>
              <div className="ai-preview-metric">
                <div className="ai-preview-metric-lbl">Confidence Score</div>
                <div className="ai-preview-metric-val">
                  {Math.round(preview.confidence_score * 100)}%
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>Triage Rationale:</strong> {preview.priority_reason}
                {preview.is_fallback && (
                  <span style={{ display: 'block', color: '#b45309', marginTop: '2px' }}>
                    * Low confidence or unrecognized keywords; routed to manual warden triage queue.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
