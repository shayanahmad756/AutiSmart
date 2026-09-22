import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TherapyGameTransition = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/games', { replace: true });
    }, 1600);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '75vh' }}>
      <style>{`
        @keyframes therapyTransitionIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <div
        className="text-center p-5 bg-white rounded-4 shadow-lg"
        style={{ maxWidth: '520px', width: '100%', animation: 'therapyTransitionIn 0.45s ease-out both' }}
      >
        <div className="mb-3">
          <div className="spinner-border text-primary" role="status" aria-label="Starting therapy game">
            <span className="visually-hidden">Starting therapy game</span>
          </div>
        </div>
        <h2 className="mb-2 text-primary-custom">Now starting therapy game!</h2>
        <p className="text-muted mb-0">Preparing the next activity for you now.</p>
      </div>
    </div>
  );
};

export default TherapyGameTransition;