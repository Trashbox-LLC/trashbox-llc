import { googleRatingSummary } from "./HomeReviews";

describe("googleRatingSummary", () => {
  it("averages ratings to one decimal and rounds the star count", () => {
    expect(
      googleRatingSummary([{ rating: 5 }, { rating: 4 }, { rating: 5 }]),
    ).toEqual({ label: "4.7", stars: 5 });
  });

  it("returns zero when there are no reviews", () => {
    expect(googleRatingSummary([])).toEqual({ label: "0.0", stars: 0 });
  });
});
