import type { Request, Response } from "express";
import {
  ERR_BAD_REQUEST,
  ERR_INTERNAL_SERVER,
  ERR_RESOURCE_CONFLICT,
  ERR_UNAUTHORIZED,
  ERR_TOO_MANY_REQUESTS,
} from "../consts/errorCode.js";
import { SUCCESS_CREATED, SUCCESS_OK } from "../consts/successCode.js";
import {
  googleLogin,
  loginUser,
  registerUser,
  resendVerificationEmail,
  verifyEmail,
} from "../services/authService.js";
import {
  googleLoginSchema,
  loginSchema,
  registerSchema,
} from "../utils/validation.js";
// Using http-errors: controller will detect error.status

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await registerUser(validatedData);

    res.status(SUCCESS_CREATED).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    // If service threw an http-errors error it carries a `status` property
    const status = (error as any)?.status;
    if (typeof status === "number") {
      res.status(status).json({
        success: false,
        message: (error as any).message || "Error",
      });
      return;
    }

    if (error instanceof Error) {
      if (error.name === "ZodError") {
        res.status(ERR_BAD_REQUEST).json({
          success: false,
          message: "Invalid input",
          errors: error,
        });
        return;
      }

      // Backwards-compat: detect legacy messages in English or Vietnamese
      if (
        error.message &&
        (error.message.includes("already exists") ||
          error.message.includes("đã có sẵn"))
      ) {
        res.status(ERR_RESOURCE_CONFLICT).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(ERR_BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(ERR_INTERNAL_SERVER).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);

    // Perform login
    const result = await loginUser(validatedData);

    res.status(SUCCESS_OK).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      // Check if it's a validation error
      if (error.name === "ZodError") {
        res.status(ERR_BAD_REQUEST).json({
          success: false,
          message: "Invalid input",
          errors: error,
        });
        return;
      }

      // Handle authentication errors
      res.status(ERR_UNAUTHORIZED).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(ERR_INTERNAL_SERVER).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }
};

export const googleLoginController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Validate input
    const validatedData = googleLoginSchema.parse(req.body);

    // Perform Google login
    const result = await googleLogin(
      validatedData.token,
      validatedData.rememberMe || false,
    );

    res.status(SUCCESS_OK).json({
      success: true,
      message: "Google login successful",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      // Check if it's a validation error
      if (error.name === "ZodError") {
        res.status(ERR_BAD_REQUEST).json({
          success: false,
          message: "Invalid input",
          errors: error,
        });
        return;
      }

      // Handle authentication errors
      res.status(ERR_UNAUTHORIZED).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(ERR_INTERNAL_SERVER).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }
};

export const resendVerificationController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(ERR_BAD_REQUEST).json({
        success: false,
        message: "Email là bắt buộc.",
      });
      return;
    }

    const result = await resendVerificationEmail(email);

    res.status(SUCCESS_OK).json({
      success: true,
      message: result.message,
      nextResendIn: result.nextResendIn,
    });
  } catch (error) {
    // If service threw an http-errors error it carries a `status` property
    const status = (error as any)?.status;
    if (typeof status === "number" && status === ERR_TOO_MANY_REQUESTS) {
      res.status(ERR_TOO_MANY_REQUESTS).json({
        success: false,
        message: (error as any).message || "Too many requests",
      });
      return;
    }

    if (error instanceof Error) {
      res.status(ERR_BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(ERR_INTERNAL_SERVER).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }
};

export const verifyEmailController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(ERR_BAD_REQUEST).json({
        success: false,
        message: "Token xác thực không được cung cấp.",
      });
      return;
    }

    const result = await verifyEmail(token);

    res.status(SUCCESS_OK).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(ERR_BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(ERR_INTERNAL_SERVER).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }
};
