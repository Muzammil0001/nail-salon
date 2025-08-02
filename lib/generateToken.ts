import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const generateToken = (customer: any) => {
  return jwt.sign(
    {
      id: customer.id,
      email: customer.email,
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
};