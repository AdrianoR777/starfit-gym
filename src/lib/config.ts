// Datos oficiales de STARFIT GYM. Fuente: perfil público de Instagram @sstarfitgym (extraído vía Apify, 25-oct-2026).
export type Sede = { id: string; name: string; address: string; phone: string; mapsQuery: string };

export const sedes: Sede[] = [
  { id: "pardo", name: "Sede Pardo", address: "Cruce de Ppao, Nuevo Chimbote", phone: "993538789", mapsQuery: "STARFIT GYM Pardo Nuevo Chimbote" },
  { id: "agraria", name: "Sede Agraria", address: "Av. Naciones Unidas con Av. Agraria, Nuevo Chimbote", phone: "920373854", mapsQuery: "Av. Naciones Unidas y Agraria, Nuevo Chimbote" },
];

export const gym = {
  name: process.env.NEXT_PUBLIC_GYM_NAME ?? "STARFIT GYM",
  title: "STARFIT GYM | Gimnasio en Nuevo Chimbote",
  tagline: "Porque estar fit no es solo verse bien, sino sentirse bien",
  logo: process.env.NEXT_PUBLIC_LOGO_URL ?? null, // o coloca el archivo en public/brand/logo.png
  address: sedes.map((s) => `${s.name}: ${s.address}`).join(" · "),
  hours: "Lunes a sábado* · 6:00 a. m. – 10:30 p. m.",
  hoursNote: "*Horario extendido anunciado el 21-mar-2026. Confirma domingos y feriados por WhatsApp.",
  bio: null as string | null,
  instagram: "https://www.instagram.com/sstarfitgym/",
  tiktok: "https://www.tiktok.com/@sstarfitgym",
  facebook: "https://www.facebook.com/sstarfit/",
  signup: "https://bit.ly/inscripstarfit",
  city: "Nuevo Chimbote, Áncash",
  timezone: "America/Lima",
  currency: "PEN",
};

export const wa = (phone: string, text = "Hola STARFIT, quiero información sobre membresías") =>
  `https://wa.me/51${phone}?text=${encodeURIComponent(text)}`;

export const groupClasses = [
  ["Baile", "Para disfrutar cada paso."],
  ["Funcional", "Resultados reales en menos tiempo."],
  ["Xbox", "Pura adrenalina."],
  ["Zumba", "Para llenarte de energía."],
  ["Step", "Para activar todo tu cuerpo."],
] as const;

// Publicaciones reales (permalinks oficiales) para el visor de Instagram
export const igPosts = {
  clases: ["DWKb7w7ge5S", "DWKgTb7Ae7q"],
  kids: ["DVm0bXUEfrX", "DVmyOTbEa_R"],
  eventos: ["DbTqkQpFkRM", "DVm4RGeFgvz", "DVmeq1ngV1c"],
  home: ["DbTrUI0I79A", "DWKb7w7ge5S", "DbTqkQpFkRM"],
};

export const integrations = {
  supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  culqi: Boolean(process.env.CULQI_SECRET_KEY && process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY),
  resend: Boolean(process.env.RESEND_API_KEY),
  whatsapp: Boolean(process.env.WHATSAPP_TOKEN),
  qr: Boolean(process.env.QR_SIGNING_SECRET),
};

export const formatPEN = (cents: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(cents / 100);
