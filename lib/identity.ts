import { sha256 } from "@/lib/crypto";
import { store } from "@/lib/store";
import type { HumanCredential } from "@/lib/types";

export interface HumanCredentialProvider {
  createCredential(userId: string): HumanCredential;
  generateProof(credential: HumanCredential, domain: string): { proof: string; nullifier: string; createdAt: string };
  verifyProof(proof: string, credential: HumanCredential, domain: string): boolean;
  generateDomainNullifier(credential: HumanCredential, domain: string): string;
}

/** DEMO IMPLEMENTATION. Production: replace with audited anonymous credentials / ZK proof system. */
export class DemoHumanCredentialProvider implements HumanCredentialProvider {
  createCredential(userId: string): HumanCredential { return store.createCredential(userId); }
  generateDomainNullifier(credential: HumanCredential, domain: string): string { return sha256(`Humanshield-domain-v1:${credential.commitment}:${domain}`).slice(0, 32); }
  generateProof(credential: HumanCredential, domain: string): { proof: string; nullifier: string; createdAt: string } { const nullifier = this.generateDomainNullifier(credential, domain); const createdAt = new Date().toISOString(); return { proof: sha256(`DEMO_PROOF:${credential.commitment}:${nullifier}:${createdAt.slice(0, 10)}`), nullifier, createdAt }; }
  verifyProof(proof: string, credential: HumanCredential, domain: string): boolean { return proof.length === 64 && credential.status === "VERIFIED" && this.generateDomainNullifier(credential, domain).length === 32; }
}
export const humanCredentialProvider = new DemoHumanCredentialProvider();
