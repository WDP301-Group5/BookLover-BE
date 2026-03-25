import { IMessage } from "./../interfaces/message";
import { IUserPreview } from "../interfaces/user";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { User } from "../models/User";

const ChatingService = {
	async getListChatingUser(userId: string) {
		try {
			const listChatingUser = await Conversation.find({
				members: userId,
			})
				.sort({ updatedAt: -1 })
				.populate<{ members: IUserPreview[] }>(
					"members",
					"id username fullName avatarURL online",
				)
				.populate<{ lastMessage: IMessage }>("lastMessage")
				.lean();

			const formattedListChatingUser = listChatingUser?.map((c) => ({
				id: c._id.toString(),
				createdAt: c.createdAt,
				member: c.members.find(
					(m: IUserPreview) => m._id.toString() !== userId,
				),
				lastMessage: c.lastMessage,
				unreadCount: c.unreadCount,
				updatedAt: c.updatedAt,
			}));
			return formattedListChatingUser;
		} catch (error) {
			throw new Error(`Error fetching list chating user: ${error}`);
		}
	},

	async getSearchChatingUser(query: string) {
		try {
			const searchResult = await User.find({
				$or: [
					{ username: { $regex: query, $options: "i" } },
					{ fullName: { $regex: query, $options: "i" } },
					{ penName: { $regex: query, $options: "i" } },
				],
			})
				.select(
					"id username penName online fullName avatarURL createdAt updatedAt",
				)
				.lean();

			const formatData =
				searchResult &&
				searchResult?.map((u) => {
					return {
						...u,
						id: u._id.toString(),
						username: u.username,
						penName: u.penName,
						fullName: u.fullName,
						avatarURL: u.avatarURL,
						createdAt: u.createdAt,
						updatedAt: u.updatedAt,
					};
				});

			return formatData;
		} catch (error) {
			throw new Error(`Error fetching search chating user: ${error}`);
		}
	},

	async getChatingContent(
		conversationId: string,
		lastMessageTime: Date = new Date(),
		limit: number = 20,
	) {
		try {
			const chatingContent = await Message.find({
				conversationId,
				createdAt: { $lt: lastMessageTime },
			})
				.sort({ createdAt: -1 })
				.limit(limit)
				.lean();

			const formattedChatingContent = chatingContent
				?.map((m) => ({
					...m,
					id: m._id.toString(),
				}))
				.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

			return formattedChatingContent;
		} catch (error) {
			throw new Error(`Error fetching chating content: ${error}`);
		}
	},

	async createConversation(userId: string, memberId: string) {
		try {
			if (!userId || !memberId)
				return { success: false, error: "lack-of-data" };
			if (userId === memberId) return { success: false, error: "duplicate" };
			const members = [userId, memberId];
			const conversation = await Conversation.create({
				members,
				unreadCount: { userId: 0, memberId: 0 },
			});
			const returnConversation = await Conversation.findById(conversation._id)
				.populate<{
					members: IUserPreview[];
				}>("members", "id nickName fullName avatarURL online")
				.populate<{ lastMessage: IMessage }>("lastMessage")
				.lean();

			if (!returnConversation) {
				return { success: false, error: "conversation-not-found" };
			}

			const formattedConversation = {
				id: returnConversation._id.toString(),
				createdAt: returnConversation.createdAt,
				member: returnConversation.members.find(
					(m: IUserPreview) => m._id.toString() !== userId,
				),
				lastMessage: returnConversation.lastMessage,
				unreadCount: returnConversation.unreadCount,
				updatedAt: returnConversation.updatedAt,
			};

			return { success: true, conversation: formattedConversation };
		} catch (error) {
			throw new Error(`Error creating conversation: ${error}`);
		}
	},

	async checkAndCreateConversationExists(userId: string, memberId: string) {
		try {
			if (!userId || !memberId)
				return { success: false, error: "Lack of data" };
			if (userId === memberId)
				return { success: false, error: "Duplicate user information" };
			const members = [userId, memberId];
			const conversation = await Conversation.findOne({
				members: { $all: members },
			})
				.populate<{ members: IUserPreview[] }>(
					"members",
					"id nickName fullName avatarURL online",
				)
				.populate<{ lastMessage: IMessage }>("lastMessage")
				.lean();
			if (!conversation) {
				const newConversation = await this.createConversation(userId, memberId);

				return { success: true, conversation: newConversation.conversation };
			} else {
				const formatConversation = {
					id: conversation._id.toString(),
					createdAt: conversation.createdAt,
					member: conversation.members.find(
						(m: IUserPreview) => m._id.toString() !== userId,
					),
					lastMessage: conversation.lastMessage,
					unreadCount: conversation.unreadCount,
					updatedAt: conversation.updatedAt,
				};
				return { success: true, conversation: formatConversation };
			}
		} catch (error) {
			console.log("Error checking conversation:", error);
			throw new Error(`Error checking conversation: ${error}`);
		}
	},

	async createMessage(
		conversationId: string,
		senderId: string,
		content: string = "",
	) {
		try {
			const message = await Message.create({
				conversationId,
				senderId,
				content,
			});
			return message;
		} catch (error) {
			throw new Error(`Error creating message: ${error}`);
		}
	},

	async updateConversation(conversationId: string, messageId: string) {
		try {
			const conversation = await Conversation.findByIdAndUpdate(
				conversationId,
				{ lastMessage: messageId },
				{ new: true },
			);
			return !!conversation;
		} catch (error) {
			throw new Error(`Error updating conversation: ${error}`);
		}
	},
};

export default ChatingService;
