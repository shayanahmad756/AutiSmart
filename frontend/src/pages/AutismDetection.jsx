import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useChild } from '../context/ChildContext';
import childAPI from '../api/child.api';
import '../styles/AutismDetection.css';

const DISCLAIMER =
  'This tool is for preliminary screening purposes only and is NOT a medical diagnosis. ' +
  'Always consult a qualified healthcare professional for proper evaluation.';

const AutismDetection = () => {
  const navigate = useNavigate();
  const { childrenList, selectedChild, selectChild, loading: childrenLoading } = useChild();

  // ── Local state ─────────────────────────────────────────────────────────────
  const [mode, setMode] = useState('upload'); // 'upload' | 'camera'
  const [preview, setPreview] = useState(null); // data URL for display
  const [imageFile, setImageFile] = useState(null); // File | Blob to submit
  const [dragging, setDragging] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { label, confidence, confidence_percent, date }
  const [submitError, setSubmitError] = useState('');

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);

  // ── Load detection history whenever the selected child changes ───────────────
  useEffect(() => {
    if (!selectedChild) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    childAPI.getAutismDetections(selectedChild.id)
      .then(res => setHistory(res.data?.detections || []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [selectedChild]);

  // ── File helpers ─────────────────────────────────────────────────────────────
  const applyFile = (file) => {
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setSubmitError('');
  };

  const handleFileChange = (e) => {
    applyFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    applyFile(e.dataTransfer.files[0]);
  };

  // ── Webcam capture ───────────────────────────────────────────────────────────
  const capturePhoto = useCallback(() => {
    const dataUrl = webcamRef.current?.getScreenshot();
    if (!dataUrl) return;
    setPreview(dataUrl);
    // Convert data URL to Blob
    fetch(dataUrl)
      .then(r => r.blob())
      .then(blob => {
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        setImageFile(file);
        setResult(null);
        setSubmitError('');
      });
  }, []);

  const resetCapture = () => {
    setPreview(null);
    setImageFile(null);
    setResult(null);
    setSubmitError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedChild) return setSubmitError('Please select a child first.');
    if (!imageFile) return setSubmitError('Please provide an image.');

    setSubmitting(true);
    setSubmitError('');
    setResult(null);

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const res = await childAPI.detectAutism(selectedChild.id, formData);
      const detection = res.data;
      setResult(detection);
      // Prepend to local history
      setHistory(prev => [detection, ...prev]);
    } catch (err) {
      setSubmitError(err.message || 'Detection failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Rendering helpers ────────────────────────────────────────────────────────
  const isAutistic = result?.label === 'autistic';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="autism-detection-page container-fluid py-4 px-3 px-md-4">
      {/* ── Header ── */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <div>
          <h4 className="mb-0 fw-bold">Autism Screen Detection</h4>
          <p className="text-muted small mb-0">Upload or capture your child's facial photo for AI screening</p>
        </div>
      </div>

      {/* ── Disclaimer banner ── */}
      <div className="alert alert-warning d-flex gap-2 align-items-start mb-4" role="alert">
        <i className="bi bi-exclamation-triangle-fill flex-shrink-0 mt-1"></i>
        <span className="small">{DISCLAIMER}</span>
      </div>

      <div className="row g-4">
        {/* ── Left column: child selector + image input ── */}
        <div className="col-12 col-lg-6">
          {/* Child selector */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h6 className="card-title fw-semibold mb-3">
                <i className="bi bi-person-check me-2 text-primary"></i>Select Child
              </h6>
              {childrenLoading ? (
                <div className="text-center py-2">
                  <div className="spinner-border spinner-border-sm" role="status" />
                </div>
              ) : childrenList.length === 0 ? (
                <p className="text-muted small mb-0">
                  No children added yet.{' '}
                  <button className="btn btn-link btn-sm p-0" onClick={() => navigate('/child-management')}>
                    Add a child
                  </button>
                </p>
              ) : (
                <div className="row g-2">
                  {childrenList.map(child => (
                    <div key={child.id} className="col-auto">
                      <button
                        className={`child-pill ${selectedChild?.id === child.id ? 'active' : ''}`}
                        onClick={() => { selectChild(child); resetCapture(); }}
                      >
                        <span className="child-pill-avatar">{child.name.charAt(0).toUpperCase()}</span>
                        <span>{child.name}</span>
                        <span className="text-muted small ms-1">({child.age}y)</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mode toggle */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex gap-2 mb-3">
                <button
                  className={`btn btn-sm flex-fill ${mode === 'upload' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => { setMode('upload'); resetCapture(); }}
                >
                  <i className="bi bi-upload me-2"></i>Upload Photo
                </button>
                <button
                  className={`btn btn-sm flex-fill ${mode === 'camera' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => { setMode('camera'); resetCapture(); }}
                >
                  <i className="bi bi-camera me-2"></i>Use Camera
                </button>
              </div>

              {/* ── Upload mode ── */}
              {mode === 'upload' && !preview && (
                <div
                  className={`upload-zone ${dragging ? 'dragging' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  <i className="bi bi-image-fill upload-icon"></i>
                  <p className="mb-1 fw-medium">Drag & drop a photo here</p>
                  <p className="text-muted small mb-0">or click to browse (JPG, PNG, WebP — max 10 MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {/* ── Camera mode ── */}
              {mode === 'camera' && !preview && (
                <div className="text-center">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: 'user' }}
                    mirrored
                    className="webcam-feed rounded mb-3"
                    style={{ width: '100%', maxHeight: 320, objectFit: 'cover' }}
                  />
                  <button className="btn btn-primary" onClick={capturePhoto}>
                    <i className="bi bi-camera-fill me-2"></i>Capture Photo
                  </button>
                </div>
              )}

              {/* ── Preview (shared for both modes) ── */}
              {preview && (
                <div className="text-center">
                  <img
                    src={preview}
                    alt="Selected"
                    className="img-fluid rounded mb-3 shadow-sm"
                    style={{ maxHeight: 300, objectFit: 'contain' }}
                  />
                  <div className="d-flex gap-2 justify-content-center">
                    <button className="btn btn-outline-secondary btn-sm" onClick={resetCapture}>
                      <i className="bi bi-arrow-counterclockwise me-1"></i>
                      {mode === 'camera' ? 'Re-capture' : 'Choose another'}
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={handleSubmit}
                      disabled={submitting || !selectedChild}
                    >
                      {submitting ? (
                        <><span className="spinner-border spinner-border-sm me-2" role="status" />Analyzing…</>
                      ) : (
                        <><i className="bi bi-cpu me-2"></i>Run Detection</>
                      )}
                    </button>
                  </div>
                  {submitError && (
                    <div className="alert alert-danger mt-3 mb-0 py-2 small">{submitError}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column: result + history ── */}
        <div className="col-12 col-lg-6">
          {/* Result panel */}
          {result && (
            <div className={`card shadow-sm mb-4 result-card ${isAutistic ? 'result-autistic' : 'result-non-autistic'}`}>
              <div className="card-body text-center py-4">
                <div className={`result-badge mb-3 ${isAutistic ? 'badge-autistic' : 'badge-non-autistic'}`}>
                  <i className={`bi ${isAutistic ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill'} me-2`}></i>
                  {isAutistic ? 'Autistic Indicators Detected' : 'No Autistic Indicators'}
                </div>

                <div className="mb-3">
                  <p className="small text-muted mb-1">Confidence Score</p>
                  <div className="confidence-bar-track mx-auto">
                    <div
                      className={`confidence-bar-fill ${isAutistic ? 'fill-autistic' : 'fill-non-autistic'}`}
                      style={{ width: `${result.confidence_percent ?? (result.confidence * 100)}%` }}
                    />
                  </div>
                  <p className="fw-bold mt-1 mb-0">
                    {(result.confidence_percent ?? (result.confidence * 100)).toFixed(1)}%
                  </p>
                </div>

                <p className="text-muted small mb-0">
                  <i className="bi bi-clock me-1"></i>
                  {result.date ? formatDate(result.date) : 'Just now'} — Result saved for {result.childName || selectedChild?.name}
                </p>
              </div>
            </div>
          )}

          {/* Detection history */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title fw-semibold mb-3">
                <i className="bi bi-clock-history me-2 text-primary"></i>Detection History
                {selectedChild && <span className="text-muted fw-normal"> — {selectedChild.name}</span>}
              </h6>

              {!selectedChild ? (
                <p className="text-muted small mb-0">Select a child to view their detection history.</p>
              ) : historyLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm" role="status" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-muted small mb-0">No detections recorded yet.</p>
              ) : (
                <div className="history-list">
                  {history.map((item, idx) => (
                    <div key={idx} className="history-item d-flex align-items-center gap-3 py-2">
                      <span className={`history-dot ${item.label === 'autistic' ? 'dot-autistic' : 'dot-non-autistic'}`} />
                      <div className="flex-grow-1 min-w-0">
                        <p className="mb-0 small fw-medium">
                          {item.label === 'autistic' ? 'Autistic Indicators' : 'No Indicators'}
                        </p>
                        <p className="mb-0 text-muted" style={{ fontSize: '0.78rem' }}>
                          {formatDate(item.date)}
                        </p>
                      </div>
                      <span className="badge bg-light text-dark border">
                        {((item.confidence ?? 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutismDetection;
