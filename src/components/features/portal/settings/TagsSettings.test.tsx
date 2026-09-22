import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StubPortalProvider } from "@/lib/portal";
import { TagsSettings } from "./TagsSettings";

vi.mock("@/lib/api", () => {
  const palette = [
    { id: "red", label: "Red", dot: "bg-red-500", pill: "bg-red-500 text-white" },
    { id: "amber", label: "Amber", dot: "bg-amber-500", pill: "bg-amber-500" },
    { id: "blue", label: "Blue", dot: "bg-blue-500", pill: "bg-blue-500 text-white" },
    { id: "violet", label: "Violet", dot: "bg-violet-500", pill: "bg-violet-500" },
    { id: "green", label: "Green", dot: "bg-green-500", pill: "bg-green-500" },
    { id: "teal", label: "Teal", dot: "bg-teal-500", pill: "bg-teal-500" },
    { id: "slate", label: "Slate", dot: "bg-slate-400", pill: "bg-slate-400" },
    { id: "pink", label: "Pink", dot: "bg-pink-500", pill: "bg-pink-500 text-white" },
  ];
  return {
  leadTagLabel: (tag: string) =>
    ({ vip: "VIP", sales: "Sales", website_quote: "Website Quote" })[tag] ??
    tag,
  LEAD_TAG_PALETTE: palette,
  leadTagColor: (_tag: string, stored?: string | null) =>
    palette.find((entry) => entry.id === stored) ?? palette[0],
  leadTagsOf: (submission: { tags?: string[] }) => submission.tags ?? [],
  leadStatusOf: (submission: { status?: string }) => submission.status ?? "new",
  LEAD_STATUS_LABELS: {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    won: "Won",
    lost: "Lost",
  },
  listProjectTags: vi.fn(),
  createProjectTag: vi.fn(),
  renameProjectTag: vi.fn(),
  recolorProjectTag: vi.fn(),
  deleteProjectTag: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
  };
});

import {
  createProjectTag,
  deleteProjectTag,
  recolorProjectTag,
  renameProjectTag,
  type Submission,
} from "@/lib/api";
import { tagPreviewLead, tagUsageExample } from "./TagsSettings";

function lead(
  partial: Partial<Submission> &
    Pick<Submission, "submissionId" | "submittedAt">,
): Submission {
  return {
    clientId: "c1",
    senderName: "Jordan Hale",
    senderEmail: "jordan@northline.co",
    message: "",
    ...partial,
  };
}

function renderTags(tags: string[], items: Submission[] = []) {
  const setLeadTags = vi.fn();
  render(
    <StubPortalProvider value={{ setLeadTags, items }}>
      <TagsSettings initialState={{ tags }} />
    </StubPortalProvider>,
  );
  return { setLeadTags };
}

describe("TagsSettings", () => {
  beforeEach(() => {
    vi.mocked(createProjectTag).mockReset();
    vi.mocked(renameProjectTag).mockReset();
    vi.mocked(recolorProjectTag).mockReset();
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

    expect(createProjectTag).toHaveBeenCalledWith("Hot lead", "red");
    expect(setLeadTags).toHaveBeenCalledWith(["hot lead", "sales"]);
    expect(screen.getByRole("list")).toHaveTextContent("hot lead");
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
    expect(screen.getByRole("list")).toHaveTextContent("priority");
  });

  it("does not rename a tag to a blank name", async () => {
    const user = userEvent.setup();
    renderTags(["vip"]);

    await user.click(screen.getByRole("button", { name: /rename vip/i }));
    const field = screen.getByRole("textbox", { name: /rename vip/i });
    await user.clear(field);
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(renameProjectTag).not.toHaveBeenCalled();
    expect(screen.getByRole("list")).toHaveTextContent("VIP");
  });

  it("picks the newest lead that has tags", () => {
    const older = lead({
      submissionId: "older",
      submittedAt: "2026-01-01T00:00:00.000Z",
      tags: ["vip"],
    });
    const newer = lead({
      submissionId: "newer",
      submittedAt: "2026-06-01T00:00:00.000Z",
      tags: ["sales"],
      senderName: "Newer Lead",
    });
    const plain = lead({
      submissionId: "plain",
      submittedAt: "2026-09-01T00:00:00.000Z",
      tags: [],
    });

    expect(tagPreviewLead([older, plain, newer])?.submissionId).toBe("newer");
    expect(tagPreviewLead([plain])).toBeNull();
  });

  it("shows a sample lead when nothing in the inbox is tagged", () => {
    const example = tagUsageExample(["vip", "sales"], []);
    expect(example).toMatchObject({
      name: "Jordan Hale",
      email: "jordan@northline.co",
      tags: ["vip", "sales"],
      source: "Website",
      stage: "Proposal",
    });

    renderTags(["vip", "sales"]);
    const preview = screen.getByRole("complementary", { name: /^lead$/i });
    expect(preview).toHaveTextContent("Jordan Hale");
    expect(preview).toHaveTextContent("VIP");
    expect(preview).toHaveTextContent("Sales");
    expect(preview).toHaveTextContent("Website");
    expect(preview).toHaveTextContent("Proposal");
  });

  it("saves a new color on the tag", async () => {
    const user = userEvent.setup();
    const setLeadTagColors = vi.fn();
    vi.mocked(recolorProjectTag).mockResolvedValue({
      tags: ["vip"],
      colors: { vip: "green" },
    });
    render(
      <StubPortalProvider value={{ setLeadTagColors }}>
        <TagsSettings initialState={{ tags: ["vip"], colors: { vip: "red" } }} />
      </StubPortalProvider>,
    );

    await user.click(screen.getByRole("button", { name: /color for vip/i }));
    await user.click(
      screen.getByRole("button", { name: /^green$/i }),
    );

    expect(recolorProjectTag).toHaveBeenCalledWith("vip", "green");
    expect(setLeadTagColors).toHaveBeenCalledWith({ vip: "green" });
  });

  it("shows that lead beside the tag list", () => {
    renderTags(
      ["sales", "vip"],
      [
        lead({
          submissionId: "lead-1",
          submittedAt: "2026-06-01T00:00:00.000Z",
          tags: ["vip", "sales"],
          formName: "Website",
          status: "qualified",
        }),
      ],
    );

    const preview = screen.getByRole("complementary", { name: /^lead$/i });
    expect(preview).toHaveTextContent("Jordan Hale");
    expect(preview).toHaveTextContent("jordan@northline.co");
    expect(preview).toHaveTextContent("VIP");
    expect(preview).toHaveTextContent("Sales");
    expect(preview).toHaveTextContent("Website");
    expect(preview).toHaveTextContent("Qualified");
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
