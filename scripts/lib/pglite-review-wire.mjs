// Single-process local test bridge. Not an application server or production database.
import net from "node:net";
const message = (tag, body) => {
  const header = Buffer.alloc(5);
  header[0] = tag.charCodeAt(0);
  header.writeInt32BE(body.length + 4, 1);
  return Buffer.concat([header, body]);
};
const status = (name, value) => message("S", Buffer.from(`${name}\0${value}\0`));
export function createReviewDatabaseServer(pg, port = 55432) {
  const jobs = [];
  let busy = false,
    lease = null;
  async function pump() {
    if (busy) return;
    const index = jobs.findIndex((job) => !lease || job.socket === lease);
    if (index < 0) return;
    const job = jobs.splice(index, 1)[0];
    busy = true;
    // Extended queries may flush before ReadyForQuery. Keep their unnamed
    // portal on the same connection until Sync completes the exchange.
    lease ??= job.socket;
    try {
      const response = Buffer.from(await pg.execProtocolRaw(job.data));
      let offset = 0;
      while (offset + 5 <= response.length) {
        const tag = String.fromCharCode(response[offset]),
          length = response.readInt32BE(offset + 1);
        if (tag === "Z") lease = response[offset + 5] === 73 ? null : job.socket;
        offset += length + 1;
      }
      if (!job.socket.destroyed) job.socket.write(response);
    } catch (error) {
      job.socket.destroy(error);
      lease = null;
    } finally {
      busy = false;
      void pump();
    }
  }
  const server = net.createServer((socket) => {
    let buffer = Buffer.alloc(0),
      started = false,
      batch = [];
    socket.on("error", () => {});
    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      for (;;) {
        if (!started) {
          if (buffer.length < 8) return;
          const size = buffer.readInt32BE(0);
          if (size < 8 || size > 10000) {
            socket.destroy();
            return;
          }
          if (buffer.length < size) return;
          const code = buffer.readInt32BE(4);
          buffer = buffer.subarray(size);
          if (code === 80877103) {
            socket.write("N");
            continue;
          }
          if (code !== 196608) {
            socket.destroy();
            return;
          }
          started = true;
          const auth = Buffer.alloc(4),
            backend = Buffer.alloc(8);
          backend.writeInt32BE(1, 0);
          socket.write(
            Buffer.concat([
              message("R", auth),
              status("server_version", "17.4"),
              status("client_encoding", "UTF8"),
              status("server_encoding", "UTF8"),
              status("DateStyle", "ISO, MDY"),
              status("TimeZone", "UTC"),
              status("standard_conforming_strings", "on"),
              message("K", backend),
              message("Z", Buffer.from("I")),
            ]),
          );
          continue;
        }
        if (buffer.length < 5) return;
        const size = buffer.readInt32BE(1) + 1;
        if (size < 5 || size > 8 * 1024 * 1024) {
          socket.destroy();
          return;
        }
        if (buffer.length < size) return;
        const packet = buffer.subarray(0, size);
        buffer = buffer.subarray(size);
        if (packet[0] === 88) {
          socket.end();
          return;
        }
        batch.push(packet);
        if (packet[0] === 81 || packet[0] === 83 || packet[0] === 72) {
          jobs.push({ socket, data: Buffer.concat(batch) });
          batch = [];
          void pump();
        }
      }
    });
    socket.on("close", () => {
      for (let i = jobs.length - 1; i >= 0; i--) if (jobs[i].socket === socket) jobs.splice(i, 1);
      if (lease === socket) {
        lease = null;
        void pump();
      }
    });
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}
