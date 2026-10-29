-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('CARRITO', 'IMAGEN');

-- CreateEnum
CREATE TYPE "Disponibilidad" AS ENUM ('EN_STOCK', 'SIN_STOCK', 'BAJO_PEDIDO');

-- CreateEnum
CREATE TYPE "Condicion" AS ENUM ('NUEVO', 'REACONDICIONADO', 'OPEN_BOX', 'USADO');

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('BOB', 'USD');

-- CreateEnum
CREATE TYPE "OrigenDato" AS ENUM ('MANUAL', 'TEXTO', 'BUSQUEDA_MODELO', 'IA_GENERADO', 'IMPORTACION', 'BASE_INTERNA');

-- CreateEnum
CREATE TYPE "Confianza" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'EDITOR', 'VENDEDOR', 'LECTOR');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleSub" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'LECTOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" TIMESTAMP(3),
    "ultimoAcceso" TIMESTAMP(3),
    "versionSesion" INTEGER NOT NULL DEFAULT 0,
    "preferencias" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tituloManual" BOOLEAN NOT NULL DEFAULT false,
    "marcaId" TEXT,
    "modelo" TEXT,
    "partNumber" TEXT,
    "categoriaId" TEXT NOT NULL,
    "subcategoriaId" TEXT,
    "tipo" "TipoProducto" NOT NULL DEFAULT 'CARRITO',
    "condicion" "Condicion" NOT NULL DEFAULT 'NUEVO',
    "color" TEXT,
    "garantia" TEXT,
    "proveedorId" TEXT,
    "descripcion" TEXT,
    "precioSinFactura" INTEGER,
    "precioConFactura" INTEGER,
    "precioOferta" INTEGER,
    "ofertaDesde" TIMESTAMP(3),
    "ofertaHasta" TIMESTAMP(3),
    "etiquetaDescuento" TEXT,
    "precioUsd" INTEGER,
    "costo" INTEGER,
    "monedaCosto" "Moneda",
    "precioMayorista" INTEGER,
    "tipoCambioUsado" DECIMAL(8,4),
    "disponibilidad" "Disponibilidad" NOT NULL DEFAULT 'EN_STOCK',
    "controlaInventario" BOOLEAN NOT NULL DEFAULT false,
    "umbralStockBajo" INTEGER,
    "escondido" BOOLEAN NOT NULL DEFAULT false,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "orden" TEXT NOT NULL,
    "requiereRevision" BOOLEAN NOT NULL DEFAULT false,
    "estado" TEXT NOT NULL DEFAULT 'publicado',
    "wpId" INTEGER,
    "wpSyncEstado" TEXT,
    "wpSyncFecha" TIMESTAMP(3),
    "wpSyncError" TEXT,
    "textoFuente" TEXT,
    "legacyComponentId" UUID,
    "datosCompatibilidad" JSONB,
    "stockAutomatico" BOOLEAN NOT NULL DEFAULT false,
    "creadoPorId" TEXT NOT NULL,
    "actualizadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoSpec" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "icono" TEXT,
    "orden" INTEGER NOT NULL,
    "origen" "OrigenDato" NOT NULL DEFAULT 'MANUAL',
    "confianza" "Confianza",
    "fuenteUrl" TEXT,
    "confirmado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProductoSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoImagen" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "urlMiniatura" TEXT NOT NULL,
    "alt" TEXT,
    "orden" INTEGER NOT NULL,
    "ancho" INTEGER,
    "alto" INTEGER,

    CONSTRAINT "ProductoImagen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoDestacado" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "icono" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "origen" "OrigenDato" NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "ProductoDestacado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoPuntoClave" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "enPdf" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL,
    "origen" "OrigenDato" NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "ProductoPuntoClave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sucursal" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockSucursal" (
    "productoId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StockSucursal_pkey" PRIMARY KEY ("productoId","sucursalId")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "padreId" TEXT,
    "plantillaTitulo" TEXT,
    "specsSugeridas" JSONB NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marca" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Etiqueta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Etiqueta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoEtiqueta" (
    "productoId" TEXT NOT NULL,
    "etiquetaId" TEXT NOT NULL,

    CONSTRAINT "ProductoEtiqueta_pkey" PRIMARY KEY ("productoId","etiquetaId")
);

-- CreateTable
CREATE TABLE "GrupoOpciones" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "obligatorio" BOOLEAN NOT NULL DEFAULT false,
    "multiple" BOOLEAN NOT NULL DEFAULT false,
    "opciones" JSONB NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "GrupoOpciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoHistorial" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "cambios" JSONB NOT NULL,
    "origen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductoHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alias" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "normalizado" TEXT NOT NULL,

    CONSTRAINT "Alias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CacheSpecs" (
    "clave" TEXT NOT NULL,
    "respuesta" JSONB NOT NULL,
    "fuentes" JSONB NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CacheSpecs_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "UsoIA" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "funcion" TEXT NOT NULL,
    "tokensIn" INTEGER NOT NULL,
    "tokensOut" INTEGER NOT NULL,
    "costoUsd" DECIMAL(10,5) NOT NULL,
    "ms" INTEGER NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsoIA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrabajoBatch" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipoEntrada" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "procesados" INTEGER NOT NULL,
    "items" JSONB NOT NULL,
    "opciones" JSONB NOT NULL,
    "costoUsd" DECIMAL(10,5) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrabajoBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "clave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "ip" TEXT,
    "detalle" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "codigo" TEXT,
    "cliente" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'abierta',
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_googleSub_key" ON "Usuario"("googleSub");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_sku_key" ON "Producto"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_slug_key" ON "Producto"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_legacyComponentId_key" ON "Producto"("legacyComponentId");

-- CreateIndex
CREATE INDEX "Producto_categoriaId_orden_idx" ON "Producto"("categoriaId", "orden");

-- CreateIndex
CREATE INDEX "Producto_modelo_idx" ON "Producto"("modelo");

-- CreateIndex
CREATE INDEX "Producto_partNumber_idx" ON "Producto"("partNumber");

-- CreateIndex
CREATE INDEX "Producto_disponibilidad_idx" ON "Producto"("disponibilidad");

-- CreateIndex
CREATE INDEX "Producto_deletedAt_estado_createdAt_idx" ON "Producto"("deletedAt", "estado", "createdAt");

-- CreateIndex
CREATE INDEX "Producto_marcaId_idx" ON "Producto"("marcaId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoSpec_productoId_campo_key" ON "ProductoSpec"("productoId", "campo");

-- CreateIndex
CREATE INDEX "ProductoImagen_productoId_orden_idx" ON "ProductoImagen"("productoId", "orden");

-- CreateIndex
CREATE INDEX "ProductoDestacado_productoId_orden_idx" ON "ProductoDestacado"("productoId", "orden");

-- CreateIndex
CREATE INDEX "ProductoPuntoClave_productoId_orden_idx" ON "ProductoPuntoClave"("productoId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "Sucursal_nombre_key" ON "Sucursal"("nombre");

-- CreateIndex
CREATE INDEX "StockSucursal_sucursalId_idx" ON "StockSucursal"("sucursalId");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_slug_key" ON "Categoria"("slug");

-- CreateIndex
CREATE INDEX "Categoria_padreId_orden_idx" ON "Categoria"("padreId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "Marca_nombre_key" ON "Marca"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Etiqueta_nombre_key" ON "Etiqueta"("nombre");

-- CreateIndex
CREATE INDEX "ProductoEtiqueta_etiquetaId_idx" ON "ProductoEtiqueta"("etiquetaId");

-- CreateIndex
CREATE INDEX "GrupoOpciones_productoId_orden_idx" ON "GrupoOpciones"("productoId", "orden");

-- CreateIndex
CREATE INDEX "ProductoHistorial_productoId_createdAt_idx" ON "ProductoHistorial"("productoId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductoHistorial_usuarioId_createdAt_idx" ON "ProductoHistorial"("usuarioId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Alias_tipo_valor_key" ON "Alias"("tipo", "valor");

-- CreateIndex
CREATE INDEX "UsoIA_usuarioId_createdAt_idx" ON "UsoIA"("usuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "UsoIA_funcion_createdAt_idx" ON "UsoIA"("funcion", "createdAt");

-- CreateIndex
CREATE INDEX "TrabajoBatch_usuarioId_createdAt_idx" ON "TrabajoBatch"("usuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "Auditoria_usuarioId_createdAt_idx" ON "Auditoria"("usuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "Auditoria_accion_createdAt_idx" ON "Auditoria"("accion", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_codigo_key" ON "Cotizacion"("codigo");

-- CreateIndex
CREATE INDEX "Cotizacion_usuarioId_estado_idx" ON "Cotizacion"("usuarioId", "estado");

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Marca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_subcategoriaId_fkey" FOREIGN KEY ("subcategoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoSpec" ADD CONSTRAINT "ProductoSpec_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoImagen" ADD CONSTRAINT "ProductoImagen_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoDestacado" ADD CONSTRAINT "ProductoDestacado_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoPuntoClave" ADD CONSTRAINT "ProductoPuntoClave_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockSucursal" ADD CONSTRAINT "StockSucursal_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockSucursal" ADD CONSTRAINT "StockSucursal_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_padreId_fkey" FOREIGN KEY ("padreId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoEtiqueta" ADD CONSTRAINT "ProductoEtiqueta_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoEtiqueta" ADD CONSTRAINT "ProductoEtiqueta_etiquetaId_fkey" FOREIGN KEY ("etiquetaId") REFERENCES "Etiqueta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoOpciones" ADD CONSTRAINT "GrupoOpciones_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoHistorial" ADD CONSTRAINT "ProductoHistorial_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoHistorial" ADD CONSTRAINT "ProductoHistorial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsoIA" ADD CONSTRAINT "UsoIA_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrabajoBatch" ADD CONSTRAINT "TrabajoBatch_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ElitePC: RLS; el acceso se realiza a través de las rutas autenticadas.
ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Producto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductoSpec" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductoImagen" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductoDestacado" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductoPuntoClave" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sucursal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockSucursal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Categoria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Marca" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Etiqueta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductoEtiqueta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GrupoOpciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductoHistorial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Alias" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CacheSpecs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UsoIA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrabajoBatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Configuracion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Auditoria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cotizacion" ENABLE ROW LEVEL SECURITY;
