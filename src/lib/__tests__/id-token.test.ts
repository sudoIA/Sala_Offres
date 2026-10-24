import { describe, expect, it } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { verifyFirebaseIdToken } from "@/lib/id-token";

const PROJECT = "sala-a6c15";

async function setup() {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256" };
  const keys = createLocalJWKSet({ keys: [jwk] });
  const sign = (claims: Record<string, unknown>, opts: { iss?: string; aud?: string; exp?: string; sub?: string } = {}) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setIssuer(opts.iss ?? `https://securetoken.google.com/${PROJECT}`)
      .setAudience(opts.aud ?? PROJECT)
      .setSubject(opts.sub ?? "uid123")
      .setIssuedAt()
      .setExpirationTime(opts.exp ?? "1h")
      .sign(privateKey);
  return { keys, sign };
}

describe("verifyFirebaseIdToken", () => {
  it("accepte un jeton valide", async () => {
    const { keys, sign } = await setup();
    const token = await sign({ email: "a@sala.cg", email_verified: true });
    await expect(verifyFirebaseIdToken(token, PROJECT, keys)).resolves.toEqual({ uid: "uid123", email: "a@sala.cg", emailVerified: true });
  });

  it("refuse un jeton d'un autre projet", async () => {
    const { keys, sign } = await setup();
    await expect(verifyFirebaseIdToken(await sign({}, { aud: "autre-projet" }), PROJECT, keys)).rejects.toThrow();
    await expect(verifyFirebaseIdToken(await sign({}, { iss: "https://securetoken.google.com/autre" }), PROJECT, keys)).rejects.toThrow();
  });

  it("refuse un jeton expiré ou falsifié", async () => {
    const { keys, sign } = await setup();
    await expect(verifyFirebaseIdToken(await sign({}, { exp: "-1m" }), PROJECT, keys)).rejects.toThrow();
    const token = await sign({});
    const forged = token.slice(0, -4) + (token.endsWith("AAAA") ? "BBBB" : "AAAA");
    await expect(verifyFirebaseIdToken(forged, PROJECT, keys)).rejects.toThrow();
    const other = await setup();
    await expect(verifyFirebaseIdToken(await other.sign({}), PROJECT, keys)).rejects.toThrow();
  });
});
