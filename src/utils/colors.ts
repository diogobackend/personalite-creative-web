const colorMap: Record<string, string> = {
  // Vermelhos
  vermelho: "#DC2626",
  vermelha: "#DC2626",
  "vermelho escuro": "#991B1B",
  "vermelho cereja": "#D2042D",
  "vermelho alaranjado": "#EA3C12",
  "vermelho terracota": "#B84A35",
  "vermelho metalico": "#B91C1C",
  "vermelho vinho (bordo)": "#7F1D1D",
  "ermelho vinho (bordo)": "#7F1D1D",
  "vinho (bordo)": "#722F37",
  vinho: "#722F37",
  bordo: "#800020",
  marsala: "#955251",
  cereja: "#D2042D",
  rubi: "#E0115F",

  // Azuis
  azul: "#2563EB",
  "azul claro": "#93C5FD",
  "azul-claro": "#93C5FD",
  "azul escuro": "#1E3A8A",
  "azul royal": "#2446B3",
  "azul royal metalico": "#1746A2",
  "azul turquesa": "#20C9CE",
  "azul-turquesa": "#20C9CE",
  "azul-marinho": "#1E2A55",
  "azul-marinho acinzentado": "#363A60",
  marinho: "#1E2A55",
  indigo: "#4F46E5",
  anil: "#4B0082",
  ciano: "#06B6D4",

  // Verdes
  verde: "#22A447",
  "verde claro": "#86CFA0",
  "verde escuro": "#166534",
  "verde bandeira": "#229447",
  "verde floresta": "#174B35",
  "verde oliva": "#808000",
  "verde-limao metalico": "#78A82F",
  "verde-petroleo escuro": "#004D46",
  oliva: "#808000",
  esmeralda: "#10B981",
  jade: "#00A86B",
  menta: "#98FF98",
  musgo: "#556B2F",
  petroleo: "#006D77",

  // Amarelos e dourados
  amarelo: "#EAB308",
  amarela: "#EAB308",
  "amarelo ouro": "#F2C21B",
  "amarelo pastel": "#FFDB70",
  dourado: "#D4AF37",
  dourada: "#D4AF37",
  "dourado metalico": "#C99A19",
  mostarda: "#C68B2B",

  // Laranjas
  laranja: "#F97316",
  "laranja vibrante": "#F45100",
  "laranja pessego": "#FF985B",
  coral: "#FF7F50",
  salmao: "#FA8072",
  pessego: "#FFDAB9",
  terracota: "#C66B4E",

  // Rosas
  rosa: "#EC4899",
  roso: "#EC4899",
  "rosa claro": "#F9A8D4",
  "rosa coral": "#F08080",
  "rosa malva": "#C45D9F",
  "rosa pastel": "#F6A5B5",
  "rosa pink": "#EC3984",
  pink: "#EC3984",
  fucsia: "#FF00FF",
  magenta: "#D946EF",

  // Roxos
  roxo: "#9333EA",
  roxa: "#9333EA",
  "roxo escuro": "#3B0764",
  "roxo metalico": "#853D9C",
  "lilas pastel": "#C7A3D9",
  lilas: "#C084FC",
  violeta: "#8B5CF6",
  lavanda: "#B497D6",

  // Pretos e cinzas
  preto: "#111111",
  preta: "#111111",
  "preto metalico": "#242424",
  cinza: "#9CA3AF",
  "cinza medio": "#9CA3AF",
  "cinza escuro": "#52525B",
  "cinza grafite": "#3F4145",
  "cinza chumbo": "#555B63",
  "cinza quente": "#B2AFA3",
  "cinza quente (greige)": "#B2AFA3",
  grafite: "#374151",
  chumbo: "#555B63",
  escuro: "#3F3F46",

  // Brancos e claros
  branco: "#FFFFFF",
  branca: "#FFFFFF",
  "branco perolado": "#F3EAE6",
  "off white": "#F5F2E9",
  creme: "#FFFDD0",
  perola: "#F0EAD6",
  gelo: "#E8F4F8",
  transparente: "#FFFFFF",

  // Beges e marrons
  bege: "#D6C3A5",
  "bege acinzentado": "#A3947D",
  "bege champanhe": "#E8D0B4",
  "bege claro (marfim)": "#F2E6D8",
  "bege rosado": "#CDAE9D",
  areia: "#E6D3B3",
  nude: "#D8A48F",
  marrom: "#92400E",
  "marrom acinzentado": "#65534F",
  "marrom acinzentado (taupe)": "#65534F",
  "marrom cafe": "#5B3B30",
  "marrom caramelo": "#A65F1A",
  "marrom chocolate": "#633719",
  caramelo: "#C68E17",
  chocolate: "#7B3F00",
  caqui: "#C3B091",

  // Metálicos e materiais
  prata: "#C0C0C0",
  prateado: "#C0C0C0",
  prateada: "#C0C0C0",
  "prata metalico": "#A8ADB4",
  "aco inox": "#A9B0B5",
  cobre: "#B87333",
  bronze: "#CD7F32",

  // Cores especiais
  tiffany: "#0ABAB5",
};

export function getColor(value: string): string | undefined {
  const normalized = value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

  return colorMap[normalized];
}