import { useState, useEffect, createContext, useContext } from 'react';
import SpaceEnvironment from './SpaceEnvironment';
import { generateSatelliteIdentity } from '../utils/satelliteIdentity';
import { getTheme, applyThemeToDOM, DEFAULT_THEME_ID } from '../config/themes';

const AuthenticatedContext = createContext(null);

export function useMissionControl() {
  return useContext(AuthenticatedContext);
}

export default function AuthenticatedLayout({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aerospec_user') || '{}');
    } catch {
      return {};
    }
  });

  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem('aerospec_theme') || user.theme || DEFAULT_THEME_ID;
  });

  const [satellite, setSatellite] = useState(() => generateSatelliteIdentity(user));

  useEffect(() => {
    const activeTheme = applyThemeToDOM(themeId);
    localStorage.setItem('aerospec_theme', themeId);
  }, [themeId]);

  useEffect(() => {
    const updatedSat = generateSatelliteIdentity(user);
    setSatellite(updatedSat);
  }, [user.id, user.email]);

  const handleThemeChange = async (newThemeId) => {
    setThemeId(newThemeId);
    localStorage.setItem('aerospec_theme', newThemeId);
    
    // Attempt to persist to backend user profile if authenticated
    if (user.email) {
      try {
        await fetch('/api/user/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, theme: newThemeId })
        });
        const updatedUser = { ...user, theme: newThemeId };
        setUser(updatedUser);
        localStorage.setItem('aerospec_user', JSON.stringify(updatedUser));
      } catch (err) {
        console.warn('Failed to sync theme preference to backend:', err);
      }
    }
  };

  const handleUserUpdate = (updatedUserData) => {
    const merged = { ...user, ...updatedUserData };
    setUser(merged);
    localStorage.setItem('aerospec_user', JSON.stringify(merged));
  };

  const contextValue = {
    user,
    setUser: handleUserUpdate,
    themeId,
    setThemeId: handleThemeChange,
    theme: getTheme(themeId),
    satellite
  };

  return (
    <AuthenticatedContext.Provider value={contextValue}>
      <div className="aero-mission-control-root" style={{ position: 'relative', minHeight: '100vh', width: '100%' }}>
        {/* Continuous Cinematic Space Environment (Fixed Background) */}
        <SpaceEnvironment userSatellite={satellite} themeId={themeId} />

        {/* Foreground Mission Control Content */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          {children}
        </div>
      </div>
    </AuthenticatedContext.Provider>
  );
}
