import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Theme, useTheme } from "@mui/material";

interface TailwindContextType {
  theme: Theme;
  headerContent: ReactNode;
  setHeaderContent: React.Dispatch<React.SetStateAction<ReactNode>>;
  headerTitle: string;
  setHeaderTitle: React.Dispatch<React.SetStateAction<string>>;
}

const TailwindContext = createContext<TailwindContextType>({
  theme: {} as Theme,
  headerContent: <></>,
  setHeaderContent: () => {},
  headerTitle: "",
  setHeaderTitle: () => {},
});

interface TailwindProviderProps {
  children: ReactNode;
}

export const TailwindProvider: React.FC<TailwindProviderProps> = ({
  children,
}) => {
  const theme = useTheme();
  const [headerContent, setHeaderContent] = useState<ReactNode>(<></>);
  const [headerTitle, setHeaderTitle] = useState<string>("");
  const updateCSSVariables = (theme: Theme) => {
    const root = document.documentElement;

    root.style.setProperty("--primary-main", theme.palette.primary.main);
    root.style.setProperty("--primary-light", theme.palette.primary.light);
    root.style.setProperty("--primary-dark", theme.palette.primary.dark);
    root.style.setProperty(
      "--primary-contrastText",
      theme.palette.primary.contrastText
    );

    root.style.setProperty("--secondary-main", theme.palette.secondary.main);
    root.style.setProperty("--secondary-light", theme.palette.secondary.light);
    root.style.setProperty("--secondary-dark", theme.palette.secondary.dark);
    root.style.setProperty(
      "--secondary-contrastText",
      theme.palette.secondary.contrastText
    );

    root.style.setProperty("--success-main", theme.palette.success.main);
    root.style.setProperty("--success-light", theme.palette.success.light);
    root.style.setProperty("--success-dark", theme.palette.success.dark);
    root.style.setProperty(
      "--success-contrastText",
      theme.palette.success.contrastText
    );

    root.style.setProperty("--info-main", theme.palette.info.main);
    root.style.setProperty("--info-light", theme.palette.info.light);
    root.style.setProperty("--info-dark", theme.palette.info.dark);
    root.style.setProperty(
      "--info-contrastText",
      theme.palette.info.contrastText
    );

    root.style.setProperty("--error-main", theme.palette.error.main);
    root.style.setProperty("--error-light", theme.palette.error.light);
    root.style.setProperty("--error-dark", theme.palette.error.dark);
    root.style.setProperty(
      "--error-contrastText",
      theme.palette.error.contrastText
    );

    root.style.setProperty("--warning-main", theme.palette.warning.main);
    root.style.setProperty("--warning-light", theme.palette.warning.light);
    root.style.setProperty("--warning-dark", theme.palette.warning.dark);
    root.style.setProperty(
      "--warning-contrastText",
      theme.palette.warning.contrastText
    );

    root.style.setProperty("--grey-50", theme.palette.grey[50]);
    root.style.setProperty("--grey-100", theme.palette.grey[100]);
    root.style.setProperty("--grey-200", theme.palette.grey[200]);
    root.style.setProperty("--grey-300", theme.palette.grey[300]);
    root.style.setProperty("--grey-400", theme.palette.grey[400]);
    root.style.setProperty("--grey-500", theme.palette.grey[500]);
    root.style.setProperty("--grey-600", theme.palette.grey[600]);
    root.style.setProperty("--grey-700", theme.palette.grey[700]);
    root.style.setProperty("--grey-800", theme.palette.grey[800]);
    root.style.setProperty("--grey-900", theme.palette.grey[900]);

    root.style.setProperty("--text-primary", theme.palette.text.primary);
    root.style.setProperty("--text-secondary", theme.palette.text.secondary);
    root.style.setProperty("--text-disabled", theme.palette.text.disabled);

    root.style.setProperty("--divider", theme.palette.divider);
    root.style.setProperty(
      "--background-paper",
      theme.palette.background.paper
    );
    root.style.setProperty(
      "--background-default",
      theme.palette.background.default
    );
  };

  useEffect(() => {
    updateCSSVariables(theme);
  }, [theme]);

  return (
    <TailwindContext.Provider
      value={{
        headerContent,
        setHeaderContent,
        theme,
        headerTitle,
        setHeaderTitle,
      }}
    >
      {children}
    </TailwindContext.Provider>
  );
};

export const useTailwind = () => useContext(TailwindContext);
