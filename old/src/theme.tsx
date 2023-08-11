import React from "react";

export interface MKTheme {
  background: string;
  foreground: string;
}

const ThemeContext = React.createContext<MKTheme>({
  background: "white",
  foreground: "black",
});

const useTheme = () => React.useContext(ThemeContext);
const ThemeProvider: React.FC<{ value: MKTheme; children: React.ReactNode }> = (
  props
) => (
  <ThemeContext.Provider value={props.value}>
    {props.children}
  </ThemeContext.Provider>
);

export { useTheme, ThemeProvider };
