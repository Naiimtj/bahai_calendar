import { createContext, useContext } from 'react';
import { useUrlPage } from '../hooks/useUrlPage';

const NavigationContext = createContext(null);

/** Exposes the current page + setter so deeply nested components can navigate without prop-drilling. */
export function NavigationProvider({ children }) {
  const [page, setPage] = useUrlPage();
  return (
    <NavigationContext.Provider value={{ page, setPage }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
