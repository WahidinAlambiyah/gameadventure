import { hash, verify } from "@node-rs/argon2";

const argonOptions = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1
};

export function assertFourDigitPin(pin: string) {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error("PIN must be exactly four digits.");
  }
}

export async function hashSecret(secret: string) {
  return hash(secret, argonOptions);
}

export async function verifySecret(hashValue: string, secret: string) {
  return verify(hashValue, secret);
}

export async function hashParentPin(pin: string) {
  assertFourDigitPin(pin);
  return hashSecret(pin);
}
