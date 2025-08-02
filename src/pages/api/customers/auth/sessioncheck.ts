import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import authMiddleware from "../../../../../lib/authMiddleware"; 

const sessionCheck = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
      success: false,
      message: "method_not_allowed",
    });
  }

  try {
    const user = await authMiddleware(req, res);
    
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        isAuthenticated: false,
        message: "invalid_or_expired_token",
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      isAuthenticated: false,
      message: "Server error",
    });
  }
};

export default sessionCheck;
