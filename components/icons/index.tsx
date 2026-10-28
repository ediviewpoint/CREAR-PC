import type { SVGProps } from "react";
export type HardwareKind = "cpu" | "gpu" | "mobo" | "ram" | "psu" | "case" | "cooler" | "storage";
const paths: Record<HardwareKind, string> = {
  cpu: "M7 7h10v10H7z M9 9h6v6H9z M9 3v4m6-4v4M9 17v4m6-4v4M3 9h4m-4 6h4m10-6h4m-4 6h4",
  gpu: "M3 7h17v10H3z M3 17v3m4-3v2m3-2v2m3-2v2m3-2v2M20 9h2v9 M8 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M16 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  mobo: "M4 3h16v18H4z M7 6h6v6H7z M16 5v9m2-9v9M7 16h9m-9 3h9M7 12v2h5",
  ram: "M3 7h18v10H3z M6 10h3v4H6zm5 0h3v4h-3zm5 0h3v4h-3z M5 17v3m3-3v3m3-3v3m3-3v3m3-3v3m3-3v3",
  psu: "M4 5h15v14H4z M8 9h7v6H8z M19 8h2v8h-2M6 5V3m11 2V3M4 19v2m15-2v2M8 12h7m-3.5-3v6",
  case: "M6 3h12v18H6z M6 7h12M14 5h2M9 10h6v7H9z M9 21v1m6-1v1",
  cooler:
    "M4 4h16v16H4z M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12 M12 10v4m-2-2h4M7 4V2m10 2V2M7 20v2m10-2v2",
  storage: "M4 7h16v10H4z M7 10h3v4H7zm6 0h4v4h-4z M3 9h1m-1 3h1m-1 3h1M20 9h1m-1 3h1m-1 3h1",
};
export function HardwareIcon({ kind, ...props }: SVGProps<SVGSVGElement> & { kind: HardwareKind }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[kind]} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
export { CpuIcon } from "./CpuIcon";
export { GpuIcon } from "./GpuIcon";
export { MoboIcon } from "./MoboIcon";
export { RamIcon } from "./RamIcon";
export { PsuIcon } from "./PsuIcon";
export { CaseIcon } from "./CaseIcon";
export { CoolerIcon } from "./CoolerIcon";
export { StorageIcon } from "./StorageIcon";
