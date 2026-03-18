export interface IReplyForumPost {
    id: string;
    userId: string;
    forumPostId: string;
    content: string;
    createdAt?: Date;
    updatedAt?: Date;
}