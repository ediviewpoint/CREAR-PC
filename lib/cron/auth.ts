import "server-only";
import {timingSafeEqual} from "node:crypto";
export function cronAuthorized(request:Request){const expected=process.env.CRON_SECRET,provided=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");return Boolean(expected&&provided&&Buffer.byteLength(expected)===Buffer.byteLength(provided)&&timingSafeEqual(Buffer.from(expected),Buffer.from(provided)));}
