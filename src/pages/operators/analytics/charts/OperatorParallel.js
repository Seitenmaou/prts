import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Plotly from 'plotly.js-dist';
import {
  GRAPH_TEXT_COLOR,
} from '../../../../constants/colorPalettes';

// Parallel coordinates to compare combat and skill metrics across operators.

const PARALLEL_DIMENSIONS = {
  combat: [
    {
      key: 'operatorRecords_rarity',
      label: 'operatorRecords_rarity',
      type: 'category',
      fallback: 'unspecified',
    },
    {
      key: 'operatorRecords_class',
      label: 'operatorRecords_class',
      type: 'category',
      fallback: 'unclassified',
    },
    { key: 'combat_hp', label: 'combat_hp', type: 'number' },
    { key: 'combat_atk', label: 'combat_atk', type: 'number' },
    { key: 'combat_def', label: 'combat_def', type: 'number' },
    { key: 'combat_res', label: 'combat_res', type: 'number' },
    { key: 'combat_cldn', label: 'combat_cldn', type: 'number' },
    { key: 'combat_cost', label: 'combat_cost', type: 'number' },
    { key: 'combat_blk', label: 'combat_blk', type: 'number' },
    { key: 'combat_atkspd', label: 'combat_atkspd', type: 'number' },
  ],
  skills: [
    {
      key: 'operatorRecords_rarity',
      label: 'operatorRecords_rarity',
      type: 'category',
      fallback: 'unspecified',
    },
    {
      key: 'operatorRecords_class',
      label: 'operatorRecords_class',
      type: 'category',
      fallback: 'unclassified',
    },
    {
      key: 'skills_strength',
      label: 'skills_strength',
      type: 'number',
      ratingScale: 'skill',
    },
    {
      key: 'skills_mobility',
      label: 'skills_mobility',
      type: 'number',
      ratingScale: 'skill',
    },
    {
      key: 'skills_endurance',
      label: 'skills_endurance',
      type: 'number',
      ratingScale: 'skill',
    },
    {
      key: 'skills_tacticalAcumen',
      label: 'skills_tacticalAcumen',
      type: 'number',
      ratingScale: 'skill',
    },
    {
      key: 'skills_combat',
      label: 'skills_combat',
      type: 'number',
      ratingScale: 'skill',
    },
    {
      key: 'skills_artsAdaptability',
      label: 'skills_artsAdaptability',
      type: 'number',
      ratingScale: 'skill',
    },
  ],
};

const MODE_OPTIONS = [
  { key: 'combat', label: 'combat' },
  { key: 'skills', label: 'skills' },
];

const sanitizeCategoryLabel = (value, fallback) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
};

const parseNumericValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return null;
};

const SKILL_RATING_LOOKUP = new Map([
  ['flawed', 0],
  ['normal', 1],
  ['standard', 2],
  ['excellent', 3],
  ['outstanding', 4],
  ['redacted', 5],
]);

const decodeSkillRating = (value) => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (SKILL_RATING_LOOKUP.has(normalized)) {
    return SKILL_RATING_LOOKUP.get(normalized);
  }
  return null;
};

const useParallelData = (records, mode) => useMemo(() => {
  const definition = PARALLEL_DIMENSIONS[mode];
  if (!definition || !Array.isArray(records) || records.length === 0) {
    return {
      dimensions: [],
      lineValues: [],
      recordCount: 0,
      categoryLegends: [],
    };
  }

  const categoryMaps = new Map();
  definition.forEach((dimension) => {
    if (dimension.type === 'category') {
      categoryMaps.set(dimension.key, new Map());
    }
  });

  const prepared = [];

  records.forEach((record) => {
    const entry = {};
    let shouldSkip = false;

    definition.forEach((dimension) => {
      if (shouldSkip) {
        return;
      }

      if (dimension.type === 'number') {
        const rawValue = record?.[dimension.key];
        let numeric = parseNumericValue(rawValue);
        if (numeric === null && dimension.ratingScale === 'skill') {
          numeric = decodeSkillRating(rawValue);
        }
        if (numeric === null) {
          shouldSkip = true;
          return;
        }
        entry[dimension.key] = numeric;
        return;
      }

      const label = sanitizeCategoryLabel(
        record?.[dimension.key],
        dimension.fallback ?? 'unspecified',
      );
      entry[dimension.key] = label;

      const categoryMap = categoryMaps.get(dimension.key);
      if (!categoryMap.has(label)) {
        categoryMap.set(label, categoryMap.size);
      }
    });

    if (!shouldSkip) {
      prepared.push(entry);
    }
  });

  if (!prepared.length) {
    return {
      dimensions: [],
      lineValues: [],
      recordCount: 0,
      categoryLegends: [],
    };
  }

  const dimensions = definition.map((dimension) => {
    if (dimension.type === 'number') {
      const values = prepared.map((entry) => entry[dimension.key]);
      const peak = values.reduce((max, value) => (value > max ? value : max), 0);
      const upperBound = peak > 0 ? peak : 1;

      return {
        label: dimension.label,
        values,
        range: [0, upperBound],
        tickfont: { color: GRAPH_TEXT_COLOR },
        labelfont: { color: GRAPH_TEXT_COLOR },
      };
    }

    const categoryMap = categoryMaps.get(dimension.key);
    const values = prepared.map((entry) => categoryMap.get(entry[dimension.key]));
    const tickvals = Array.from(categoryMap.values());
    const ticktext = Array.from(categoryMap.keys());
    const upperBound = categoryMap.size > 1 ? categoryMap.size - 1 : 1;

    return {
      label: dimension.label,
      values,
      range: [0, upperBound],
      tickvals,
      ticktext,
      tickfont: { color: GRAPH_TEXT_COLOR },
      labelfont: { color: GRAPH_TEXT_COLOR },
    };
  });

  const colorDimension = definition[0];
  let lineValues = prepared.map((_, index) => index);

  if (colorDimension) {
    if (colorDimension.type === 'number') {
      lineValues = prepared.map((entry) => entry[colorDimension.key]);
    } else {
      const categoryMap = categoryMaps.get(colorDimension.key);
      lineValues = prepared.map((entry) => categoryMap.get(entry[colorDimension.key]));
    }
  }

  const categoryLegends = Array.from(categoryMaps.entries()).map(([key, map]) => ({
    key,
    entries: Array.from(map.entries()).map(([label, value]) => ({ label, value })),
  }));

  return {
    dimensions,
    lineValues,
    recordCount: prepared.length,
    categoryLegends,
  };
}, [records, mode]);

const OperatorParallel = ({ operatorStatus, onBack }) => {
  const status = operatorStatus?.status ?? { state: 'idle', error: null };
  const rawRecords = operatorStatus?.data;
  const records = useMemo(
    () => (Array.isArray(rawRecords) ? rawRecords : []),
    [rawRecords],
  );
  const rows = operatorStatus?.rows ?? records.length;
  const plotRef = useRef(null);
  const [mode, setMode] = useState('combat');
  const {
    dimensions,
    lineValues,
    recordCount,
    categoryLegends,
  } = useParallelData(records, mode);
  const hasCategoricalLegend = categoryLegends.length > 0;

  useEffect(() => {
    const element = plotRef.current;
    if (!element) {
      return () => {};
    }

    if (!dimensions.length) {
      Plotly.purge(element);
      return () => {};
    }

    const chartData = [
      {
        type: 'parcoords',
        line: {
          color: lineValues,
          colorscale: 'Portland',
          showscale: false,
        },
        dimensions,
      },
    ];

    const layout = {
      margin: { l: 42, r: 16, t: 36, b: 16 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: {
        color: GRAPH_TEXT_COLOR,
      },
    };

    Plotly.react(element, chartData, layout, {
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: [
        'lasso2d',
        'select2d',
        'autoScale2d',
        'hoverClosestCartesian',
        'hoverCompareCartesian',
      ],
    });

    return () => {
      Plotly.purge(element);
    };
  }, [dimensions, lineValues]);

  const datasetStatusLabel = (() => {
    if (status.state === 'loading') {
      return 'link engaged :: compiling telemetry';
    }
    if (status.state === 'error') {
      return `link failed :: ${status.error ?? 'telemetry offline'}`;
    }
    if (status.state === 'loaded') {
      return `link stable :: ${rows} records cached`;
    }
    return 'link dormant :: awaiting dataset';
  })();

  const isLoaded = status.state === 'loaded';
  const hasRecords = isLoaded && records.length > 0;
  const hasRenderableData = isLoaded && recordCount > 0 && dimensions.length > 0;

  return (
    <div className="operator-layout">
      <div className="operator-panel operator-panel--stats">
        <div className="operator-header">
          <div className="operator-header-stack">
            <div className="operator-subtitle">analytics uplink</div>
            <div className="operator-title">comparison :: parallel</div>
          </div>
          <div className="operator-actions">
            <button type="button" className="dashboard-button" onClick={onBack}>
              return to stats
            </button>
          </div>
        </div>
        <div className="operator-status-line">
          <span className="status-indicator" data-state={status.state} />
          {datasetStatusLabel}
        </div>
        <div className="scatter-mode scatter-mode--inline">
          <div className="scatter-mode__segment">
            <span className="scatter-mode__label">data stream</span>
            <div
              className="scatter-mode-toggle"
              role="group"
              aria-label="parallel dataset selector"
            >
              {MODE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`scatter-mode-toggle__button${mode === option.key ? ' scatter-mode-toggle__button--active' : ''}`}
                  onClick={() => setMode(option.key)}
                  aria-pressed={mode === option.key}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {status.state === 'loading' && (
          <div className="operator-placeholder">
            routing parallel telemetry...
          </div>
        )}
        {status.state === 'error' && (
          <div className="operator-placeholder operator-placeholder--error">
            unable to render telemetry
          </div>
        )}
        {isLoaded && !hasRecords && (
          <div className="operator-placeholder">
            dataset returned no entries
          </div>
        )}
        {isLoaded && hasRecords && !hasRenderableData && (
          <div className="operator-placeholder">
            operators missing required metrics for selected stream
          </div>
        )}
        {hasRenderableData && (
          <div className={hasCategoricalLegend ? 'parallel-shell parallel-shell--with-panel' : 'parallel-shell'}>
            <div className="parallel-plot" ref={plotRef} />
            {hasCategoricalLegend && (
              <aside className="parallel-panel">
                <div className="parallel-panel__header">categorical channels</div>
                {categoryLegends.map((legend) => (
                  <div key={legend.key} className="parallel-panel__group">
                    <div className="parallel-panel__label">{legend.key}</div>
                    <ul className="parallel-panel__list">
                      {legend.entries.map((entry) => (
                        <li key={entry.label} className="parallel-panel__item">
                          <span className="parallel-panel__value">{entry.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="parallel-panel__note">
                  categorical axes adopt ordinal encoding; hover to inspect operator traces.
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorParallel;
