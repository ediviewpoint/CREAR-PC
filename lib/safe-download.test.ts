import {it,expect} from "vitest";
import {isPublicAddress} from "./safe-download";
it("bloquea localhost, redes privadas e IPv6 mapeado",()=>{for(const address of ["127.0.0.1","10.0.0.1","192.168.1.1","169.254.169.254","172.16.1.1","100.64.0.1","::1","::ffff:127.0.0.1","fe80::1","fc00::1"])expect(isPublicAddress(address)).toBe(false);expect(isPublicAddress("1.1.1.1")).toBe(true);expect(isPublicAddress("2606:4700:4700::1111")).toBe(true);});
