import bcrypt from "bcrypt";
export async function hashPassword(password: string) {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

export async function verifyPassword(password: any, hashed: any) {
  return await bcrypt.compare(password, hashed);
}
