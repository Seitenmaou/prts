import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatRoundedValue } from '../utils/numberFormat';

const LINKABLE_COLUMN_KEYS = new Set(['name_code', 'code', 'name_real']);

const getOperatorDetailPath = (record, recordIndex) => {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const rawId = record.ID ?? record.id ?? record.operator_id;
  const resolvedId = (() => {
    if (rawId === null || rawId === undefined) {
      return recordIndex;
    }
    const trimmed = String(rawId).trim();
    if (trimmed.length === 0) {
      return recordIndex;
    }
    return trimmed;
  })();

  if (resolvedId === null || resolvedId === undefined) {
    return null;
  }

  return `/operator-table/operator/${encodeURIComponent(String(resolvedId))}`;
};

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

    return records.map((record, recordIndex) => columns.map((column) => {
      const value = record?.[column.key];
      const displayValue = (
        value === null || value === undefined || value === ''
          ? '—'
          : formatRoundedValue(value)
      );

      if (!LINKABLE_COLUMN_KEYS.has(column.key)) {
        return displayValue;
      }

      const detailPath = getOperatorDetailPath(record, recordIndex);
      if (!detailPath) {
        return displayValue;
      }

      return (
        <Link to={detailPath} className="operator-table-link">
          {displayValue}
        </Link>
      );
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
