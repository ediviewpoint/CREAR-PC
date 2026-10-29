export interface SincronizadorERP {
  obtenerStock(sku: string): Promise<number | null>;
  registrarVenta(sku: string, cantidad: number, sucursal: string): Promise<void>;
}
// DECISION: Gemgloo no publica aún un contrato de conexión; esta implementación no simula una sincronización.
export class GemglooPendiente implements SincronizadorERP {
  async obtenerStock(_sku: string) {
    return null;
  }
  async registrarVenta(_sku: string, _cantidad: number, _sucursal: string) {
    throw new Error("Conexión con Gemgloo pendiente de configuración");
  }
}
