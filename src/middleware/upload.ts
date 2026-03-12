import type { NextFunction, Request, Response } from "express";
import {
  upload,
  uploadHTMLToCloudinary,
  uploadImage,
} from "../config/cloudinary.js";
import {
  ERR_BAD_REQUEST,
  ERR_SERVICE_UNAVAILABLE,
} from "../consts/errorCode.js";
import multer from "multer";
import path from "node:path";
import { convertFileToHtml } from "../utils/convertFileToHTML.js";

// Middleware upload một file ảnh
export const uploadStoryImage = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  uploadImage.single("image")(req, res, (err) => {
    if (err) {
      console.error("Upload lỗi:", err);
      return res
        .status(ERR_SERVICE_UNAVAILABLE)
        .json({ error: "Lỗi upload ảnh ", errorDetail: err?.message });
    }

    if (!req.file) {
      // Allow draft stories without cover image
      return next();
    }
    req.body.image = req.file.path;

    // Nếu upload thành công => gọi next()
    next();
  });
};

export const uploadAvatarURL = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  uploadImage.single("avatarURL")(req, res, (err) => {
    if (err) {
      console.error("Upload lỗi:", err);
      return res
        .status(ERR_SERVICE_UNAVAILABLE)
        .json({ error: "Lỗi upload ảnh ", errorDetail: err?.message });
    }

    if (
      typeof req.body.avatarURL === "string" &&
      req.body.avatarURL.trim() !== "" &&
      !req.file
    ) {
      return next();
    }

    if (!req.file) {
      return res
        .status(ERR_BAD_REQUEST)
        .json({ error: "Chưa có ảnh được gửi lên" });
    }

    req.body.avatarURL = req.file.path;

    // Nếu upload thành công => gọi next()
    next();
  });
};

export const uploadBackgroundURL = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  uploadImage.single("backgroundURL")(req, res, (err) => {
    if (err) {
      console.error("Upload lỗi:", err);
      return res
        .status(ERR_SERVICE_UNAVAILABLE)
        .json({ error: "Lỗi upload ảnh ", errorDetail: err?.message });
    }

    if (
      typeof req.body.backgroundURL === "string" &&
      req.body.backgroundURL.trim() !== "" &&
      !req.file
    ) {
      return next();
    }

    if (!req.file) {
      return res
        .status(ERR_BAD_REQUEST)
        .json({ error: "Chưa có ảnh được gửi lên" });
    }

    req.body.backgroundURL = req.file.path;

    // Nếu upload thông => gọi next()
    next();
  });
};

// export const uploadAvatarAndBackground = (
// 	req: Request,
// 	res: Response,
// 	next: NextFunction,
// ) => {
// 	// Cho phép upload 2 trường ảnh: 'avatarURL' và 'backgroundURL'
// 	if (req.body.avatarURL && req.body.backgroundURL) {
// 		uploadImage.fields([
// 			{ name: "avatarURL", maxCount: 1 },
// 			{ name: "backgroundURL", maxCount: 1 },
// 		])(req, res, (err) => {
// 			if (err) {
// 				console.error("Upload lỗi:", err);
// 				return res
// 					.status(ERR_SERVICE_UNAVAILABLE)
// 					.json({ error: "Lỗi upload ảnh", errorDetail: err.message });
// 			}

// 			// Nếu ảnh mới được upload, gán đường dẫn vào req.body
// 			const files = req.files as {
// 				[fieldname: string]: Express.Multer.File[];
// 			};

// 			if (files?.avatar?.[0]) {
// 				req.body.avatar = files.avatar[0].path;
// 			} else if (
// 				typeof req.body.avatar === "string" &&
// 				req.body.avatar.trim() !== ""
// 			) {
// 				// Giữ ảnh cũ
// 				console.log("Giữ nguyên avatar:", req.body.avatar);
// 			} else {
// 				req.body.avatar = null; // hoặc bỏ qua nếu cần
// 			}

// 			if (files?.backgroundImage?.[0]) {
// 				req.body.backgroundImage = files.backgroundImage[0].path;
// 			} else if (
// 				typeof req.body.backgroundImage === "string" &&
// 				req.body.backgroundImage.trim() !== ""
// 			) {
// 				// Giữ ảnh cũ
// 				console.log("Giữ nguyên background:", req.body.backgroundImage);
// 			} else {
// 				req.body.backgroundImage = null;
// 			}

// 			// Tiếp tục xử lý
// 			next();
// 		});
// 	} else {
// 		// Nếu không có cả 2 trường, bỏ qua middleware này
// 		next();
// 	}
// };

export const uploadAvatarAndBackground = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  uploadImage.fields([
    { name: "avatarURL", maxCount: 1 },
    { name: "backgroundURL", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      console.error("Upload lỗi:", err);
      return res.status(ERR_SERVICE_UNAVAILABLE).json({
        error: "Lỗi upload ảnh",
        errorDetail: err.message,
      });
    }

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    if (files?.avatarURL?.[0]) {
      req.body.avatarURL = files.avatarURL[0].path;
    }

    if (files?.backgroundURL?.[0]) {
      req.body.backgroundURL = files.backgroundURL[0].path;
    }

    next();
  });
};

export const uploadTextFile = [
  upload.single("file"),

  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("=== CHAPTER UPLOAD START ===");

      if (!req.file) {
        return res.status(400).json({
          error: "Chưa có file được gửi lên",
        });
      }

      console.log("File received:", req.file.originalname);

      // convert file -> HTML
      const html = await convertFileToHtml(
        req.file.buffer,
        req.file.originalname,
      );

      console.log("Convert to HTML success");

      // upload HTML lên Cloudinary
      const result = await uploadHTMLToCloudinary(html, req.file.originalname);

      console.log("Uploaded to Cloudinary:", result.secure_url);

      // gắn URL vào req.file
      req.body.file = result.secure_url;
      // (req.file as any).path = result.secure_url;
      // (req.file as any).filename = result.public_id;

      // optional
      req.body.contentURL = result.secure_url;

      next();
    } catch (error) {
      console.error("Upload chapter error:", error);

      return res.status(500).json({
        error: "Lỗi xử lý file",
      });
    }
  },
];

// Middleware upload nhiều file text cho batch chapters
export const uploadMultipleTextFiles = [
  upload.array("files", 50), // Max 50 files per request

  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("=== BATCH CHAPTERS UPLOAD START ===");

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(ERR_BAD_REQUEST).json({
          error: "Chưa có file được gửi lên",
        });
      }

      console.log(`Files received: ${req.files.length}`);

      // Convert files to URLs and store in req.body
      const uploadedFiles: Array<{
        originalName: string;
        contentURL: string;
      }> = [];

      for (const file of req.files as Express.Multer.File[]) {
        try {
          console.log(
            `Processing file: ${file.originalname} (${file.size} bytes)`,
          );

          // Convert file to HTML
          const html = await convertFileToHtml(file.buffer, file.originalname);

          // Upload HTML to Cloudinary
          const result = await uploadHTMLToCloudinary(html, file.originalname);

          uploadedFiles.push({
            originalName: file.originalname,
            contentURL: result.secure_url,
          });

          console.log(
            `File uploaded: ${file.originalname} -> ${result.secure_url}`,
          );
        } catch (fileError: unknown) {
          const errorMessage =
            fileError instanceof Error
              ? fileError.message
              : fileError instanceof Object
                ? JSON.stringify(fileError)
                : String(fileError);

          console.error(
            `Error uploading file ${file.originalname}:`,
            errorMessage,
          );

          throw new Error(
            `Lỗi upload file ${file.originalname}: ${errorMessage}`,
          );
        }
      }

      // Attach uploaded files info to req.body
      req.body.uploadedFiles = uploadedFiles;

      console.log("All files uploaded successfully");
      next();
    } catch (error) {
      console.error("Batch upload chapter error:", error);

      return res.status(ERR_SERVICE_UNAVAILABLE).json({
        error: "Lỗi xử lý file",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
];

export const uploadGenreAvatar = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  uploadImage.single("avatar")(req, res, (err) => {
    if (err) {
      console.error("Upload lỗi:", err);
      return res
        .status(ERR_SERVICE_UNAVAILABLE)
        .json({ error: "Lỗi upload ảnh", errorDetail: err?.message });
    }

    if (
      typeof req.body.avatar === "string" &&
      req.body.avatar.trim() !== "" &&
      !req.file
    ) {
      return next();
    }

    if (!req.file) {
      return next();
    }

    req.body.avatar = req.file.path;

    // Nếu upload thành công => gọi next()
    next();
  });
};
