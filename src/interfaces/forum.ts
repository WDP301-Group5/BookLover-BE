export const listKey = ["general", "story", "sideline", "question"];

export interface IForum {
    id: string;
    slug: string;
    key: string;
    name: string;
    description: string;
    status: "active" | "inactive";
    createdAt?: Date;
    updatedAt?: Date;
}