export type ReportAction =
	| "dismiss"
	| "acknowledge"
	| "ban_story"
	| "delete_chapter"
	| "delete_comment"
	| "warn_user"
	| "ban_user";

export interface IReportLog {
	_id?: string;
	reportId: string;
	adminId: string;
	action: ReportAction;
	note?: string;
	metadata?: {
		storyBanned?: boolean;
		chapterDeleted?: boolean;
		commentDeleted?: boolean;
		userWarned?: boolean;
		userBanned?: boolean;
	};
	createdAt?: Date;
	updatedAt?: Date;
}
