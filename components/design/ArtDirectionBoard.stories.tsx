import { ArtDirectionBoard } from "./ArtDirectionBoard";

const meta = {
  title: "CREAR PC/Fundación/Dirección de arte",
  component: ArtDirectionBoard,
  parameters: { layout: "fullscreen" },
};

export const Light = { args: { theme: "light" } };
export const Dark = { args: { theme: "dark" } };
export const System = {};
export const Mobile320 = {
  args: { theme: "light" },
  // Fixed width works without a viewport addon.
  render: () => (
    <div style={{ width: 320 }}>
      <ArtDirectionBoard theme="light" />
    </div>
  ),
};
export const Mobile320Dark = {
  args: { theme: "dark" },
  render: () => (
    <div style={{ width: 320 }}>
      <ArtDirectionBoard theme="dark" />
    </div>
  ),
};
export default meta;
