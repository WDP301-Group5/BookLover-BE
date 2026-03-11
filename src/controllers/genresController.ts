import { Request, Response } from "express";
import { Genre } from "../models/Genre"; // sửa từ Topic → Genre

export const getGenres = async (req: Request, res: Response) => {
  try {
    const genres = await Genre.find({ status: "active" }).lean();

    const genreData = genres.map((g) => ({
      _id: g._id.toString(),
      name: g.name,
      description: g.description || "",
      avatar: g.avatar || "",
    }));

    res.json({ genres: genreData });
  } catch (error) {
    console.error("Lỗi khi lấy genres:", error);
    res.status(500).json({ message: "Lỗi khi lấy genres" });
  }
};