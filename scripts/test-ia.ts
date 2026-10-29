import Anthropic from "@anthropic-ai/sdk";
import { createRequire } from "node:module";
import { readdir, readFile } from "node:fs/promises";
import { z } from "zod";
import { ExtraccionSchema } from "../lib/ia/schemas";
import { extractionPrompt } from "../lib/ia/prompts";
import { limpiarEntrada, normalizeExtraction } from "../lib/ia/normalizar";
const require = createRequire(import.meta.url);
createRequire(require.resolve("next/package.json"))("@next/env").loadEnvConfig(process.cwd());
async function main() {
  const client = new Anthropic({
    apiKey: process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY,
    maxRetries: 0,
    timeout: 45000,
  });
  const categories = [
    "NOTEBOOK",
    "MONITOR",
    "IMPRESORA",
    "TINTA",
    "ACCESORIO",
    "GAMER",
    "REPUESTO",
  ].map((nombre) => ({ id: nombre, nombre, plantillaTitulo: null }));
  const files = (await readdir("tests/fixtures/extraccion"))
    .filter((v) => v.endsWith(".json"))
    .sort();
  const limitIndex = process.argv.indexOf("--limit");
  const limit = limitIndex >= 0 ? Number(process.argv[limitIndex + 1]) : files.length;
  let invented = 0,
    correct = 0,
    empty = 0,
    wrong = 0;
  for (const file of files.slice(0, limit)) {
    const fixture = JSON.parse(await readFile(`tests/fixtures/extraccion/${file}`, "utf8"));
    const text = limpiarEntrada(
      await readFile(`tests/fixtures/extraccion/${file.replace(".json", ".txt")}`, "utf8"),
    );
    const started = Date.now();
    const response = await client.messages.create({
      model: process.env.AI_MODEL_EXTRACCION || "claude-haiku-5-5",
      max_tokens: 6000,
      messages: [
        {
          role: "user",
          content: extractionPrompt(
            text,
            categories.map((v) => v.nombre),
            ["HP", "Dell", "Lenovo", "Acer", "ASUS", "Epson", "Logitech", "Kingston"],
            [],
            "Detectar",
          ),
        },
      ],
      tools: [
        {
          name: "emitir_resultado",
          description: "Ficha extraída",
          input_schema: z.toJSONSchema(ExtraccionSchema) as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: "emitir_resultado" },
    });
    const tool = response.content.find((v) => v.type === "tool_use");
    if (tool?.type !== "tool_use") throw new Error("La respuesta no contiene la ficha");
    const raw = ExtraccionSchema.parse(tool.input);
    const result = normalizeExtraction(raw, categories, [], 6.96, true, text);
    let problems = 0;
    const fallos: unknown[] = [];
    for (const [key, value] of Object.entries(fixture.expected)) {
      const actual =
        key === "categoria"
          ? (result.producto.categoriaNombre ?? null)
          : (result.producto[key as keyof typeof result.producto] ?? null);
      if (value === null && actual !== null) {
        invented++;
        problems++;
        fallos.push({ campo: key, esperado: value, actual });
      } else if (actual === value) {
        correct++;
        if (value === null) empty++;
      } else {
        wrong++;
        problems++;
        fallos.push({ campo: key, esperado: value, actual });
      }
    }
    console.log(
      JSON.stringify({
        fixture: file,
        ms: Date.now() - started,
        camposParaRevisar: problems,
        fallos,
        tokensIn: response.usage.input_tokens,
        tokensOut: response.usage.output_tokens,
      }),
    );
  }
  console.log(
    JSON.stringify({
      aciertos: correct,
      vaciosCorrectos: empty,
      inventos: invented,
      errores: wrong,
    }),
  );
  if (invented || wrong) process.exitCode = 1;
}
main().catch(() => {
  console.error(
    "No se pudo completar test:ia. Revisa configuración del proveedor; no se muestran secretos.",
  );
  process.exitCode = 1;
});
