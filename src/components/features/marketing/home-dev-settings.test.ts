import { HERO_COVER_STORAGE_KEY } from "./hero-covers";
import {
  DEFAULT_HOME_DEV_SETTINGS,
  DEFAULT_KICKER_SETTINGS,
  HOME_DEV_STORAGE_KEY,
  kickerClassName,
  parseHomeDevSettings,
  readHomeDevSettings,
} from "./home-dev-settings";

describe("parseHomeDevSettings", () => {
  it("returns the saved photo, headline, and layout", () => {
    expect(
      parseHomeDevSettings(
        JSON.stringify({
          coverId: "night",
          headline: "solid",
          layout: "published",
        }),
      ),
    ).toEqual({
      ...DEFAULT_HOME_DEV_SETTINGS,
      coverId: "night",
      headline: "solid",
      layout: "published",
    });
  });

  it("falls back when the saved settings are missing or invalid", () => {
    expect(parseHomeDevSettings(null)).toEqual(DEFAULT_HOME_DEV_SETTINGS);
    expect(parseHomeDevSettings("{")).toEqual(DEFAULT_HOME_DEV_SETTINGS);
    expect(
      parseHomeDevSettings(
        JSON.stringify({
          coverId: "nope",
          headline: "blue",
          layout: "draft",
          kicker: { size: "huge", weight: "bold" },
        }),
      ),
    ).toEqual({
      ...DEFAULT_HOME_DEV_SETTINGS,
      kicker: { ...DEFAULT_KICKER_SETTINGS, weight: "bold" },
    });
  });

  it("replaces the previous eyebrow default when that is what was saved", () => {
    expect(
      parseHomeDevSettings(
        JSON.stringify({
          kicker: {
            size: "base",
            weight: "regular",
            color: "soft",
            tracking: "normal",
            case: "text",
          },
        }),
      ).kicker,
    ).toEqual(DEFAULT_KICKER_SETTINGS);
  });

  it("starts the eyebrow in full caps at extra large size with tight spacing", () => {
    expect(DEFAULT_KICKER_SETTINGS).toEqual({
      size: "xl",
      weight: "regular",
      color: "soft",
      tracking: "tight",
      case: "caps",
    });
  });

  it("keeps a saved header color and ignores an unknown one", () => {
    expect(parseHomeDevSettings(JSON.stringify({ header: "white" })).header).toBe(
      "white",
    );
    expect(parseHomeDevSettings(JSON.stringify({ header: "blue" })).header).toBe(
      "grey",
    );
  });

  it("maps eyebrow choices onto type styles", () => {
    expect(
      kickerClassName({
        size: "xl",
        weight: "bold",
        color: "grey",
        tracking: "wide",
        case: "caps",
      }),
    ).toBe(
      "shrink-0 text-balance text-xl font-bold text-white/50 tracking-widest uppercase",
    );
  });

  it("keeps a previously chosen photo when the settings blob is absent", () => {
    const storage = {
      getItem(key: string) {
        if (key === HOME_DEV_STORAGE_KEY) return null;
        if (key === HERO_COVER_STORAGE_KEY) return "dallas-day";
        return null;
      },
    };

    expect(readHomeDevSettings(storage).coverId).toBe("dallas-day");
  });
});
