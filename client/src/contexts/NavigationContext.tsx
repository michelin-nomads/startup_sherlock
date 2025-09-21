import React, { createContext, useContext, useState } from "react";

// Navigation context
interface NavigationContextType {
  currentPath: string;
  params: Record<string, string>;
  navigate: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [currentPath, setCurrentPath] = useState("/");
  const [params, setParams] = useState<Record<string, string>>({});

  // Parse path and extract parameters
  const navigate = (path: string) => {
    const [basePath, paramString] = path.split("?");
    const urlParams: Record<string, string> = {};
    
    // Handle path parameters like /analysis/:id
    if (basePath.startsWith("/analysis/") && basePath !== "/analysis") {
      const id = basePath.split("/analysis/")[1];
      urlParams.id = id;
      setCurrentPath("/analysis");
    } else {
      setCurrentPath(basePath);
    }
    
    // Handle query parameters
    if (paramString) {
      const searchParams = new URLSearchParams(paramString);
      searchParams.forEach((value, key) => {
        urlParams[key] = value;
      });
    }
    
    setParams(urlParams);
  };

  const navigationValue: NavigationContextType = {
    currentPath,
    params,
    navigate,
  };

  return (
    <NavigationContext.Provider value={navigationValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export { NavigationContext };
