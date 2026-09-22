import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StubPortalProvider } from "@/lib/portal";
import { TagsSettings } from "./TagsSettings";

vi.mock("@/lib/api", () => ({
  leadTagLabel: (tag: string) =>
    ({ vip: "VIP", sales: "Sales", website_quote: "Website Quote" })[tag] ??
    tag,
  listProjectTags: vi.fn(),
  createProjectTag: vi.fn(),
  renameProjectTag: vi.fn(),
  deleteProjectTag: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

import { createProjectTag, deleteProjectTag, renameProjectTag } from "@/lib/api";

function renderTags(tags: string[]) {
  const setLeadTags = vi.fn();
  render(
    <StubPortalProvider value={{ setLeadTags }}>
      <TagsSettings initialState={{ tags }} />
    </StubPortalProvider>,
  );
  return { setLeadTags };
}

describe("TagsSettings", () => {
  beforeEach(() => {
    vi.mocked(createProjectTag).mockReset();
    vi.mocked(renameProjectTag).mockReset();
    vi.mocked(deleteProjectTag).mockReset();
  });

  it("adds a tag", async () => {
    const user = userEvent.setup();
    vi.mocked(createProjectTag).mockResolvedValue({
      tags: ["hot lead", "sales"],
    });
    const { setLeadTags } = renderTags(["sales"]);

    await user.type(screen.getByRole("textbox", { name: /tag name/i }), "Hot lead");
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(createProjectTag).toHaveBeenCalledWith("Hot lead");
    expect(setLeadTags).toHaveBeenCalledWith(["hot lead", "sales"]);
    expect(screen.getByText("hot lead")).toBeInTheDocument();
  });

  it("renames a tag", async () => {
    const user = userEvent.setup();
    vi.mocked(renameProjectTag).mockResolvedValue({ tags: ["priority"] });
    renderTags(["vip"]);

    await user.click(screen.getByRole("button", { name: /rename vip/i }));
    const field = screen.getByRole("textbox", { name: /rename vip/i });
    await user.clear(field);
    await user.type(field, "priority");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(renameProjectTag).toHaveBeenCalledWith("vip", "priority");
    expect(screen.getByText("priority")).toBeInTheDocument();
  });

  it("does not rename a tag to a blank name", async () => {
    const user = userEvent.setup();
    renderTags(["vip"]);

    await user.click(screen.getByRole("button", { name: /rename vip/i }));
    const field = screen.getByRole("textbox", { name: /rename vip/i });
    await user.clear(field);
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(renameProjectTag).not.toHaveBeenCalled();
    expect(screen.getByText("VIP")).toBeInTheDocument();
  });

  it("removes a tag", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteProjectTag).mockResolvedValue({ tags: ["sales"] });
    const { setLeadTags } = renderTags(["sales", "vip"]);

    await user.click(screen.getByRole("button", { name: /remove vip/i }));

    expect(deleteProjectTag).toHaveBeenCalledWith("vip");
    expect(setLeadTags).toHaveBeenCalledWith(["sales"]);
    expect(screen.queryByText("VIP")).not.toBeInTheDocument();
  });
});
