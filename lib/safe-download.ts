import "server-only";
import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { ApiError } from "./api-errors";
const blocked = new BlockList();
for (const [ip, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
  ["192.0.0.0", 24],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  blocked.addSubnet(ip, prefix, "ipv4");
export function isPublicAddress(address: string) {
  return isIP(address) === 4
    ? !blocked.check(address, "ipv4")
    : isIP(address) === 6 && /^2[0-9a-f]{3}:/i.test(address) && !/^2001:db8:/i.test(address);
}
export async function safeDownload(
  input: string,
  maxBytes = 5 * 1024 * 1024,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    allowError?: boolean;
  } = {},
): Promise<{ bytes: Buffer; type: string; url: string; status: number }> {
  const deadline = Date.now() + 10000;
  for (let redirects = 0; redirects <= 3; redirects++) {
    let url: URL;
    try {
      url = new URL(input);
    } catch {
      throw new ApiError("URL_NO_ACCESIBLE", "URL inválida", 422);
    }
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      (url.port && !["80", "443"].includes(url.port)) ||
      /^(localhost|.*\.localhost|.*\.local)$/i.test(url.hostname)
    )
      throw new ApiError("URL_NO_ACCESIBLE", "Esta dirección no está permitida", 422);
    const addresses = await lookup(url.hostname.replace(/^\[|\]$/g, ""), {
      all: true,
      verbatim: true,
    });
    if (!addresses.length || addresses.some((v) => !isPublicAddress(v.address)))
      throw new ApiError("URL_NO_ACCESIBLE", "Esta dirección no está permitida", 422);
    const chosen = addresses[0]!;
    const pinned: LookupFunction = (_host, _options, callback) =>
      callback(null, chosen.address, chosen.family);
    const response = await new Promise<{
      bytes: Buffer;
      type: string;
      location?: string;
      status: number;
    }>((resolve, reject) => {
      const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(
        url,
        {
          lookup: pinned,
          method: options.method || "GET",
          headers: {
            "User-Agent": "ElitePC/1.0",
            "Accept-Encoding": "identity",
            ...options.headers,
          },
          timeout: Math.max(1, deadline - Date.now()),
        },
        (res) => {
          const location = res.headers.location;
          if (location && [301, 302, 303, 307, 308].includes(res.statusCode || 0)) {
            res.resume();
            resolve({ bytes: Buffer.alloc(0), type: "", location, status: res.statusCode! });
            return;
          }
          let count = 0;
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => {
            count += chunk.length;
            if (count > maxBytes) {
              request.destroy(new Error("size"));
              return;
            }
            chunks.push(chunk);
          });
          res.on("end", () =>
            resolve({
              bytes: Buffer.concat(chunks),
              type: String(res.headers["content-type"] || ""),
              status: res.statusCode || 500,
            }),
          );
          res.on("error", reject);
        },
      );
      request.on("timeout", () => request.destroy(new Error("timeout")));
      const timer = setTimeout(
        () => request.destroy(new Error("timeout")),
        Math.max(1, deadline - Date.now()),
      );
      request.on("close", () => clearTimeout(timer));
      request.on("error", reject);
      request.end(options.body);
    }).catch(() => {
      throw new ApiError(
        "URL_NO_ACCESIBLE",
        "No pudimos abrir esa página. Pega el texto directamente",
        422,
      );
    });
    if (response.location) {
      if (
        (options.method && options.method !== "GET") ||
        Object.keys(options.headers || {}).some((k) => k.toLowerCase() === "authorization")
      )
        throw new ApiError(
          "URL_NO_ACCESIBLE",
          "Usa la dirección final del sitio, sin redirecciones",
          422,
        );
      input = new URL(response.location, url).toString();
      continue;
    }
    if (!options.allowError && (response.status < 200 || response.status >= 300))
      throw new ApiError(
        "URL_NO_ACCESIBLE",
        "No pudimos abrir esa página. Pega el texto directamente",
        422,
      );
    return {
      bytes: response.bytes,
      type: response.type,
      url: url.toString(),
      status: response.status,
    };
  }
  throw new ApiError("URL_NO_ACCESIBLE", "La dirección tiene demasiadas redirecciones", 422);
}
