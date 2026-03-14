"use client";

import { useTheme } from "@/components/ui/theme-provider";

export function ThemeSettingsCard() {
  const { theme, toggle } = useTheme();

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Theme</p>
          <h3>Appearance</h3>
        </div>
      </div>
      <p className="subtle">Current theme: <strong>{theme === "light" ? "Light" : "Dark"}</strong></p>
      <button className="primary" type="button" onClick={toggle}>
        {theme === "light" ? "Switch to dark" : "Switch to light"}
      </button>
    </div>
  );
}
