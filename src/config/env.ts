const apiUrl = "https://personalite-creative.onrender.com"

if (!apiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL não configurada");
}

export const env = {
  apiUrl: apiUrl.replace(/\/+$/, ""),
};