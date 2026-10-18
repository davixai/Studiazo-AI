import { beforeEach, describe, expect, it, vi } from "vitest";

// Supabase și redirect-ul Next sunt simulate: testăm doar cum citește acțiunea răspunsul la înregistrare.
const signUpMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { signUp: signUpMock } }) }));
vi.mock("@/lib/env", () => ({ isPreviewMode: () => false, isSupabaseConfigured: () => true, publicEnv: { appUrl: "http://localhost:3000" } }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

const { signUp } = await import("./actions");

function form() {
  const data = new FormData();
  data.set("fullName", "Ana Popescu");
  data.set("email", "ana@example.com");
  data.set("password", "o-parola-buna-123");
  return data;
}

describe("înregistrarea cu un email care are deja cont", () => {
  beforeEach(() => signUpMock.mockReset());

  it("cu confirmarea emailului oprită: eroarea „user_already_exists” → „Ai deja cont”", async () => {
    signUpMock.mockResolvedValue({ data: { user: null, session: null }, error: { code: "user_already_exists" } });
    const state = await signUp({ status: "idle" }, form());
    expect(state).toMatchObject({ status: "error", accountExists: true, values: { email: "ana@example.com" } });
    expect(state.fieldErrors?.email).toBeDefined();
  });

  it("cu confirmarea pornită: utilizator fără identități → „Ai deja cont”, nu „Verifică-ți emailul”", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "x", identities: [] }, session: null }, error: null });
    const state = await signUp({ status: "idle" }, form());
    expect(state.status).toBe("error");
    expect(state.accountExists).toBe(true);
  });

  it("un cont nou cu confirmarea pornită primește în continuare „Verifică-ți emailul”", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "x", identities: [{ id: "i" }] }, session: null }, error: null });
    const state = await signUp({ status: "idle" }, form());
    expect(state.status).toBe("success");
    expect(state.accountExists).toBeUndefined();
  });

  it("un cont nou fără confirmare intră direct în configurare", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "x", identities: [{ id: "i" }] }, session: { access_token: "t" } }, error: null });
    await expect(signUp({ status: "idle" }, form())).rejects.toThrow("redirect:/bun-venit");
  });
});
