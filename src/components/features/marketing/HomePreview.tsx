"use client";

import { useEffect, useState } from "react";
import { HomeDevSettings } from "@/components/features/marketing/HomeDevSettings";
import { HomePage } from "@/components/features/marketing/HomePage";
import { PublishedHomePage } from "@/components/features/marketing/PublishedHomePage";
import {
  DEFAULT_HOME_DEV_SETTINGS,
  readHomeDevSettings,
  writeHomeDevSettings,
  type HomeDevSettings as HomeDevSettingsValue,
} from "@/components/features/marketing/home-dev-settings";

export function HomePreview() {
  const [settings, setSettings] = useState(DEFAULT_HOME_DEV_SETTINGS);

  useEffect(() => {
    setSettings(readHomeDevSettings(localStorage));
  }, []);

  function changeSettings(next: HomeDevSettingsValue) {
    setSettings(next);
    writeHomeDevSettings(localStorage, next);
  }

  return (
    <>
      {settings.layout === "published" ? (
        <PublishedHomePage />
      ) : (
        <HomePage
          headline={settings.headline}
          coverId={settings.coverId}
          kicker={settings.kicker}
        />
      )}
      <HomeDevSettings value={settings} onChange={changeSettings} />
    </>
  );
}
