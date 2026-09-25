import { supabase } from './supabase'

/**
 * Universal Audit Logger
 * Records actions across all modules for compliance and transparency.
 */
export async function logAudit({ userId, action, entityType, entityId, description, metadata = {} }) {
    try {
        await supabase.from('audit_logs').insert([{
            user_id: userId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            description,
            metadata
        }])
    } catch (err) {
        console.warn('Audit log insert failed:', err.message)
    }
}

/**
 * Common audit actions
 */
export const AUDIT_ACTIONS = {
    // Auth
    LOGIN: 'login',
    LOGOUT: 'logout',

    // Health Vault
    REPORT_UPLOADED: 'report_uploaded',
    REPORT_VIEWED: 'report_viewed',
    REPORT_SHARED: 'report_shared',
    REPORT_DELETED: 'report_deleted',
    ACCESS_REVOKED: 'access_revoked',
    LAB_REPORT_ACCEPTED: 'lab_report_accepted',
    LAB_REPORT_REJECTED: 'lab_report_rejected',

    // Prescriptions & Medications
    PRESCRIPTION_CREATED: 'prescription_created',
    PRESCRIPTION_OCR: 'prescription_ocr',
    SCHEDULE_CONFIRMED: 'schedule_confirmed',
    DOSE_TAKEN: 'dose_taken',
    DOSE_SKIPPED: 'dose_skipped',

    // Insurance
    POLICY_ADDED: 'policy_added',
    CLAIM_CREATED: 'claim_created',
    CLAIM_UPDATED: 'claim_updated',

    // Queue
    TOKEN_CREATED: 'token_created',
    TOKEN_CANCELLED: 'token_cancelled',
    PRIORITY_CHANGED: 'priority_changed',
    CONSULTATION_STARTED: 'consultation_started',
    CONSULTATION_COMPLETED: 'consultation_completed',
    PATIENT_SKIPPED: 'patient_skipped',
    NO_SHOW: 'no_show',

    // Community
    VOLUNTEER_REGISTERED: 'volunteer_registered',
    TASK_ASSIGNED: 'task_assigned',
    TASK_COMPLETED: 'task_completed',
    ASSISTANCE_REQUESTED: 'assistance_requested',

    // Care Circle
    MEMBER_ADDED: 'care_member_added',
    MEMBER_REMOVED: 'care_member_removed',
    PERMISSION_CHANGED: 'permission_changed',

    // Records
    SENSITIVE_ACCESS: 'sensitive_record_access'
}
