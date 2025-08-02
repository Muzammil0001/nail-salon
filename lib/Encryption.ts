const Cryptr = require("cryptr");
const cryptr = new Cryptr("jkltwjrois8uf0938890w3213890Zsd#@90923234");
const encrypt = async (password: string) => {
  const encrypted = await cryptr.encrypt(password);
  return encrypted;
};
const decrypt = async (password: string) => {
  const decrypted = await cryptr.decrypt(password);
  return decrypted;
};
export { encrypt, decrypt };
