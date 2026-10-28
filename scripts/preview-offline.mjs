// Local visual review using the reference catalog; does not modify .env.local.
process.env.DATABASE_URL = "";
const command = process.argv[2] ?? "dev";
if (!["dev", "build", "start"].includes(command)) throw new Error("Use dev, build or start.");
process.argv = [
  process.argv[0],
  "next",
  command,
  ...(command === "build" ? [] : ["--port", "3003", "--hostname", "127.0.0.1"]),
];
await import("next/dist/bin/next");
