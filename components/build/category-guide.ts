import type { HardwareKind } from "@/components/icons";

export const CATEGORY_GUIDE: Record<HardwareKind, { purpose: string; check: string }> = {
  cpu: {
    purpose: "El punto de partida de tu equipo.",
    check: "El socket del procesador debe coincidir con el de la placa madre.",
  },
  mobo: {
    purpose: "La conexión entre todas tus piezas.",
    check: "Revisá socket, tipo de memoria y formato del chasis.",
  },
  ram: {
    purpose: "Espacio para trabajar con varias tareas a la vez.",
    check: "DDR4 y DDR5 no son intercambiables. La cantidad corresponde a kits completos.",
  },
  gpu: {
    purpose: "Potencia para gráficos, video y trabajo visual.",
    check: "Revisá el espacio del chasis y la potencia que necesita la tarjeta.",
  },
  storage: {
    purpose: "Tu sistema, proyectos y archivos.",
    check: "Comprobá la interfaz del disco y los conectores disponibles en la placa.",
  },
  psu: {
    purpose: "Energía para todo lo que elegiste.",
    check: "El resumen estima el consumo y añade un 30% de margen para elegir la fuente.",
  },
  case: {
    purpose: "El lugar de cada componente.",
    check: "El formato de placa, el largo de la gráfica y la altura del cooler deben entrar.",
  },
  cooler: {
    purpose: "Temperatura bajo control.",
    check: "Revisá el montaje para tu socket y la altura disponible en el chasis.",
  },
};
