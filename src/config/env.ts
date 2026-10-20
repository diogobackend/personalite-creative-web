const apiUrl = "http://localhost:8080"

if (!apiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL não configurada");
}

export const env = {
  apiUrl: apiUrl.replace(/\/+$/, ""),
};