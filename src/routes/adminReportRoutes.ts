import express from "express";
import {
    acknowledgeReport,
    banStory,
    banUser,
    deleteChapter,
    deleteComment,
    dismissReport,
    getReportDetail,
    getReportLogs,
    getReports,
    warnUser,
} from "../controllers/adminReportController.js";

const adminReportRouter = express.Router();

/**
 * @route GET /api/admin/reports
 * @description Get list of reports with filters and pagination
 * @access Admin only
 * @queryparam {string} status - Filter by status (pending, success, failed)
 * @queryparam {string} type - Filter by type (Story, Chapter, Comment)
 * @queryparam {string} search - Search in report content
 * @queryparam {number} page - Page number (default: 1)
 * @queryparam {number} limit - Items per page (default: 20)
 */
adminReportRouter.get("/", getReports);

/**
 * @route GET /api/admin/reports/:id
 * @description Get report detail by ID
 * @access Admin only
 */
adminReportRouter.get("/:id", getReportDetail);

/**
 * @route GET /api/admin/reports/:id/logs
 * @description Get report logs (history)
 * @access Admin only
 */
adminReportRouter.get("/:id/logs", getReportLogs);

/**
 * @route POST /api/admin/reports/:id/dismiss
 * @description Dismiss a report (mark as invalid/failed)
 * @access Admin only
 * @body {string} note - Optional note for the dismissal
 */
adminReportRouter.post("/:id/dismiss", dismissReport);

/**
 * @route POST /api/admin/reports/:id/acknowledge
 * @description Acknowledge a report (mark as valid but no immediate action)
 * @access Admin only
 * @body {string} note - Optional note for the acknowledgment
 */
adminReportRouter.post("/:id/acknowledge", acknowledgeReport);

/**
 * @route POST /api/admin/reports/:id/ban-story
 * @description Ban a story from report
 * @access Admin only
 * @body {string} reason - Reason for banning the story
 */
adminReportRouter.post("/:id/ban-story", banStory);

/**
 * @route POST /api/admin/reports/:id/delete-chapter
 * @description Delete a chapter from report
 * @access Admin only
 * @body {string} reason - Reason for deleting the chapter
 */
adminReportRouter.post("/:id/delete-chapter", deleteChapter);

/**
 * @route POST /api/admin/reports/:id/delete-comment
 * @description Delete a comment from report
 * @access Admin only
 * @body {string} reason - Reason for deleting the comment
 */
adminReportRouter.post("/:id/delete-comment", deleteComment);

/**
 * @route POST /api/admin/reports/:id/warn-user
 * @description Warn a user from report
 * @access Admin only
 * @body {string} message - Warning message to send to the user
 */
adminReportRouter.post("/:id/warn-user", warnUser);

/**
 * @route POST /api/admin/reports/:id/ban-user
 * @description Ban a user from report
 * @access Admin only
 * @body {string} reason - Reason for banning the user
 */
adminReportRouter.post("/:id/ban-user", banUser);

export default adminReportRouter;
