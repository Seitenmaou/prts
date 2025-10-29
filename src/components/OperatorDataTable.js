import { useMemo } from 'react';

const OperatorDataTable = ({
  columns,
  records,
  sortTrail,
  onSortToggle,
}) => {
  const primarySort = sortTrail?.[0] ?? null;
  const primarySortKey = primarySort?.columnKey ?? null;
  const primaryDirection = primarySort?.direction ?? null;

  const rows = useMemo(() => {
    if (!Array.isArray(records) || records.length === 0) {
      return [];
    }

    return records.map((record) => columns.map((column) => {
      const value = record?.[column.key];
      if (value === null || value === undefined || value === '') {
        return '—';
      }
      return value;
    }));
  }, [columns, records]);

  return (
    <div className="operator-table-wrapper">
      <table className="operator-table">
        <thead>
          <tr>
            {columns.map((column) => {
              if (!column.sortable) {
                return (
                  <th key={column.key}>{column.label}</th>
                );
              }

              const isActive = column.key === primarySortKey;
              const directionIndicator = isActive ? (primaryDirection === 'desc' ? '▼' : '▲') : '◇';

              return (
                <th key={column.key}>
                  <button
                    type="button"
                    className={`operator-sort-button${isActive ? ' operator-sort-button--active' : ''}`}
                    onClick={() => onSortToggle(column.key)}
                  >
                    <span>{column.label}</span>
                    <span className="operator-sort-indicator" aria-hidden="true">
                      {directionIndicator}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex.toString()}`}>
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OperatorDataTable;
