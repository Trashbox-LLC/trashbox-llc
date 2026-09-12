import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SmsApplication, SmsApplicationBusiness } from "@/lib/api";
import { SmsNumberApplication } from "./SmsNumberApplication";

const business: SmsApplicationBusiness = {
  companyName: "Austin Dumpsters LLC",
  companyWebsite: "https://austindumpsters.com",
  taxId: "12-3456789",
  addressLine1: "100 Main St",
  city: "Austin",
  state: "TX",
  postalCode: "78701",
  contactName: "Jane Doe",
  contactEmail: "jane@austindumpsters.com",
  contactPhone: "+15125550134",
  useCaseCategory: "Customer Care",
  useCaseDescription: "Replying to quote requests from our website form.",
  optInType: "digital-form",
  optInDescription: "Customers check a box agreeing to text replies.",
  sampleMessages: ["We can deliver Thursday. Reply STOP to opt out."],
  monthlyMessageVolume: "1,000",
};

function application(overrides: Partial<SmsApplication> = {}): SmsApplication {
  return {
    status: "pending_review",
    business,
    submittedAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
    carrierAttempts: 0,
    canResubmit: false,
    ...overrides,
  };
}

function setup(
  props: Partial<Parameters<typeof SmsNumberApplication>[0]> = {},
) {
  const onApply = vi.fn().mockResolvedValue(undefined);
  const onWithdraw = vi.fn().mockResolvedValue(undefined);
  render(
    <SmsNumberApplication
      application={null}
      availableOnPlan
      canManage
      onApply={onApply}
      onWithdraw={onWithdraw}
      {...props}
    />,
  );
  return { onApply, onWithdraw, user: userEvent.setup() };
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/legal business name/i), "Austin Dumpsters LLC");
  await user.type(screen.getByLabelText(/website/i), "https://austindumpsters.com");
  await user.type(screen.getByLabelText(/ein/i), "12-3456789");
  await user.type(screen.getByLabelText(/^street/i), "100 Main St");
  await user.type(screen.getByLabelText(/^city/i), "Austin");
  await user.type(screen.getByLabelText(/^state/i), "TX");
  await user.type(screen.getByLabelText(/zip/i), "78701");
  await user.type(screen.getByLabelText(/contact name/i), "Jane Doe");
  await user.type(screen.getByLabelText(/contact email/i), "jane@austindumpsters.com");
  await user.type(screen.getByLabelText(/contact phone/i), "5125550134");
  await user.type(
    screen.getByLabelText(/what you will text about/i),
    "Replying to quote requests from our website form.",
  );
  await user.type(
    screen.getByLabelText(/describe the opt-in step/i),
    "Customers check a box agreeing to text replies.",
  );
  await user.type(
    screen.getByLabelText(/example text/i),
    "We can deliver Thursday. Reply STOP to opt out.",
  );
}

describe("SmsNumberApplication", () => {
  it("submits the details the client entered", async () => {
    const { onApply, user } = setup();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /apply/i }));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0]).toMatchObject({
      companyName: "Austin Dumpsters LLC",
      companyWebsite: "https://austindumpsters.com",
      taxId: "12-3456789",
      contactPhone: "5125550134",
      sampleMessages: ["We can deliver Thursday. Reply STOP to opt out."],
    });
  });

  it("will not submit until the required details are filled in", async () => {
    const { onApply, user } = setup();

    await user.click(screen.getByRole("button", { name: /apply/i }));

    expect(onApply).not.toHaveBeenCalled();
  });

  it("marks the fields the server rejected", () => {
    setup({ fieldErrors: ["companyWebsite"] });

    expect(screen.getByLabelText(/website/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("offers no form while an application is in review", () => {
    setup({ application: application() });

    expect(
      screen.queryByRole("button", { name: /apply/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the live number once the carriers approve", () => {
    setup({
      application: application({
        status: "approved",
        phoneNumber: "+18885550101",
        phoneNumberDisplay: "(888) 555-0101",
      }),
    });

    expect(screen.getByText("(888) 555-0101")).toBeInTheDocument();
  });

  it("explains what to fix when an application comes back", () => {
    setup({
      application: application({
        status: "changes_requested",
        canResubmit: true,
        statusReason: "The website does not mention texting.",
      }),
    });

    expect(
      screen.getByText(/website does not mention texting/i),
    ).toBeInTheDocument();
  });

  it("reopens the form prefilled so a refile is an edit, not a retype", async () => {
    const { user } = setup({
      application: application({
        status: "changes_requested",
        canResubmit: true,
      }),
    });

    await user.click(screen.getByRole("button", { name: /edit/i }));

    expect(screen.getByLabelText(/legal business name/i)).toHaveValue(
      "Austin Dumpsters LLC",
    );
  });

  it("offers no refile once the carriers reject the last attempt", () => {
    setup({
      application: application({
        status: "changes_requested",
        canResubmit: false,
        carrierAttempts: 2,
      }),
    });

    expect(
      screen.queryByRole("button", { name: /edit/i }),
    ).not.toBeInTheDocument();
  });

  it("withdraws an application", async () => {
    const { onWithdraw, user } = setup({ application: application() });

    await user.click(screen.getByRole("button", { name: /withdraw|turn off/i }));

    expect(onWithdraw).toHaveBeenCalled();
  });

  it("hides the form from members who cannot manage texting", () => {
    setup({ canManage: false });

    expect(
      screen.queryByRole("button", { name: /apply/i }),
    ).not.toBeInTheDocument();
  });

  it("points at billing on a plan without texting", () => {
    setup({ availableOnPlan: false });

    expect(
      screen.queryByRole("button", { name: /apply/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /plan/i })).toBeInTheDocument();
  });

  it("splits multiple example texts into separate samples", async () => {
    const { onApply, user } = setup();

    await fillForm(user);
    await user.clear(screen.getByLabelText(/example text/i));
    await user.type(
      screen.getByLabelText(/example text/i),
      "First sample{enter}Second sample",
    );
    await user.click(screen.getByRole("button", { name: /apply/i }));

    expect(onApply.mock.calls[0][0].sampleMessages).toEqual([
      "First sample",
      "Second sample",
    ]);
  });
});
