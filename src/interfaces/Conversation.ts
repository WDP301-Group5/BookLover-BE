export interface IConversation {
  id: string;
  _id: string;
  members: string[];
  lastMessage: string;
  unreadCount: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}
