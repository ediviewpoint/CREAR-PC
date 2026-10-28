import { afterEach, describe, expect, it, vi } from "vitest";
const context = vi.hoisted(() => ({ admin: true }));
vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: async () => {
    if (!context.admin) throw new Error("unauthorized");
  },
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { generateAiProducts, publicSource, sanitizeAiProducts } from "./ai-products";
import { suggestProductsAction, saveAiDraftsAction } from "@/app/_actions/ai-products";
const text =
  "AMD Ryzen 5 9600X: 6 cores, 12 threads, socket AM5. https://www.amd.com/products/9600x";
const source = "https://www.amd.com/products/9600x";
const proposal = {
  products: [
    {
      name: "AMD Ryzen 5 9600X",
      brand: "AMD",
      category: "cpu",
      source,
      fields: [
        { path: "cores", value: "6", evidence: "6 cores" },
        { path: "threads", value: "12", evidence: "12 threads" },
      ],
      notes: [],
    },
  ],
};
function response(input: unknown = proposal) {
  return Response.json({
    content: [{ type: "tool_use", name: "propose_products", input }],
    stop_reason: "tool_use",
  });
}
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  context.admin = true;
});
describe("Claude para productos", () => {
  it("solo acepta campos de la categoría, con evidencia y valores válidos", () => {
    const raw = structuredClone(proposal);
    raw.products[0]!.fields.push(
      { path: "priceAmount", value: "100", evidence: "6 cores" },
      { path: "__proto__.polluted", value: "true", evidence: "6 cores" },
      { path: "socket", value: "INVENTADO", evidence: "6 cores" },
      { path: "tdpWBase", value: "900", evidence: "dato que no existe" },
    );
    const [product] = sanitizeAiProducts(raw, text, new Set([source]), "cpu", 1);
    expect(product?.fields).toEqual({ cores: "6", threads: "12" });
    expect(product?.source).toBe(source);
    expect(product?.notes.join(" ")).toContain("4 datos");
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(() => sanitizeAiProducts(proposal, text, new Set(), "gpu", 1)).toThrow("categoría");
    expect(sanitizeAiProducts(proposal, text, new Set(), "auto", 1)[0]?.source).toBe("");
  });
  it("rechaza enlaces privados, credenciales y protocolos ejecutables", () => {
    for (const value of [
      "javascript:alert(1)",
      "http://localhost/test",
      "http://127.0.0.1/a",
      "http://10.0.0.1/a",
      "https://user:secret@www.amd.com/a",
    ])
      expect(publicSource(value)).toBe("");
    expect(publicSource(source)).toBe(source);
  });
  it("reconoce las claves del catálogo para tipos de unidad expresados por el fabricante", () => {
    const input = {
      products: [
        {
          name: "SSD de prueba",
          brand: "Marca",
          category: "storage",
          source,
          fields: [{ path: "storageType", value: "nvme_m2", evidence: "SSD NVMe PCIe 4.0 M.2" }],
          notes: [],
        },
      ],
    };
    expect(
      sanitizeAiProducts(input, "SSD NVMe PCIe 4.0 M.2", new Set([source]), "storage", 1)[0]?.fields
        .storageType,
    ).toBe("nvme_m2");
  });
  it("extrae en el servidor sin enviar la clave dentro de los mensajes", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-server-key-never-in-messages");
    const fetcher = vi.fn().mockResolvedValue(response());
    vi.stubGlobal("fetch", fetcher);
    const products = await generateAiProducts({ text, search: false, category: "auto", limit: 1 });
    expect(products[0]?.fields.cores).toBe("6");
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, request] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(request.headers["x-api-key"]).toBe("test-server-key-never-in-messages");
    expect(request.body).not.toContain("test-server-key-never-in-messages");
    expect(request.cache).toBe("no-store");
  });
  it("investiga fuentes y después valida la extracción sin visitar URLs desde el servidor", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          content: [
            {
              type: "web_search_tool_result",
              content: [{ type: "web_search_result", url: source }],
            },
            { type: "text", text, citations: [{ url: source }] },
          ],
          stop_reason: "end_turn",
        }),
      )
      .mockResolvedValueOnce(response());
    vi.stubGlobal("fetch", fetcher);
    const products = await generateAiProducts({
      text: "AMD Ryzen 5 9600X",
      search: true,
      category: "cpu",
      limit: 1,
    });
    expect(products[0]?.source).toBe(source);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetcher.mock.calls[0]![1].body).tools[0].max_uses).toBe(2);
    for (const call of fetcher.mock.calls)
      expect(call[0]).toBe("https://api.anthropic.com/v1/messages");
  });
  it("maneja clave ausente, rechazo del proveedor y respuestas incompletas sin filtrar secretos", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    await expect(
      generateAiProducts({ text, search: false, category: "cpu", limit: 1 }),
    ).rejects.toThrow("ANTHROPIC_API_KEY");
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("private-provider-details", { status: 401 })),
    );
    await expect(
      generateAiProducts({ text, search: false, category: "cpu", limit: 1 }),
    ).rejects.toThrow("rechazó");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ content: [], stop_reason: "max_tokens" })),
    );
    await expect(
      generateAiProducts({ text, search: false, category: "cpu", limit: 1 }),
    ).rejects.toThrow("menos productos");
  });
  it("exige sesión administrativa antes de generar o guardar", async () => {
    context.admin = false;
    await expect(suggestProductsAction({})).rejects.toThrow("unauthorized");
    await expect(saveAiDraftsAction([])).rejects.toThrow("unauthorized");
  });
  it("rechaza claves pegadas en el material y tandas excesivas antes de consultar", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(
      generateAiProducts({ text: "sk-ant-private-key", search: false, category: "auto", limit: 1 }),
    ).rejects.toThrow("clave API");
    await expect(
      generateAiProducts({ text, search: false, category: "auto", limit: 11 }),
    ).rejects.toThrow("10 productos");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
