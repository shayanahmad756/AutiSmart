const StatCard = ({ value, label, icon, variant = 'stat' }) => {
  return (
    <div className={`stat-card card-${variant}`}>
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
        </div>
        {icon && (
          <div className="fs-1 text-muted opacity-50" style={{ paddingRight: '8px' }}>
            <i className={`bi ${icon}`}></i>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
