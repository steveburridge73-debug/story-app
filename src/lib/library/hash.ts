const SALT = "tsc-v1:";

export const DEFAULT_PASSCODE_HASH =
  "d25a5269b03a7a909a3691d645ce2a4fd6381c6acebe800e03b4a277be3fb6e3";

export async function hashPasscode(code: string): Promise<string> {
  const data = new TextEncoder().encode(`${SALT}${code}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
