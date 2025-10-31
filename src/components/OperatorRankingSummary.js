const OperatorRankingSummary = ({ sections }) => {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <div className="operator-ranking-shell">
      <div className="operator-ranking-scroll">
        <div className="operator-ranking-grid">
          {sections.map((section) => (
            <section key={section.key} className="operator-ranking-card">
              <header className="operator-ranking-card__header">
                <h3>{section.title}</h3>
                {section.subtitle && <p>{section.subtitle}</p>}
              </header>
              <ol className="operator-ranking-list">
                {section.items.map((item, index) => (
                  <li key={`${section.key}-${item.label}-${index}`} className="operator-ranking-list__item">
                    <span className="operator-ranking-list__index">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="operator-ranking-list__body">
                      <span className="operator-ranking-list__label">{item.label}</span>
                      {item.value !== null && item.value !== undefined && item.value !== '' && (
                        <span className="operator-ranking-list__value">{item.value}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OperatorRankingSummary;
