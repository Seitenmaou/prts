import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import Plotly from 'plotly.js-dist';
import {
  GRAPH_TEXT_COLOR,
  SUNBURST_COLORWAY,
} from '../../../../constants/colorPalettes';

// Sunburst breakdowns that link factions, classes, and individual operators.

const resolveOperatorLabel = (record) => (
  record?.name_code ?? record?.code ?? record?.name_real
);

const resolveOperatorIdentifier = (record, fallbackIndex) => {
  if (!record || typeof record !== 'object') {
    if (fallbackIndex === null || fallbackIndex === undefined) {
      return null;
    }
    return String(fallbackIndex);
  }

  const rawId = record.ID ?? record.id ?? record.operator_id;
  if (rawId !== null && rawId !== undefined) {
    const trimmed = String(rawId).trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  if (fallbackIndex === null || fallbackIndex === undefined) {
    return null;
  }

  return String(fallbackIndex);
};

const buildOperatorDetailPath = (identifier) => {
  if (identifier === null || identifier === undefined) {
    return null;
  }
  return `/operator-table/operator/${encodeURIComponent(String(identifier))}`;
};

const AFFILIATION_LABEL_FIELD = '__sunburst_affiliation_label';
const AFFILIATION_ORIGIN_FIELD = '__sunburst_affiliation_origin';
const AFFILIATION_PRIMARY_ORIGIN = 'primary';
const AFFILIATION_SECONDARY_ORIGIN = 'secondary';
const AFFILIATION_SECONDARY_TEXT_COLOR = '#0F7D8C';

const HIERARCHY_OPTIONS = [
  {
    key: 'class-job-operator',
    label: 'Class › Job › Operator',
    levels: [
      {
        key: 'class',
        field: 'operatorRecords_class',
        fallback: 'unclassified',
        legend: 'operatorRecords_class',
      },
      {
        key: 'job',
        field: 'operatorRecords_job',
        fallback: 'unspecified role',
        legend: 'operatorRecords_job',
      },
      {
        key: 'operator',
        field: 'name_code',
        fallback: 'unnamed operator',
        legend: 'name_code',
        resolve: resolveOperatorLabel,
        leaf: true,
      },
    ],
  },
  {
    key: 'gender-operator',
    label: 'Gender › Operator',
    levels: [
      {
        key: 'gender',
        field: 'gender',
        fallback: 'undisclosed',
        legend: 'gender',
      },
      {
        key: 'operator',
        field: 'name_code',
        fallback: 'unnamed operator',
        legend: 'name_code',
        resolve: resolveOperatorLabel,
        leaf: true,
      },
    ],
  },
  {
    key: 'species-operator',
    label: 'Species › Operator',
    levels: [
      {
        key: 'species',
        field: 'species',
        fallback: 'unknown species',
        legend: 'species',
      },
      {
        key: 'operator',
        field: 'name_code',
        fallback: 'unnamed operator',
        legend: 'name_code',
        resolve: resolveOperatorLabel,
        leaf: true,
      },
    ],
  },
  {
    key: 'rarity-operator',
    label: 'Rarity › Operator',
    levels: [
      {
        key: 'rarity',
        field: 'operatorRecords_rarity',
        fallback: 'unspecified rarity',
        legend: 'operatorRecords_rarity',
      },
      {
        key: 'operator',
        field: 'name_code',
        fallback: 'unnamed operator',
        legend: 'name_code',
        resolve: resolveOperatorLabel,
        leaf: true,
      },
    ],
  },
  {
    key: 'affiliation-operator',
    label: 'Affiliation › Operator',
    transformRecords: (source) => {
      if (!Array.isArray(source)) {
        return [];
      }

      const hasLabel = (value) => {
        if (typeof value === 'string') {
          return value.trim().length > 0;
        }
        return value !== null && value !== undefined;
      };

      return source.flatMap((record) => {
        const entries = [];
        const addEntry = (label, origin) => {
          entries.push({
            ...record,
            [AFFILIATION_LABEL_FIELD]: label,
            [AFFILIATION_ORIGIN_FIELD]: origin,
          });
        };

        if (hasLabel(record?.affiliation_primary)) {
          addEntry(record.affiliation_primary, AFFILIATION_PRIMARY_ORIGIN);
        }
        if (hasLabel(record?.affiliation_secondary)) {
          addEntry(record.affiliation_secondary, AFFILIATION_SECONDARY_ORIGIN);
        }
        if (entries.length === 0) {
          addEntry(null, AFFILIATION_PRIMARY_ORIGIN);
        }

        return entries;
      });
    },
    levels: [
      {
        key: 'affiliation',
        field: AFFILIATION_LABEL_FIELD,
        fallback: 'unaffiliated',
        legend: 'affiliation',
      },
      {
        key: 'operator',
        field: 'name_code',
        fallback: 'unnamed operator',
        legend: 'name_code',
        resolve: resolveOperatorLabel,
        leaf: true,
        insideTextColor: (record) => (
          record?.[AFFILIATION_ORIGIN_FIELD] === AFFILIATION_SECONDARY_ORIGIN
            ? AFFILIATION_SECONDARY_TEXT_COLOR
            : GRAPH_TEXT_COLOR
        ),
        outsideTextColor: (record) => (
          record?.[AFFILIATION_ORIGIN_FIELD] === AFFILIATION_SECONDARY_ORIGIN
            ? AFFILIATION_SECONDARY_TEXT_COLOR
            : GRAPH_TEXT_COLOR
        ),
      },
    ],
  },
];

const sanitizeLabel = (value, fallback) => {
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

const resolveLevelLabel = (record, recordIndex, level) => {
  const rawValue = typeof level.resolve === 'function'
    ? level.resolve(record, recordIndex)
    : record?.[level.field];
  return sanitizeLabel(
    rawValue,
    level.fallback ?? `layer-${level.key ?? level.field ?? 'label'}`,
  );
};

const buildSunburstData = (records, hierarchy) => {
  if (
    !Array.isArray(records)
    || records.length === 0
    || !hierarchy
    || !Array.isArray(hierarchy.levels)
    || hierarchy.levels.length === 0
  ) {
    return null;
  }

  const nodes = new Map();

  records.forEach((record, recordIndex) => {
    let parentId = '';

    hierarchy.levels.forEach((level, levelIndex) => {
      const label = resolveLevelLabel(record, recordIndex, level);
      const baseKey = level.key ?? level.field ?? `level-${levelIndex}`;
      const isLeaf = levelIndex === hierarchy.levels.length - 1 || level.leaf;

      const parentSuffix = parentId ? `::${parentId}` : '';
      let nodeId = `${baseKey}::${label}${parentSuffix}`;

      if (isLeaf) {
        const uniqueSuffix = record?.ID ?? `${recordIndex}`;
        nodeId = `${nodeId}::${uniqueSuffix}`;
      }

      const node = nodes.get(nodeId) ?? {
        id: nodeId,
        label,
        parent: parentId,
        value: 0,
      };

      node.value += 1;

      if (isLeaf && node.operatorDetailPath === undefined) {
        const identifier = resolveOperatorIdentifier(record, recordIndex);
        const detailPath = buildOperatorDetailPath(identifier);
        if (detailPath) {
          node.operatorDetailPath = detailPath;
        }
      }

      if (node.insideTextColor === undefined && level.insideTextColor !== undefined) {
        const resolvedInsideColor = typeof level.insideTextColor === 'function'
          ? level.insideTextColor(record, recordIndex, level, node)
          : level.insideTextColor;
        if (resolvedInsideColor) {
          node.insideTextColor = resolvedInsideColor;
        }
      }

      if (node.outsideTextColor === undefined && level.outsideTextColor !== undefined) {
        const resolvedOutsideColor = typeof level.outsideTextColor === 'function'
          ? level.outsideTextColor(record, recordIndex, level, node)
          : level.outsideTextColor;
        if (resolvedOutsideColor) {
          node.outsideTextColor = resolvedOutsideColor;
        }
      }

      nodes.set(nodeId, node);
      parentId = nodeId;
    });
  });

  const labels = [];
  const parents = [];
  const values = [];
  const ids = [];
  const insideTextColors = [];
  const outsideTextColors = [];
  const detailPathByNode = {};

  nodes.forEach((node) => {
    labels.push(node.label);
    parents.push(node.parent);
    values.push(node.value);
    ids.push(node.id);
    insideTextColors.push(node.insideTextColor ?? GRAPH_TEXT_COLOR);
    outsideTextColors.push(node.outsideTextColor ?? GRAPH_TEXT_COLOR);
    if (node.operatorDetailPath) {
      detailPathByNode[node.id] = node.operatorDetailPath;
    }
  });

  return {
    labels,
    parents,
    values,
    ids,
    insideTextColors,
    outsideTextColors,
    detailPathByNode,
  };
};

const OperatorSunburst = ({ operatorStatus, onBack }) => {
  const status = operatorStatus?.status ?? { state: 'idle', error: null };
  const rawRecords = operatorStatus?.data;
  const [activeHierarchyKey, setActiveHierarchyKey] = useState(HIERARCHY_OPTIONS[0].key);
  const totalRecords = Array.isArray(rawRecords) ? rawRecords.length : 0;

  const activeHierarchy = useMemo(
    () => HIERARCHY_OPTIONS.find((entry) => entry.key === activeHierarchyKey) ?? HIERARCHY_OPTIONS[0],
    [activeHierarchyKey],
  );

  const records = useMemo(() => {
    const base = Array.isArray(rawRecords) ? rawRecords : [];
    if (activeHierarchy && typeof activeHierarchy.transformRecords === 'function') {
      return activeHierarchy.transformRecords(base);
    }
    return base;
  }, [rawRecords, activeHierarchy]);

  const plotRef = useRef(null);

  const sunburstData = useMemo(
    () => buildSunburstData(records, activeHierarchy),
    [records, activeHierarchy],
  );

  const navigate = useNavigate();

  useEffect(() => {
    const node = plotRef.current;
    if (!node || !sunburstData) {
      return () => {};
    }

    const trace = {
      type: 'sunburst',
      labels: sunburstData.labels,
      parents: sunburstData.parents,
      values: sunburstData.values,
      ids: sunburstData.ids,
      branchvalues: 'total',
      maxdepth: 3,
      hovertemplate: '<b>%{label}</b><br>entries :: %{value}<extra></extra>',
      marker: {
        line: {
          width: 1,
          color: 'rgba(4, 18, 10, 0.85)',
        },
      },
      insidetextfont: {
        family: 'Courier New, monospace',
        size: 12,
        color: sunburstData.insideTextColors,
      },
      outsidetextfont: {
        family: 'Courier New, monospace',
        size: 12,
        color: sunburstData.outsideTextColors,
      },
    };

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: {
        family: 'Courier New, monospace',
        color: GRAPH_TEXT_COLOR,
      },
      margin: { t: 42, l: 24, r: 24, b: 24 },
      sunburstcolorway: SUNBURST_COLORWAY,
      extendsunburstcolors: true,
      hoverlabel: {
        bgcolor: 'rgba(6, 18, 16, 0.92)',
        bordercolor: '#4DFFA7',
        font: {
          family: 'Courier New, monospace',
          color: '#C5F5CC',
          size: 12,
        },
      },
    };

    Plotly.newPlot(node, [trace], layout, {
      displaylogo: false,
      responsive: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    });

    const detailPathByNode = sunburstData.detailPathByNode ?? {};

    const handlePointClick = (event) => {
      const originalEvent = event?.event;
      if (originalEvent && originalEvent.button !== 0) {
        return;
      }
      const point = event?.points?.[0];
      if (!point || !point.id) {
        return;
      }

      const detailPath = detailPathByNode[point.id];
      if (!detailPath) {
        return;
      }

      if (originalEvent) {
        originalEvent.preventDefault();
        originalEvent.stopPropagation();
      }

      navigate(detailPath);
    };

    if (typeof node.on === 'function') {
      node.on('plotly_click', handlePointClick);
    }

    const handleResize = () => {
      Plotly.Plots.resize(node);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (typeof node.removeListener === 'function') {
        node.removeListener('plotly_click', handlePointClick);
      }
      Plotly.purge(node);
    };
  }, [sunburstData, navigate]);

  const describeLayer = (index, total) => {
    if (total === 1) {
      return 'primary layer';
    }
    if (index === 0) {
      return total === 2 ? 'inner ring' : 'innermost';
    }
    if (index === total - 1) {
      return 'outer ring';
    }
    if (total === 3 && index === 1) {
      return 'middle ring';
    }
    return `layer ${index + 1}`;
  };

  const datasetStatusLabel = (() => {
    if (status.state === 'loading') {
      return 'link engaged :: compiling telemetry';
    }
    if (status.state === 'error') {
      return `link failed :: ${status.error ?? 'telemetry offline'}`;
    }
    if (status.state === 'loaded') {
      return `link stable :: ${totalRecords} records cached`;
    }
    return 'link dormant :: awaiting dataset';
  })();

  const isReady = status.state === 'loaded' && totalRecords > 0 && sunburstData;
  const canSelectHierarchy = status.state === 'loaded' && totalRecords > 0;

  return (
    <div className="operator-layout">
      <div className="operator-panel operator-panel--stats">
        <div className="operator-header">
          <div className="operator-header-stack">
            <div className="operator-subtitle">analytics uplink</div>
            <div className="operator-title">distribution :: sunburst</div>
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
        <div className="sunburst-toolbar">
          <div className="sunburst-toolbar__label">category layers</div>
          <div className="sunburst-select">
            <select
              value={activeHierarchyKey}
              onChange={(event) => setActiveHierarchyKey(event.target.value)}
              disabled={!canSelectHierarchy}
            >
              {HIERARCHY_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {status.state === 'loading' && (
          <div className="operator-placeholder">assembling radial projection...</div>
        )}
        {status.state === 'error' && (
          <div className="operator-placeholder operator-placeholder--error">
            unable to render telemetry
          </div>
        )}
        {status.state === 'loaded' && totalRecords === 0 && (
          <div className="operator-placeholder">dataset returned no entries</div>
        )}
        {isReady && (
          <div className="sunburst-shell">
            <div className="sunburst-canvas">
              <div className="sunburst-plot sunburst-plot--plotly" ref={plotRef} />
            </div>
            <aside className="sunburst-menu">
              <div className="sunburst-menu__header">{activeHierarchy.label}</div>
              {activeHierarchy.levels.map((level, index) => (
                <div
                  key={level.key ?? level.field ?? `layer-${index}`}
                  className="sunburst-menu__section"
                >
                  <span className="sunburst-menu__label">
                    {describeLayer(index, activeHierarchy.levels.length)}
                  </span>
                  <span className="sunburst-menu__value">{level.legend}</span>
                </div>
              ))}
              <div className="sunburst-menu__note">
                click to drill; left-click operator segments to open dossier; right-click to ascend
                {activeHierarchy.key === 'affiliation-operator' && ' :: teal labels denote secondary affiliations'}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorSunburst;
