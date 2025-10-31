import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import OperatorDataTable from '../components/OperatorDataTable';
import OperatorRankingSummary from '../components/OperatorRankingSummary';
import {
  formatRoundedNumber,
  parseMaybeNumber,
  parseStatValue,
} from '../utils/numberFormat';

const MEDICAL_COLUMNS = [
  { key: 'ID', label: 'ID', sortable: true },
  { key: 'name_code', label: 'name_code', sortable: true },
  { key: 'code', label: 'code', sortable: true },
  { key: 'name_real', label: 'name_real', sortable: true },
  { key: 'date_joined', label: 'date_joined', sortable: true },
  { key: 'gender', label: 'gender', sortable: false, filterable: true },
  { key: 'height', label: 'height', sortable: true },
  { key: 'species', label: 'species', sortable: false, filterable: true },
  { key: 'affiliation_location', label: 'affiliation_location', sortable: false, filterable: true },
  { key: 'affiliation_organization', label: 'affiliation_organization', sortable: false, filterable: true },
  { key: 'place_birth', label: 'place_birth', sortable: false, filterable: true },
  { key: 'date_birth', label: 'date_birth', sortable: true },
  { key: 'medical_fusion', label: 'medical_fusion', sortable: true },
  { key: 'medical_bloodRatio', label: 'medical_bloodRatio', sortable: true },
];

const COMBAT_COLUMNS = [
  { key: 'ID', label: 'ID', sortable: true },
  { key: 'name_code', label: 'name_code', sortable: true },
  { key: 'skills_strength', label: 'skills_strength', sortable: false, filterable: true },
  { key: 'skills_mobility', label: 'skills_mobility', sortable: false, filterable: true },
  { key: 'skills_endurance', label: 'skills_endurance', sortable: false, filterable: true },
  { key: 'skills_tacticalAcumen', label: 'skills_tacticalAcumen', sortable: false, filterable: true },
  { key: 'skills_combat', label: 'skills_combat', sortable: false, filterable: true },
  { key: 'skills_artsAdaptability', label: 'skills_artsAdaptability', sortable: false, filterable: true },
  { key: 'experience_combat', label: 'experience_combat', sortable: true },
  { key: 'operatorRecords_class', label: 'operatorRecords_class', sortable: false, filterable: true },
  { key: 'operatorRecords_job', label: 'operatorRecords_job', sortable: false, filterable: true },
  { key: 'operatorRecords_rarity', label: 'operatorRecords_rarity', sortable: false, filterable: true },
  { key: 'combat_hp', label: 'combat_hp', sortable: true },
  { key: 'combat_atk', label: 'combat_atk', sortable: true },
  { key: 'combat_def', label: 'combat_def', sortable: true },
  { key: 'combat_res', label: 'combat_res', sortable: true },
  { key: 'combat_cldn', label: 'combat_cldn', sortable: true },
  { key: 'combat_cost', label: 'combat_cost', sortable: true },
  { key: 'combat_blk', label: 'combat_blk', sortable: true },
  { key: 'combat_atkspd', label: 'combat_atkspd', sortable: true },
];

const TAB_DEFINITIONS = [
  {
    key: 'medical',
    label: 'medical file',
    mode: 'table',
    columns: MEDICAL_COLUMNS,
  },
  {
    key: 'combat',
    label: 'combat file',
    mode: 'table',
    columns: COMBAT_COLUMNS,
  },
  {
    key: 'rankingSummary',
    label: 'ranking summary',
    mode: 'summary',
    columns: [],
  },
];

const EMPTY_ARRAY = [];
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
const SEARCH_FIELDS = ['name_code', 'code', 'name_real'];

const SKILL_LEVELS = ['Flawed', 'Normal', 'Standard', 'Excellent', 'Outstanding', 'REDACTED'];
const SKILL_VALUE_MAP = SKILL_LEVELS.reduce((accumulator, level, index) => {
  accumulator[level.toLowerCase()] = index;
  return accumulator;
}, {});
const SKILL_FIELDS = [
  'skills_strength',
  'skills_mobility',
  'skills_endurance',
  'skills_tacticalAcumen',
  'skills_combat',
  'skills_artsAdaptability',
];

const getOperatorName = (record) => (
  record?.name_code
  ?? record?.code
  ?? record?.name_real
  ?? 'Unknown Operator'
);

const mapValueToFilterToken = (value) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return String(value);
};

const replaceFirstNumericSegment = (rawValue, replacement) => {
  if (typeof rawValue !== 'string' || rawValue.trim() === '') {
    return replacement;
  }

  const match = rawValue.match(/[+-]?\d[\d,]*(?:\.\d+)?/);
  if (!match) {
    return replacement;
  }

  return rawValue.replace(match[0], replacement);
};

const formatStatDisplay = (rawValue, numericValue, { unitLabel } = {}) => {
  if (numericValue === null || Number.isNaN(numericValue)) {
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return '—';
    }
    return String(rawValue);
  }

  const formattedNumeric = formatRoundedNumber(numericValue, {
    useGrouping: typeof rawValue === 'string' ? rawValue.includes(',') : false,
  }) ?? numericValue.toString();

  if (unitLabel) {
    return `${formattedNumeric} ${unitLabel}`.trim();
  }

  if (typeof rawValue === 'string' && rawValue.trim() !== '') {
    return replaceFirstNumericSegment(rawValue, formattedNumeric);
  }

  return formattedNumeric;
};

const parseSkillRating = (rawValue) => {
  if (rawValue === null || rawValue === undefined) {
    return 0;
  }

  const segments = String(rawValue).split('/');
  let best = 0;

  segments.forEach((segment) => {
    const token = segment.trim().toLowerCase();
    if (!token) {
      return;
    }
    const mapped = SKILL_VALUE_MAP[token];
    if (typeof mapped === 'number') {
      best = Math.max(best, mapped);
    }
  });

  return best;
};

const computeSkillScore = (record) => (
  SKILL_FIELDS.reduce((total, field) => total + parseSkillRating(record?.[field]), 0)
);

const buildTopListByField = (records, fieldKey, { unitLabel } = {}) => {
  const entries = [];

  records.forEach((record) => {
    if (!record) {
      return;
    }

    const rawValue = record[fieldKey];
    const numericValue = parseStatValue(rawValue);

    if (numericValue === null) {
      return;
    }

    const displayValue = formatStatDisplay(rawValue, numericValue, { unitLabel });

    entries.push({
      label: getOperatorName(record),
      value: displayValue,
      numericValue,
    });
  });

  entries.sort((left, right) => {
    if (right.numericValue !== left.numericValue) {
      return right.numericValue - left.numericValue;
    }
    return collator.compare(left.label, right.label);
  });

  return entries.slice(0, 5).map(({ label, value }) => ({ label, value }));
};

const buildMostPopularClasses = (records) => {
  const counts = new Map();

  records.forEach((record) => {
    const raw = record?.operatorRecords_class;
    if (!raw) {
      return;
    }
    const label = String(raw).trim();
    if (!label) {
      return;
    }
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  const entries = Array.from(counts.entries()).map(([label, count]) => ({
    label,
    value: `${count.toLocaleString()} ${count === 1 ? 'operator' : 'operators'}`,
    numericValue: count,
  }));

  entries.sort((left, right) => {
    if (right.numericValue !== left.numericValue) {
      return right.numericValue - left.numericValue;
    }
    return collator.compare(left.label, right.label);
  });

  return entries.slice(0, 5).map(({ label, value }) => ({ label, value }));
};

const buildMostSkilledOperators = (records) => {
  const entries = records.map((record) => {
    const score = computeSkillScore(record);
    return {
      label: getOperatorName(record),
      value: `${score.toLocaleString()} pts`,
      numericValue: score,
    };
  }).sort((left, right) => {
    if (right.numericValue !== left.numericValue) {
      return right.numericValue - left.numericValue;
    }
    return collator.compare(left.label, right.label);
  });

  return entries.slice(0, 5).map(({ label, value }) => ({ label, value }));
};

const buildRankingSections = (records) => {
  if (!Array.isArray(records) || records.length === 0) {
    return EMPTY_ARRAY;
  }

  const normalizedRecords = records.filter((record) => record && typeof record === 'object');
  if (!normalizedRecords.length) {
    return EMPTY_ARRAY;
  }

  const sections = [
    {
      key: 'highestHp',
      title: 'highest hp',
      items: buildTopListByField(normalizedRecords, 'combat_hp'),
    },
    {
      key: 'highestAtk',
      title: 'highest atk',
      items: buildTopListByField(normalizedRecords, 'combat_atk'),
    },
    {
      key: 'highestDef',
      title: 'highest def',
      items: buildTopListByField(normalizedRecords, 'combat_def'),
    },
    {
      key: 'highestRes',
      title: 'highest res',
      items: buildTopListByField(normalizedRecords, 'combat_res'),
    },
    {
      key: 'fastestAtk',
      title: 'fastest attacker',
      items: buildTopListByField(normalizedRecords, 'combat_atkspd'),
    },
    {
      key: 'tallest',
      title: 'tallest operator',
      items: buildTopListByField(normalizedRecords, 'height'),
    },
    {
      key: 'popularClass',
      title: 'most popular class',
      items: buildMostPopularClasses(normalizedRecords),
    },
    {
      key: 'mostSkilled',
      title: 'most skilled',
      items: buildMostSkilledOperators(normalizedRecords),
    },
  ];

  return sections.filter((section) => section.items.length > 0);
};

const OperatorTable = ({ operatorStatus, onBack }) => {
  const { status, data } = operatorStatus;
  const records = useMemo(() => (Array.isArray(data) ? data : EMPTY_ARRAY), [data]);
  const [activeTab, setActiveTab] = useState(TAB_DEFINITIONS[0].key);
  const [activeFilters, setActiveFilters] = useState({});
  const [sortTrail, setSortTrail] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeTabDefinition = useMemo(
    () => TAB_DEFINITIONS.find((tab) => tab.key === activeTab) ?? TAB_DEFINITIONS[0],
    [activeTab],
  );

  const isSummaryTab = activeTabDefinition.mode === 'summary';

  const filterableColumns = useMemo(
    () => (isSummaryTab ? EMPTY_ARRAY : activeTabDefinition.columns.filter((column) => column.filterable)),
    [activeTabDefinition, isSummaryTab],
  );

  useEffect(() => {
    setFiltersOpen(false);
  }, [activeTab]);

  useEffect(() => {
    setActiveFilters((prev) => {
      const next = {};
      filterableColumns.forEach((column) => {
        const existing = prev[column.key];
        if (existing && existing.length > 0) {
          next[column.key] = existing;
        }
      });
      return next;
    });

    setSortTrail((prev) => {
      if (isSummaryTab) {
        return EMPTY_ARRAY;
      }
      return prev.filter((entry) => (
        activeTabDefinition.columns.some((column) => column.key === entry.columnKey)
      ));
    });
  }, [activeTabDefinition, filterableColumns, isSummaryTab]);

  const hasRecords = status.state === 'loaded' && records.length > 0;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const searchFilteredRecords = useMemo(() => {
    if (!hasRecords) {
      return EMPTY_ARRAY;
    }

    if (!normalizedQuery) {
      return records;
    }

    return records.filter((record) => SEARCH_FIELDS.some((field) => {
      const value = record?.[field];
      if (value === null || value === undefined) {
        return false;
      }
      return String(value).toLowerCase().includes(normalizedQuery);
    }));
  }, [records, hasRecords, normalizedQuery]);

  const activeFilterCount = useMemo(
    () => Object.values(activeFilters).reduce((total, entries) => total + entries.length, 0),
    [activeFilters],
  );

  const filterOptions = useMemo(() => {
    if (!hasRecords) {
      return {};
    }

    const options = {};

    filterableColumns.forEach((column) => {
      const unique = new Set();
      records.forEach((record) => {
        const token = mapValueToFilterToken(record?.[column.key]);
        unique.add(token);
      });
      options[column.key] = Array.from(unique).sort(collator.compare);
    });

    return options;
  }, [records, filterableColumns, hasRecords]);

  const filteredRecords = useMemo(() => {
    if (!hasRecords) {
      return EMPTY_ARRAY;
    }

    const activeFilterKeys = Object.entries(activeFilters).filter(([, values]) => values && values.length > 0);

    if (activeFilterKeys.length === 0) {
      return searchFilteredRecords;
    }

    if (!searchFilteredRecords.length) {
      return searchFilteredRecords;
    }

    return searchFilteredRecords.filter((record) => activeFilterKeys.every(([columnKey, values]) => {
      const token = mapValueToFilterToken(record?.[columnKey]);
      return values.includes(token);
    }));
  }, [searchFilteredRecords, activeFilters, hasRecords]);

  const sortedRecords = useMemo(() => {
    if (isSummaryTab || !filteredRecords.length) {
      return filteredRecords;
    }

    if (!sortTrail.length) {
      return filteredRecords;
    }

    const columnMap = new Map(activeTabDefinition.columns.map((column) => [column.key, column]));

    const sorted = [...filteredRecords];
    sorted.sort((left, right) => {
      for (const entry of sortTrail) {
        const column = columnMap.get(entry.columnKey);
        if (!column || !column.sortable) {
          continue;
        }

        const leftValue = left?.[entry.columnKey];
        const rightValue = right?.[entry.columnKey];

        if (leftValue === rightValue) {
          continue;
        }

        const leftNumeric = parseMaybeNumber(leftValue);
        const rightNumeric = parseMaybeNumber(rightValue);

        let comparison = 0;
        if (leftNumeric !== null && rightNumeric !== null) {
          comparison = leftNumeric - rightNumeric;
        } else {
          comparison = collator.compare(mapValueToFilterToken(leftValue), mapValueToFilterToken(rightValue));
        }

        if (comparison !== 0) {
          return entry.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
    return sorted;
  }, [filteredRecords, sortTrail, activeTabDefinition, isSummaryTab]);

  const rankingSections = useMemo(
    () => (isSummaryTab ? buildRankingSections(records) : EMPTY_ARRAY),
    [isSummaryTab, records],
  );

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
  };

  const handleSortToggle = (columnKey) => {
    setSortTrail((previous) => {
      const existingIndex = previous.findIndex((entry) => entry.columnKey === columnKey);
      if (existingIndex === 0) {
        const currentDirection = previous[0].direction;
        if (currentDirection === 'asc') {
          return [{ columnKey, direction: 'desc' }, ...previous.slice(1)];
        }
        if (currentDirection === 'desc') {
          return previous.slice(1);
        }
        return [{ columnKey, direction: 'asc' }, ...previous.slice(1)];
      }

      const filtered = previous.filter((entry) => entry.columnKey !== columnKey);
      return [{ columnKey, direction: 'asc' }, ...filtered];
    });
  };

  const handleFilterToggle = (columnKey, token) => {
    setActiveFilters((previous) => {
      const current = previous[columnKey] ? new Set(previous[columnKey]) : new Set();
      if (current.has(token)) {
        current.delete(token);
      } else {
        current.add(token);
      }

      const next = { ...previous };
      if (current.size === 0) {
        delete next[columnKey];
      } else {
        next[columnKey] = Array.from(current);
      }
      return next;
    });
  };

  const handleClearFilters = () => {
    setActiveFilters({});
  };

  const activeSort = sortTrail[0] ?? null;
  const activeSortLabel = (!isSummaryTab && activeSort)
    ? (activeTabDefinition.columns.find((column) => column.key === activeSort.columnKey)?.label
      ?? activeSort.columnKey)
    : null;

  return (
    <div className="operator-layout">
      <div className="operator-panel">
        <div className="operator-header">
          <div className="operator-title">operator manifest</div>
          <div className="operator-actions">
            <button type="button" className="dashboard-button" onClick={onBack}>
              return to dashboard
            </button>
          </div>
        </div>
        <div className="operator-status-line">
          <span className="status-indicator" data-state={status.state} />
          {status.state === 'loading' && 'link engaged :: retrieving records'}
          {status.state === 'error' && `link failed :: ${status.error}`}
          {status.state === 'loaded' && `link stable :: ${records.length} entries cached`}
          {status.state === 'idle' && 'link deprecated :: pending request'}
        </div>
        <div className="operator-table-shell">
          {status.state === 'loading' && (
            <div className="operator-placeholder">synchronizing manifest...</div>
          )}
          {status.state === 'error' && (
            <div className="operator-placeholder operator-placeholder--error">
              unable to contact registry
            </div>
          )}
          {status.state === 'loaded' && !hasRecords && (
            <div className="operator-placeholder">registry returned no entries</div>
          )}
          {hasRecords && (
            <>
              <div className="operator-tabs">
                {TAB_DEFINITIONS.map((tab) => {
                  const isActive = tab.key === activeTab;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      className={`operator-tab${isActive ? ' operator-tab--active' : ''}`}
                      onClick={() => handleTabChange(tab.key)}
                    >
                      <span className="operator-tab__label">{tab.label}</span>
                      <span className="operator-tab__meta">
                        {tab.mode === 'table' ? `${tab.columns.length} fields` : 'insights'}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!isSummaryTab && (
                <div className="operator-controls">
                  <div className="operator-search">
                    <input
                      type="search"
                      placeholder="search name, code, or alias"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                    />
                  </div>
                  {filterableColumns.length > 0 && (
                    <div className="operator-filter-trigger">
                      <button
                        type="button"
                        className={`operator-filter-button${filtersOpen ? ' operator-filter-button--active' : ''}`}
                        onClick={() => setFiltersOpen((prev) => !prev)}
                        aria-expanded={filtersOpen}
                      >
                        filters
                        {activeFilterCount > 0 && (
                          <span className="operator-filter-badge">{activeFilterCount}</span>
                        )}
                      </button>
                      {filtersOpen && (
                        <div className="operator-filter-popover">
                          <div className="operator-filter-popover__header">
                            <span>filter manifest</span>
                            <button
                              type="button"
                              className="operator-filter-clear"
                              onClick={handleClearFilters}
                              disabled={Object.keys(activeFilters).length === 0}
                            >
                              clear
                            </button>
                          </div>
                          <div className="operator-filter-groups">
                            {filterableColumns.map((column) => {
                              const options = filterOptions[column.key] ?? [];
                              if (!options.length) {
                                return null;
                              }
                              const selected = new Set(activeFilters[column.key] ?? EMPTY_ARRAY);
                              return (
                                <details key={column.key} className="operator-filter-group">
                                  <summary>
                                    {column.label}
                                    {selected.size > 0 && (
                                      <span className="operator-filter-chip">
                                        {selected.size}
                                        {' '}
                                        active
                                      </span>
                                    )}
                                  </summary>
                                  <div className="operator-filter-options">
                                    {options.map((option) => (
                                      <label
                                        key={`${column.key}-${option}`}
                                        className="operator-filter-option"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selected.has(option)}
                                          onChange={() => handleFilterToggle(column.key, option)}
                                        />
                                        <span>{option}</span>
                                      </label>
                                    ))}
                                  </div>
                                </details>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {!isSummaryTab && (
                sortedRecords.length > 0 ? (
                  <OperatorDataTable
                    columns={activeTabDefinition.columns}
                    records={sortedRecords}
                    sortTrail={sortTrail}
                    onSortToggle={handleSortToggle}
                  />
                ) : (
                  <div className="operator-placeholder operator-placeholder--empty">
                    no matching entries
                  </div>
                )
              )}
              {isSummaryTab && (
                rankingSections.length > 0 ? (
                  <OperatorRankingSummary sections={rankingSections} />
                ) : (
                  <div className="operator-placeholder operator-placeholder--empty">
                    insufficient data for rankings
                  </div>
                )
              )}
              {!isSummaryTab && activeSort && (
                <div className="operator-sort-footnote">
                  sorting
                  {' '}
                  <span className="operator-sort-footnote__column">{activeSortLabel}</span>
                  :
                  {' '}
                  {activeSort.direction === 'desc' ? 'descending' : 'ascending'}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorTable;
