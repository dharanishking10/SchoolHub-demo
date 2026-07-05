export type Role = 'HEADMASTER' | 'TEACHER' | 'STUDENT';
export declare function notify(recipientId: number, recipientRole: Role, type: string, title: string, message: string, link?: string): Promise<void>;
export declare function notifyAllOfRole(recipientRole: Role, type: string, title: string, message: string, link?: string): Promise<void>;
export declare function notifyClass(className: string, section: string, type: string, title: string, message: string, link?: string): Promise<void>;
export declare function audit(userId: number, userName: string, userRole: string, action: string, details?: string): Promise<void>;
//# sourceMappingURL=activityLog.d.ts.map