// check if the given string is a valid server URL
export function normalizeServerURL(url: string): string {
  url = url.trim();

  const m = /^(https?:\/\/)?([^/]+)\/?$/i.exec(url);

  if (m) return m[2];
  else throw new Error("Invalid server URL");
}
