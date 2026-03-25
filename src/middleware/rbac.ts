import type { NextFunction, Request, Response } from "express";
import { ERR_FORBIDDEN } from "../consts/errorCode.js";
import { verifyToken } from "./auth.js";

export type UserRole = "admin" | "author" | "user";

/**
 * Middleware to require specific role(s)
 * @param allowedRoles - roles that are allowed to access
 */
export const requireRole = (allowedRoles: UserRole | UserRole[]) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		verifyToken(req, res, () => {
			const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

			if (!req.user?.role || !roles.includes(req.user.role as UserRole)) {
				res.status(ERR_FORBIDDEN).json({
					success: false,
					message: `Access denied. Required role(s): ${roles.join(", ")}`,
				});
				return;
			}

			next();
		});
	};
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	requireRole("admin")(req, res, next);
};

/**
 * Middleware to require author role
 */
export const requireAuthor = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	requireRole("author")(req, res, next);
};

/**
 * Middleware to require authenticated user (any logged-in user)
 */
export const requireAuth = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	verifyToken(req, res, next);
};

/**
 * Middleware to require admin or author role
 */
export const requireAdminOrAuthor = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	requireRole(["admin", "author"])(req, res, next);
};

/**
 * Middleware to allow access only to own resources or admin
 * @param resourceOwnerId - the ID of resource owner (extract from request)
 */
export const requireOwnerOrAdmin = (
	getOwnerId: (req: Request) => string | undefined,
) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		verifyToken(req, res, () => {
			const ownerId = getOwnerId(req);
			const userId = req.user?.userId;
			const isAdmin = req.user?.role === "admin";

			if (!ownerId) {
				res.status(ERR_FORBIDDEN).json({
					success: false,
					message: "Resource owner not found",
				});
				return;
			}

			if (userId === ownerId || isAdmin) {
				next();
				return;
			}

			res.status(ERR_FORBIDDEN).json({
				success: false,
				message: "You don't have permission to access this resource",
			});
		});
	};
};
