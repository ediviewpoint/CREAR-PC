/** Brands confirmed by ELITEPC. This is presentation data, not stock or a partner certification. */
export type WorkedBrand = {
  id: string;
  name: string;
  category: string;
  logo?: string;
  source?: string;
};
export const workedBrands: readonly WorkedBrand[] = [
  {
    id: "amd-ryzen",
    name: "AMD Ryzen",
    category: "Procesadores",
    logo: "/brands/amd-ryzen.svg",
    source: "https://commons.wikimedia.org/wiki/File:AMD_Ryzen_logo.svg",
  },
  {
    id: "intel",
    name: "Intel",
    category: "Procesadores / plataforma Intel",
    logo: "/brands/intel.svg",
    source: "https://www.intel.com/content/www/us/en/newsroom/press-hub.html",
  },
  {
    id: "asus",
    name: "ASUS",
    category: "Placas madre",
    logo: "/brands/asus.svg",
    source: "https://www.asus.com/",
  },
  {
    id: "gigabyte",
    name: "GIGABYTE",
    category: "Placas madre",
    logo: "/brands/gigabyte.svg",
    source: "https://www.gigabyte.com/",
  },
  {
    id: "asrock",
    name: "ASRock",
    category: "Placas madre",
    logo: "/brands/asrock.svg",
    source: "https://commons.wikimedia.org/wiki/File:ASRock_Logo.svg",
  },
  {
    id: "macrovip",
    name: "MacroVIP",
    category: "Placas madre",
    logo: "/brands/macrovip.png",
    source: "https://macrovip.com/es/",
  },
  {
    id: "goline",
    name: "Goline",
    category: "Placas madre",
    logo: "/brands/goline.svg",
    source: "https://www.chipbyte.com.br/intel/placa-mae-goline-intel-lga-1155-gl-b75-ma/2122",
  },
  {
    id: "toshiba",
    name: "Toshiba",
    category: "Almacenamiento",
    source: "https://www.global.toshiba/",
  },
  {
    id: "seagate",
    name: "Seagate",
    category: "Almacenamiento",
    source: "https://www.seagate.com/",
  },
  {
    id: "western-digital",
    name: "Western Digital",
    category: "Almacenamiento",
    source: "https://www.westerndigital.com/",
  },
  {
    id: "hitachi",
    name: "Hitachi",
    category: "Almacenamiento",
    source: "https://www.hitachi.com/",
  },
  {
    id: "kingston",
    name: "Kingston",
    category: "Memoria / Almacenamiento",
    source: "https://www.kingston.com/",
  },
  {
    id: "crucial",
    name: "Crucial",
    category: "Memoria / Almacenamiento",
    source: "https://www.crucial.com/",
  },
  {
    id: "msi",
    name: "MSI",
    category: "Placas madre / Tarjetas gráficas",
    source: "https://www.msi.com/",
  },
  {
    id: "hikvision",
    name: "Hikvision",
    category: "Consultar modelos",
    source: "https://www.hikvision.com/",
  },
  {
    id: "teamgroup",
    name: "TEAMGROUP",
    category: "Memoria / Almacenamiento",
    source: "https://www.teamgroupinc.com/",
  },
  {
    id: "apacer",
    name: "Apacer",
    category: "Memoria / Almacenamiento",
    source: "https://www.apacer.com/",
  },
  { id: "puskill", name: "PUSKILL", category: "Consultar modelos" },
  { id: "diamond", name: "Diamond", category: "Consultar modelos" },
];
