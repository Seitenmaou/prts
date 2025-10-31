import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadLinksPreset } from '@tsparticles/preset-links';
import './App.css';
import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/auth/Login';
import OperatorTable from './pages/operators/OperatorTable';
import OperatorStats from './pages/operators/analytics/OperatorStats';
import OperatorScatter from './pages/operators/analytics/charts/OperatorScatter';
import OperatorSunburst from './pages/operators/analytics/charts/OperatorSunburst';
import OperatorParallel from './pages/operators/analytics/charts/OperatorParallel';
import OperatorTimeline from './pages/operators/analytics/charts/OperatorTimeline';
import OperatorEntry from './pages/operators/OperatorEntry';
import OperatorBar from './pages/operators/analytics/charts/OperatorBar';
import OperatorBox from './pages/operators/analytics/charts/OperatorBox';
import { isElevatedUserType } from './constants/userTypes';

const hexToRgb = (value) => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().replace(/^#/, '');
  if (normalized.length !== 3 && normalized.length !== 6) {
    return null;
  }
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const numeric = Number.parseInt(expanded, 16);
  if (Number.isNaN(numeric)) {
    return null;
  }
  return {
    r: (numeric >> 16) & 0xff,
    g: (numeric >> 8) & 0xff,
    b: numeric & 0xff,
  };
};

const rgbToHsl = ({ r, g, b }) => {
  if (![r, g, b].every((channel) => typeof channel === 'number')) {
    return null;
  }
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / delta) % 6;
        break;
      case gNorm:
        h = (bNorm - rNorm) / delta + 2;
        break;
      default:
        h = (rNorm - gNorm) / delta + 4;
        break;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h,
    s: s * 100,
    l: l * 100,
  };
};

const applyHslAnimation = (target, hsl) => {
  if (!target || !hsl) {
    return;
  }
  if (target.h && typeof target.h.value === 'number') {
    target.h.value = hsl.h;
  }
  if (target.s && typeof target.s.value === 'number') {
    target.s.value = hsl.s;
  }
  if (target.l && typeof target.l.value === 'number') {
    target.l.value = hsl.l;
  }
};

const updateStrokeOptionsColor = (strokeOptions, color) => {
  if (!strokeOptions) {
    return;
  }
  const applyColor = (stroke) => {
    if (!stroke) {
      return;
    }
    if (typeof stroke.color === 'string') {
      // eslint-disable-next-line no-param-reassign
      stroke.color = color;
      return;
    }
    if (stroke.color && typeof stroke.color === 'object' && 'value' in stroke.color) {
      // eslint-disable-next-line no-param-reassign
      stroke.color.value = color;
    }
  };
  if (Array.isArray(strokeOptions)) {
    strokeOptions.forEach(applyColor);
    return;
  }
  applyColor(strokeOptions);
};

const updateParticleSystemColor = (container, color) => {
  if (!container || typeof color !== 'string') {
    return;
  }

  const rgb = hexToRgb(color);
  if (!rgb) {
    return;
  }

  const hsl = rgbToHsl(rgb);
  if (!hsl) {
    return;
  }

  const applyOptionsColor = (options) => {
    if (!options?.color) {
      return;
    }
    if (typeof options.color === 'string') {
      options.color = color;
    } else if ('value' in options.color) {
      options.color.value = color;
    }
  };

  applyOptionsColor(container.options?.particles);
  applyOptionsColor(container.actualOptions?.particles);

  applyOptionsColor(container.options?.particles?.links);
  applyOptionsColor(container.actualOptions?.particles?.links);

  if (container.particles?.linksColor) {
    container.particles.linksColor = { ...rgb };
  }
  if (container.particles?.linksColors instanceof Map) {
    for (const key of container.particles.linksColors.keys()) {
      container.particles.linksColors.set(key, { ...rgb });
    }
  }

  const particlesArray = container.particles?.array;
  if (Array.isArray(particlesArray)) {
    particlesArray.forEach((particle) => {
      if (!particle) {
        return;
      }
      if (particle.color) {
        applyHslAnimation(particle.color, hsl);
      }
      if (particle.strokeColor) {
        applyHslAnimation(particle.strokeColor, hsl);
      }
      if (particle.bubble) {
        particle.bubble.color = { ...hsl };
        particle.bubble.finalColor = { ...hsl };
      }
      if (particle.options?.color) {
        if (typeof particle.options.color === 'string') {
          particle.options.color = color;
        } else if ('value' in particle.options.color) {
          particle.options.color.value = color;
        }
      }
      if (particle.options?.links?.color) {
        if (typeof particle.options.links.color === 'string') {
          particle.options.links.color = color;
        } else if ('value' in particle.options.links.color) {
          particle.options.links.color.value = color;
        }
      }
      if (particle.options?.stroke) {
        updateStrokeOptionsColor(particle.options.stroke, color);
      }
    });
  }
};

const StableParticles = memo(
  Particles,
  (prevProps, nextProps) => (
    prevProps.className === nextProps.className
    && prevProps.id === nextProps.id
    && prevProps.options === nextProps.options
    && prevProps.particlesLoaded === nextProps.particlesLoaded
  ),
);

// Remote endpoint that delivers the operator dataset spreadsheet.
const OPERATOR_API_URL = 'https://script.google.com/macros/s/AKfycbxNVDGS6t7iJUc-5hnx0pze678LQ6B5pVeUeoSmd1WJ4-9PIV1F0d2qobTtQXkAsujM/exec';
const SESSION_STORAGE_KEY = 'prts-session';
const SESSION_DURATION_MS = 4 * 60 * 60 * 1000;

const readPersistedSession = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (
      !parsed
      || typeof parsed.userType !== 'string'
      || typeof parsed.expiresAt !== 'number'
    ) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    if (Date.now() >= parsed.expiresAt) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch (error) {
    // Clear unreadable session payloads to avoid repeated failures.
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

const persistSession = (userType, expiresAt) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ userType, expiresAt }),
    );
  } catch (error) {
    // Ignore storage failures (e.g., quota or privacy mode).
  }
};

const clearPersistedSession = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    // Ignore storage failures.
  }
};

const transformOperatorPayload = (payload) => {
  if (!Array.isArray(payload) || payload.length === 0) {
    return [];
  }

  const [firstEntry] = payload;

  if (Array.isArray(firstEntry)) {
    const [header, ...rows] = payload;
    if (!Array.isArray(header)) {
      return [];
    }

    return rows.map((row) => {
      const entry = {};
      header.forEach((key, index) => {
        if (!key) {
          return;
        }
        entry[key] = row[index];
      });
      return entry;
    });
  }

  return payload.map((item) => {
    if (item && typeof item === 'object') {
      return item;
    }
    return { value: item };
  });
};

function App() {
  const [session, setSession] = useState({
    isAuthenticated: false,
    userType: null,
    expiresAt: null,
  });
  const [operatorStatus, setOperatorStatus] = useState({
    state: 'idle',
    error: null,
  });
  const [operatorData, setOperatorData] = useState([]);
  const [particlesReady, setParticlesReady] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const canAccessOperators = useMemo(
    () => isElevatedUserType(session.userType),
    [session.userType],
  );

  const handleReset = useCallback(() => {
    clearPersistedSession();
    setSession({ isAuthenticated: false, userType: null, expiresAt: null });
    setOperatorStatus({ state: 'idle', error: null });
    setOperatorData([]);
  }, []);

  const handleAuthenticated = useCallback((userType) => {
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    setSession({ isAuthenticated: true, userType, expiresAt });
    persistSession(userType, expiresAt);
    setOperatorStatus({ state: 'idle', error: null });
    setOperatorData([]);
  }, []);

  useEffect(() => {
    let isMounted = true;

    initParticlesEngine(async (engine) => {
      await loadLinksPreset(engine);
    }).then(() => {
      if (isMounted) {
        setParticlesReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const persisted = readPersistedSession();
    if (persisted) {
      setSession({ isAuthenticated: true, userType: persisted.userType, expiresAt: persisted.expiresAt });
    }
  }, []);

  useEffect(() => {
    if (session.isAuthenticated) {
      if (location.pathname === '/') {
        navigate('/dashboard', { replace: true });
      }
    } else if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [session.isAuthenticated, location.pathname, navigate]);

  useEffect(() => {
    if (!session.isAuthenticated || !session.expiresAt) {
      return undefined;
    }

    const remaining = session.expiresAt - Date.now();
    if (remaining <= 0) {
      handleReset();
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      handleReset();
    }, remaining);

    return () => {
      clearTimeout(timeoutId);
    };
    // handleReset intentionally included to ensure the latest reset logic is used.
  }, [session.isAuthenticated, session.expiresAt, handleReset]);

  useEffect(() => {
    if (!session.isAuthenticated) {
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const loadOperators = async () => {
      setOperatorStatus({ state: 'loading', error: null });
      try {
        const response = await fetch(OPERATOR_API_URL, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Request failed :: ${response.status}`);
        }
        const payload = await response.json();
        if (!isMounted) {
          return;
        }
        setOperatorData(transformOperatorPayload(payload));
        setOperatorStatus({ state: 'loaded', error: null });
      } catch (error) {
        if (!isMounted || error.name === 'AbortError') {
          return;
        }
        setOperatorStatus({
          state: 'error',
          error: error.message || 'Unable to retrieve operator records.',
        });
      }
    };

    loadOperators();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [session.isAuthenticated]);

  const operatorMeta = useMemo(() => ({
    status: operatorStatus,
    data: operatorData,
    rows: operatorData.length,
  }), [operatorStatus, operatorData]);
  const particleColor = useMemo(() => {
    switch (session.userType) {
      case 'admin':
        return '#ffd60a';
      case 'welcomefrompriestess':
        return '#8b0000';
      case 'welcomefromcivilight':
        return '#ffb6c1';
      default:
        return '#000000';
    }
  }, [session.userType]);
  const particlesContainerRef = useRef(null);
  const latestParticleColorRef = useRef(particleColor);
  const particlesOptions = useMemo(() => ({
    preset: 'links',
    background: {
      color: {
        value: 'transparent',
      },
    },
    fullScreen: {
      enable: false,
      zIndex: 0,
    },
    particles: {
      color: {
        value: '#000000',
      },
      links: {
        color: {
          value: '#000000',
        },
        opacity: 0.9,
        width: 2.5,
      },
      size: {
        value: 3,
      },
    },
  }), []);
  const handleParticlesLoaded = useCallback((container) => {
    particlesContainerRef.current = container;
    if (container) {
      updateParticleSystemColor(container, latestParticleColorRef.current);
    }
  }, []);

  useEffect(() => {
    latestParticleColorRef.current = particleColor;
    if (particlesContainerRef.current) {
      updateParticleSystemColor(particlesContainerRef.current, particleColor);
    }
  }, [particleColor]);

  const authenticatedContent = (
    <Routes>
        <Route
          path="/dashboard"
          element={(
            <Dashboard
              userType={session.userType}
              onReset={handleReset}
              onOpenOperatorTable={() => navigate('/operator-table')}
              onOpenOperatorStats={() => navigate('/operator-stats')}
              operatorStatus={operatorMeta}
              showOperatorStats={canAccessOperators}
              showOperatorAccess={canAccessOperators}
            />
          )}
        />
        <Route
          path="/operator-table"
          element={
            canAccessOperators ? (
              <OperatorTable
                operatorStatus={operatorMeta}
                onBack={() => navigate('/dashboard')}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/operator-table/operator/:operatorId"
          element={
            canAccessOperators ? (
              <OperatorEntry
                operatorStatus={operatorMeta}
                onBack={() => navigate('/operator-table')}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/operator-stats"
          element={
            canAccessOperators ? (
              <OperatorStats
                operatorStatus={operatorMeta}
                onBack={() => navigate('/dashboard')}
                onOpenSunburst={() => navigate('/operator-stats/sunburst')}
                onOpenScatter={() => navigate('/operator-stats/scatter')}
                onOpenTimeline={() => navigate('/operator-stats/timeline')}
                onOpenBar={() => navigate('/operator-stats/bar')}
                onOpenParallel={() => navigate('/operator-stats/parallel')}
                onOpenBox={() => navigate('/operator-stats/box')}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/operator-stats/sunburst"
          element={
            canAccessOperators ? (
              <OperatorSunburst
                operatorStatus={operatorMeta}
                onBack={() => navigate('/operator-stats')}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/operator-stats/bar"
          element={
            canAccessOperators ? (
              <OperatorBar
                operatorStatus={operatorMeta}
                onBack={() => navigate('/operator-stats')}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/operator-stats/timeline"
          element={
            canAccessOperators ? (
              <OperatorTimeline
                operatorStatus={operatorMeta}
                onBack={() => navigate('/operator-stats')}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/operator-stats/scatter"
          element={
            canAccessOperators ? (
              <OperatorScatter
                operatorStatus={operatorMeta}
                onBack={() => navigate('/operator-stats')}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/operator-stats/parallel"
          element={
            canAccessOperators ? (
              <OperatorParallel
                operatorStatus={operatorMeta}
                onBack={() => navigate('/operator-stats')}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/operator-stats/box"
          element={
            canAccessOperators ? (
              <OperatorBox
                operatorStatus={operatorMeta}
                onBack={() => navigate('/operator-stats')}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
  );

  const content = session.isAuthenticated ? authenticatedContent : (
    <Login onAuthenticated={handleAuthenticated} />
  );

  return (
    <div className="app-root">
      {particlesReady && (
        <StableParticles
          id="tsparticles"
          className="particles-background"
          options={particlesOptions}
          particlesLoaded={handleParticlesLoaded}
        />
      )}
      <div className="app-content">
        {content}
      </div>
    </div>
  );
}

export default App;
