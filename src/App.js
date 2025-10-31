import { useCallback, useEffect, useMemo, useState } from 'react';
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
        value: particleColor,
      },
      links: {
        color: {
          value: particleColor,
        },
        opacity: 0.9,
        width: 2.5,
      },
      size: {
        value: 3,
      },
    },
  }), [particleColor]);

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
        <Particles
          id="tsparticles"
          className="particles-background"
          options={particlesOptions}
        />
      )}
      <div className="app-content">
        {content}
      </div>
    </div>
  );
}

export default App;
