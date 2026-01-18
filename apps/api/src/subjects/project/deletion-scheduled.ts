/**
 * Subject for Project - Deletion Scheduled Email
 */

export const subject = (params: { projectName: string; deletionDate: string }) =>
  `${params.projectName} scheduled for deletion on ${params.deletionDate}`;
