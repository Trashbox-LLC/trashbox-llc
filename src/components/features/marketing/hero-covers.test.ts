import { heroCoverFromId } from "./hero-covers";

describe("heroCoverFromId", () => {
  it("returns the cover that matches the id", () => {
    expect(heroCoverFromId("dallas-dusk")).toMatchObject({
      id: "dallas-dusk",
      src: "/images/home/skyline-dallas-dusk.jpg",
    });
  });

  it("falls back to the late-day cover when the id is missing", () => {
    expect(heroCoverFromId(null).id).toBe("late-day");
    expect(heroCoverFromId("").id).toBe("late-day");
    expect(heroCoverFromId("missing").id).toBe("late-day");
  });
});
