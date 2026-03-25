import dotenv from "dotenv";
import mongoose from "mongoose";
import { Chapter } from "../models/Chapter.js";
import { Comment } from "../models/Comment.js";
import { Report } from "../models/Report.js";
import { ReportLog } from "../models/ReportLog.js";
import { Story } from "../models/Story.js";
import { User } from "../models/User.js";

dotenv.config();

// Try multiple possible MongoDB URIs
const MONGODB_URIS = [
	process.env.MONGO_URI,
	process.env.MONGO_URI_LOCAL,
	process.env.MONGODB_URI,
	"mongodb://localhost:27017/book-lover",
	"mongodb://127.0.0.1:27017/book-lover",
].filter(Boolean);

/**
 * Seed data cho phần quản lý báo cáo vi phạm
 * Bao gồm: users, stories, chapters, comments, reports, reportLogs
 */
async function seedReports() {
	let connected = false;
	let usedUri = "";

	// Try to connect to each URI
	for (const uri of MONGODB_URIS) {
		if (!uri) continue;
		try {
			console.log(
				`🔄 Trying to connect to: ${uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")}`,
			);
			await mongoose.connect(uri);
			connected = true;
			usedUri = uri;
			console.log(
				`✅ Connected to MongoDB: ${uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")}`,
			);
			break;
		} catch (error) {
			console.log(
				`❌ Failed to connect to: ${uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")}`,
			);
		}
	}

	if (!connected) {
		console.error("❌ Could not connect to any MongoDB instance!");
		console.error(
			"Please make sure MongoDB is running or update the connection string in .env",
		);
		process.exit(1);
	}

	try {
		// ===== 1. TẠO TOPICS & GENRES (nếu chưa có) =====
		const existingTopics = await mongoose.connection.db
			.Gcollection("topics")
			.find({})
			.toArray();
		let topics: any[] = [];
		if (existingTopics.length === 0) {
			topics = await mongoose.connection.db.collection("topics").insertMany([
				{ name: "Học đường", slug: "hoc-duong" },
				{ name: "Ngôn tình", slug: "ngon-tinh" },
				{ name: "Điền văn", slug: "dien-van" },
			]);
			console.log("✅ Created topics");
		} else {
			topics = existingTopics.map((t: any) => ({ _id: t._id, ...t }));
			console.log(`✅ Using existing topics (${topics.length})`);
		}

		const existingGenres = await mongoose.connection.db
			.collection("genres")
			.find({})
			.toArray();
		let genres: any[] = [];
		if (existingGenres.length === 0) {
			genres = await mongoose.connection.db.collection("genres").insertMany([
				{ name: "Romance", slug: "romance" },
				{ name: "Drama", slug: "drama" },
				{ name: "Comedy", slug: "comedy" },
				{ name: "Fantasy", slug: "fantasy" },
			]);
			console.log("✅ Created genres");
		} else {
			genres = existingGenres.map((g: any) => ({ _id: g._id, ...g }));
			console.log(`✅ Using existing genres (${genres.length})`);
		}

		// ===== 2. TẠO USERS =====
		const existingAdmins = await User.find({
			username: { $in: ["admin1", "admin2"] },
		}).exec();
		let users: any[] = [];

		if (existingAdmins.length === 0) {
			users = await User.insertMany([
				// Admin users
				{
					username: "admin1",
					fullName: "Admin Chính",
					email: "admin1@booklover.com",
					role: "admin",
					status: "active",
					avatarURL: "https://i.pravatar.cc/150?img=1",
				},
				{
					username: "admin2",
					fullName: "Admin Phụ",
					email: "admin2@booklover.com",
					role: "admin",
					status: "active",
					avatarURL: "https://i.pravatar.cc/150?img=2",
				},
				// Regular users (reporters)
				{
					username: "user1",
					fullName: "Nguyễn Văn A",
					email: "user1@booklover.com",
					role: "user",
					status: "active",
					avatarURL: "https://i.pravatar.cc/150?img=3",
				},
				{
					username: "user2",
					fullName: "Trần Thị B",
					email: "user2@booklover.com",
					role: "user",
					status: "active",
					avatarURL: "https://i.pravatar.cc/150?img=4",
				},
				{
					username: "user3",
					fullName: "Lê Văn C",
					email: "user3@booklover.com",
					role: "user",
					status: "active",
					avatarURL: "https://i.pravatar.cc/150?img=5",
				},
				// Users who will be reported (violators)
				{
					username: "baduser1",
					fullName: "Phạm Văn D",
					email: "baduser1@booklover.com",
					role: "user",
					status: "active",
					avatarURL: "https://i.pravatar.cc/150?img=6",
				},
				{
					username: "baduser2",
					fullName: "Đỗ Thị E",
					email: "baduser2@booklover.com",
					role: "user",
					status: "active",
					avatarURL: "https://i.pravatar.cc/150?img=7",
				},
				// Authors
				{
					username: "author1",
					fullName: "Tác Giả 1",
					email: "author1@booklover.com",
					role: "author",
					status: "active",
					avatarURL: "https://i.pravatar.cc/150?img=8",
				},
				{
					username: "author2",
					fullName: "Tác Giả 2",
					email: "author2@booklover.com",
					role: "author",
					status: "active",
					avatarURL: "https://i.pravatar.cc/150?img=9",
				},
			]);
			console.log("✅ Created users");
		} else {
			users = existingAdmins;
			console.log(`✅ Using existing admin users (${users.length})`);

			// Create other users if they don't exist
			const existingUsernames = users.map((u) => u.username);
			const usersToCreate = [
				{
					username: "user1",
					fullName: "Nguyễn Văn A",
					email: "user1@booklover.com",
					role: "user" as const,
					status: "active" as const,
					avatarURL: "https://i.pravatar.cc/150?img=3",
				},
				{
					username: "user2",
					fullName: "Trần Thị B",
					email: "user2@booklover.com",
					role: "user" as const,
					status: "active" as const,
					avatarURL: "https://i.pravatar.cc/150?img=4",
				},
				{
					username: "user3",
					fullName: "Lê Văn C",
					email: "user3@booklover.com",
					role: "user" as const,
					status: "active" as const,
					avatarURL: "https://i.pravatar.cc/150?img=5",
				},
				{
					username: "baduser1",
					fullName: "Phạm Văn D",
					email: "baduser1@booklover.com",
					role: "user" as const,
					status: "active" as const,
					avatarURL: "https://i.pravatar.cc/150?img=6",
				},
				{
					username: "baduser2",
					fullName: "Đỗ Thị E",
					email: "baduser2@booklover.com",
					role: "user" as const,
					status: "active" as const,
					avatarURL: "https://i.pravatar.cc/150?img=7",
				},
				{
					username: "author1",
					fullName: "Tác Giả 1",
					email: "author1@booklover.com",
					role: "author" as const,
					status: "active" as const,
					avatarURL: "https://i.pravatar.cc/150?img=8",
				},
				{
					username: "author2",
					fullName: "Tác Giả 2",
					email: "author2@booklover.com",
					role: "author" as const,
					status: "active" as const,
					avatarURL: "https://i.pravatar.cc/150?img=9",
				},
			].filter((u) => !existingUsernames.includes(u.username));

			if (usersToCreate.length > 0) {
				const newUsers = await User.insertMany(usersToCreate);
				users = [...users, ...newUsers];
				console.log(`✅ Created ${newUsers.length} additional users`);
			}
		}

		const admin1 = users.find((u) => u.username === "admin1")!;
		const admin2 = users.find((u) => u.username === "admin2")!;
		const user1 = users.find((u) => u.username === "user1")!;
		const user2 = users.find((u) => u.username === "user2")!;
		const user3 = users.find((u) => u.username === "user3")!;
		const baduser1 = users.find((u) => u.username === "baduser1")!;
		const baduser2 = users.find((u) => u.username === "baduser2")!;
		const author1 = users.find((u) => u.username === "author1")!;
		const author2 = users.find((u) => u.username === "author2")!;

		// ===== 3. TẠO STORIES =====
		const existingStories = await Story.find({
			title: { $in: ["Truyện Vi Phạm Nội Dung", "Truyện Spam Quảng Cáo"] },
		}).exec();
		let stories: any[] = [];

		if (existingStories.length === 0) {
			stories = await Story.insertMany([
				// Story bị report vi phạm
				{
					title: "Truyện Vi Phạm Nội Dung",
					slug: "truyen-vi-pham-noi-dung",
					image: "https://via.placeholder.com/300x450?text=Violated+Story",
					description: "Truyện này có nội dung vi phạm chính sách cộng đồng",
					authorId: baduser1._id,
					topics: [topics[0]._id],
					genres: [genres[0]._id],
					tags: ["ngôn tình", "vi phạm"],
					status: "active",
					views: 1000,
				},
				{
					title: "Truyện Spam Quảng Cáo",
					slug: "truyen-spam-quang-cao",
					image: "https://via.placeholder.com/300x450?text=Spam+Story",
					description: "Truyện này chứa nội dung spam, quảng cáo",
					authorId: baduser2._id,
					topics: [topics[1]._id],
					genres: [genres[1]._id],
					tags: ["spam", "quảng cáo"],
					status: "active",
					views: 500,
				},
				// Normal stories
				{
					title: "Cô Nàng Ngổ Ngáo",
					slug: "co-nang-ngo-ngao",
					image: "https://via.placeholder.com/300x450?text=Normal+Story+1",
					description: "Câu chuyện tình yêu học đường ngọt ngào",
					authorId: author1._id,
					topics: [topics[0]._id],
					genres: [genres[0]._id, genres[2]._id],
					tags: ["học đường", "ngôn tình", "ngọt ngào"],
					status: "active",
					views: 5000,
				},
				{
					title: "Tổng Tài Bá Đạo",
					slug: "tong-tai-ba-dao",
					image: "https://via.placeholder.com/300x450?text=Normal+Story+2",
					description: "Câu chuyện về tổng tài và cô thư ký",
					authorId: author2._id,
					topics: [topics[1]._id],
					genres: [genres[0]._id, genres[1]._id],
					tags: ["tổng tài", "ngôn tình", "drama"],
					status: "active",
					views: 8000,
				},
			]);
			console.log("✅ Created stories");
		} else {
			stories = existingStories;
			console.log(`✅ Using existing violated stories (${stories.length})`);
		}

		const violatedStory = stories[0];
		const spamStory = stories[1];
		const normalStory1 =
			stories[2] || (await Story.findOne({ title: "Cô Nàng Ngổ Ngáo" }));
		const normalStory2 =
			stories[3] || (await Story.findOne({ title: "Tổng Tài Bá Đạo" }));

		// ===== 4. TẠO CHAPTERS =====
		const existingChapters = await Chapter.find({
			title: {
				$in: ["Chương 1: Mở đầu vi phạm", "Chương 2: Nội dung nhạy cảm"],
			},
		}).exec();
		let chapters: any[] = [];

		if (existingChapters.length === 0 && violatedStory && spamStory) {
			chapters = await Chapter.insertMany([
				// Chapters cho story vi phạm
				{
					storyId: violatedStory._id,
					chapterNumber: 1,
					title: "Chương 1: Mở đầu vi phạm",
					contentURL: "/content/violated-story/chapter-1",
					status: "active",
				},
				{
					storyId: violatedStory._id,
					chapterNumber: 2,
					title: "Chương 2: Nội dung nhạy cảm",
					contentURL: "/content/violated-story/chapter-2",
					status: "active",
				},
				// Chapters cho story spam
				{
					storyId: spamStory._id,
					chapterNumber: 1,
					title: "Chương 1: Quảng cáo trá hình",
					contentURL: "/content/spam-story/chapter-1",
					status: "active",
				},
			]);
			console.log("✅ Created chapters for violated stories");
		}

		// Create chapters for normal stories if needed
		const normalChapters = await Chapter.find({
			title: {
				$in: ["Chương 1: Gặp gỡ định mệnh", "Chương 1: Hợp đồng hôn nhân"],
			},
		}).exec();

		if (normalChapters.length === 0 && normalStory1 && normalStory2) {
			const newChapters = await Chapter.insertMany([
				{
					storyId: normalStory1._id,
					chapterNumber: 1,
					title: "Chương 1: Gặp gỡ định mệnh",
					contentURL: "/content/normal-story1/chapter-1",
					status: "active",
				},
				{
					storyId: normalStory1._id,
					chapterNumber: 2,
					title: "Chương 2: Hiểu lầm tai hại",
					contentURL: "/content/normal-story1/chapter-2",
					status: "active",
				},
				{
					storyId: normalStory2._id,
					chapterNumber: 1,
					title: "Chương 1: Hợp đồng hôn nhân",
					contentURL: "/content/normal-story2/chapter-1",
					status: "active",
				},
			]);
			chapters = [...chapters, ...newChapters];
			console.log("✅ Created chapters for normal stories");
		} else {
			chapters = [...chapters, ...normalChapters];
		}

		console.log(`✅ Total chapters: ${chapters.length}`);

		const violatedChapter1 = chapters.find(
			(c) => c.title === "Chương 1: Mở đầu vi phạm",
		);
		const violatedChapter2 = chapters.find(
			(c) => c.title === "Chương 2: Nội dung nhạy cảm",
		);
		const spamChapter = chapters.find(
			(c) => c.title === "Chương 1: Quảng cáo trá hình",
		);
		const normalChapter1 = chapters.find(
			(c) => c.title === "Chương 1: Gặp gỡ định mệnh",
		);
		const normalChapter2 = chapters.find(
			(c) => c.title === "Chương 2: Hiểu lầm tai hại",
		);
		const normalChapter3 = chapters.find(
			(c) => c.title === "Chương 1: Hợp đồng hôn nhân",
		);

		// ===== 5. TẠO COMMENTS =====
		const existingComments = await Comment.find({
			content: { $regex: "MUA ACC GAME" },
		}).exec();
		let comments: any[] = [];

		if (
			existingComments.length === 0 &&
			normalChapter1 &&
			normalChapter2 &&
			normalChapter3
		) {
			comments = await Comment.insertMany([
				// Comment vi phạm (spam)
				{
					userId: baduser1._id,
					chapterId: normalChapter1._id,
					content: "🔥🔥🔥 MUA ACC GAME GIÁ RẺ 0988.xxx.xxx 🔥🔥🔥",
					status: "active",
				},
				// Comment vi phạm (thô tục)
				{
					userId: baduser2._id,
					chapterId: normalChapter2._id,
					content: "Truyện gì mà dở tệ, tác giả ngu vcl",
					status: "active",
				},
				// Comment vi phạm (spoiler)
				{
					userId: user3._id,
					chapterId: normalChapter3._id,
					content: "Spoiler: Nhân vật chính sẽ chết ở chương 50 nhé mọi người",
					status: "active",
				},
				// Normal comments
				{
					userId: user1._id,
					chapterId: normalChapter1._id,
					content: "Truyện hay quá, mong tác giả ra chương mới sớm!",
					status: "active",
				},
				{
					userId: user2._id,
					chapterId: normalChapter2._id,
					content: "Cảm ơn tác giả nhiều, chương này rất cảm động 😭",
					status: "active",
				},
			]);
			console.log("✅ Created comments");
		} else {
			comments = existingComments;
			console.log(`✅ Using existing comments (${comments.length})`);
		}

		const spamComment = comments.find((c) =>
			c.content.includes("MUA ACC GAME"),
		);
		const rudeComment = comments.find((c) => c.content.includes("ngu vcl"));
		const spoilerComment = comments.find((c) => c.content.includes("Spoiler"));
		const normalComment1 = comments.find((c) => c.content.includes("hay quá"));
		const normalComment2 = comments.find((c) => c.content.includes("cảm động"));

		// ===== 6. TẠO REPORTS =====
		const existingReports = await Report.find({}).exec();
		if (existingReports.length === 0 && violatedStory && spamStory) {
			const now = new Date();
			const reports = await Report.insertMany([
				// Report 1: Story vi phạm nội dung (pending)
				{
					userId: user1._id,
					type: "Story",
					reportId: violatedStory._id,
					content:
						"Truyện này có nội dung vi phạm chính sách cộng đồng, mô tả cảnh nhạy cảm quá chi tiết",
					status: "pending",
					createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2),
				},
				// Report 2: Story spam (pending)
				{
					userId: user2._id,
					type: "Story",
					reportId: spamStory._id,
					content:
						"Truyện này chứa nội dung spam, quảng cáo link cá cược trong từng chương",
					status: "pending",
					createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 5),
				},
				// Report 3: Chapter vi phạm (pending)
				{
					userId: user3._id,
					type: "Chapter",
					reportId: violatedChapter2?._id,
					content:
						"Chương này có nội dung 18+ quá đà, vi phạm tiêu chuẩn cộng đồng",
					status: "pending",
					createdAt: new Date(now.getTime() - 1000 * 60 * 30),
				},
				// Report 4: Comment spam (pending)
				{
					userId: user1._id,
					type: "Comment",
					reportId: spamComment?._id,
					content: "Comment này spam quảng cáo, làm phiền người đọc",
					status: "pending",
					createdAt: new Date(now.getTime() - 1000 * 60 * 15),
				},
				// Report 5: Comment thô tục (pending)
				{
					userId: user2._id,
					type: "Comment",
					reportId: rudeComment?._id,
					content: "Comment này sử dụng ngôn từ thô tục, xúc phạm tác giả",
					status: "pending",
					createdAt: new Date(now.getTime() - 1000 * 60 * 45),
				},
				// Report 6: Comment spoiler (pending)
				{
					userId: user3._id,
					type: "Comment",
					reportId: spoilerComment?._id,
					content:
						"Comment này spoiler nội dung truyện, làm mất trải nghiệm của người đọc",
					status: "pending",
					createdAt: new Date(now.getTime() - 1000 * 60 * 10),
				},
				// Report 7: Story đã được dismiss (failed)
				{
					userId: user1._id,
					type: "Story",
					reportId: normalStory1?._id,
					content: "Truyện này đạo văn, tôi đã đọc ở web khác rồi",
					status: "failed",
					resolvedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
					resolvedBy: admin1._id,
					createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 48),
				},
				// Report 8: Comment đã được acknowledge (success)
				{
					userId: user2._id,
					type: "Comment",
					reportId: normalComment1?._id,
					content: "Comment này không phù hợp",
					status: "success",
					resolvedAt: new Date(now.getTime() - 1000 * 60 * 60 * 12),
					resolvedBy: admin2._id,
					createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 36),
				},
				// Report 9: Chapter đã bị ban (success)
				{
					userId: user3._id,
					type: "Chapter",
					reportId: spamChapter?._id,
					content: "Chương này chứa link cá cược, cờ bạc",
					status: "success",
					resolvedAt: new Date(now.getTime() - 1000 * 60 * 60 * 3),
					resolvedBy: admin1._id,
					createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 8),
				},
				// Report 10: Story duplicate (pending)
				{
					userId: user1._id,
					type: "Story",
					reportId: normalStory2?._id,
					content:
						"Truyện này trùng lặp với truyện 'Tổng Tài Lạnh Lùng' đã có trên hệ thống",
					status: "pending",
					createdAt: new Date(now.getTime() - 1000 * 60 * 5),
				},
			]);

			console.log("✅ Created reports");

			// ===== 7. TẠO REPORT LOGS =====
			const reportLogs = await ReportLog.insertMany([
				// Log cho report 7 (dismissed)
				{
					reportId: reports[6]._id,
					adminId: admin1._id,
					action: "dismiss",
					note: "Không tìm thấy bằng chứng đạo văn, truyện là nguyên gốc",
					createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
				},
				// Log cho report 8 (acknowledged)
				{
					reportId: reports[7]._id,
					adminId: admin2._id,
					action: "acknowledge",
					note: "Đã xem xét, comment không vi phạm",
					createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 12),
				},
				// Log cho report 9 (acknowledged + deleted chapter)
				{
					reportId: reports[8]._id,
					adminId: admin1._id,
					action: "acknowledge",
					note: "Xác nhận chương vi phạm, đã xóa chương và cảnh cáo tác giả",
					createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 3),
				},
				{
					reportId: reports[8]._id,
					adminId: admin1._id,
					action: "delete_chapter",
					note: "Xóa chương vì chứa link cá cược",
					createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 3),
				},
			]);

			console.log("✅ Created report logs");

			// ===== SUMMARY =====
			console.log("\n" + "=".repeat(50));
			console.log("📊 SEED DATA SUMMARY");
			console.log("=".repeat(50));
			console.log(
				`👤 Users: ${users.length} (2 admins, 3 regular users, 2 bad users, 2 authors)`,
			);
			console.log(`📚 Stories: ${stories.length} (2 violated, 2 normal)`);
			console.log(`📖 Chapters: ${chapters.length}`);
			console.log(`💬 Comments: ${comments.length} (3 violated, 2 normal)`);
			console.log(`🚩 Reports: ${reports.length}`);
			console.log(
				`   - Pending: ${reports.filter((r) => r.status === "pending").length}`,
			);
			console.log(
				`   - Success: ${reports.filter((r) => r.status === "success").length}`,
			);
			console.log(
				`   - Failed: ${reports.filter((r) => r.status === "failed").length}`,
			);
			console.log(`📝 Report Logs: ${reportLogs.length}`);
			console.log("=".repeat(50));
			console.log("✅ Seed data created successfully!");
			console.log("=".repeat(50));
		} else {
			console.log(`✅ Using existing reports (${existingReports.length})`);
			console.log("=".repeat(50));
			console.log("ℹ️  Seed data already exists. Skipping creation.");
			console.log(
				"💡 To reset, delete existing reports first or run with --force flag",
			);
			console.log("=".repeat(50));
		}

		// Close connection
		await mongoose.disconnect();
		console.log("👋 Disconnected from MongoDB");
	} catch (error) {
		console.error("❌ Error seeding data:", error);
		await mongoose.disconnect();
		process.exit(1);
	}
}

// Run the seed function
seedReports();
