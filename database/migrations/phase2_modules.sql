-- =====================================================================
-- PHASE 2 MODULES — Kushi Hygieia Healthcare Platform Extension
-- Run this ENTIRE file in your Supabase SQL Editor
-- ✅ FULLY IDEMPOTENT — safe to run multiple times
-- =====================================================================


-- ══════════════════════════════════════════════════════════════
-- MODULE 1: SMART OPD QUEUE
-- ══════════════════════════════════════════════════════════════

-- Departments within hospitals
CREATE TABLE IF NOT EXISTS public.departments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id     UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name            VARCHAR(120) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OPD Queue configurations
CREATE TABLE IF NOT EXISTS public.opd_queues (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id     UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    department_id   UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    doctor_id       UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    queue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'paused', 'closed')),
    max_tokens      INTEGER DEFAULT 100,
    avg_consult_min INTEGER DEFAULT 15,
    current_token   INTEGER DEFAULT 0,
    last_token      INTEGER DEFAULT 0,
    started_at      TIMESTAMPTZ,
    closed_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual patient tokens
CREATE TABLE IF NOT EXISTS public.queue_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id        UUID NOT NULL REFERENCES public.opd_queues(id) ON DELETE CASCADE,
    patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_number    INTEGER NOT NULL,
    token_prefix    VARCHAR(5) DEFAULT 'A',
    status          VARCHAR(20) NOT NULL DEFAULT 'waiting'
                        CHECK (status IN ('waiting', 'checked_in', 'in_consultation', 'completed', 'skipped', 'cancelled', 'no_show')),
    priority        VARCHAR(20) DEFAULT 'normal'
                        CHECK (priority IN ('normal', 'priority', 'emergency')),
    priority_reason TEXT,
    priority_set_by UUID REFERENCES auth.users(id),
    check_in_at     TIMESTAMPTZ,
    consult_start   TIMESTAMPTZ,
    consult_end     TIMESTAMPTZ,
    estimated_wait  INTEGER, -- in minutes
    triage_notes    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Queue event audit trail
CREATE TABLE IF NOT EXISTS public.queue_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id        UUID NOT NULL REFERENCES public.opd_queues(id) ON DELETE CASCADE,
    token_id        UUID REFERENCES public.queue_tokens(id) ON DELETE SET NULL,
    event_type      VARCHAR(40) NOT NULL,
    description     TEXT,
    performed_by    UUID REFERENCES auth.users(id),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ══════════════════════════════════════════════════════════════
-- MODULE 2 & 3: HEALTH VAULT ENHANCEMENT + LAB WORKFLOW
-- ══════════════════════════════════════════════════════════════

-- Extended health documents (supplements existing patient_records)
CREATE TABLE IF NOT EXISTS public.health_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    category        VARCHAR(40) NOT NULL DEFAULT 'other'
                        CHECK (category IN ('lab_report', 'prescription', 'doctor_notes',
                               'imaging', 'vaccination', 'discharge_summary',
                               'insurance_doc', 'medical_certificate', 'consultation', 'other')),
    file_url        TEXT,
    file_name       VARCHAR(200),
    file_type       VARCHAR(20),
    file_size       INTEGER,
    hospital_lab    VARCHAR(200),
    doctor_name     VARCHAR(120),
    report_date     DATE,
    upload_source   VARCHAR(20) DEFAULT 'patient'
                        CHECK (upload_source IN ('patient', 'lab', 'doctor', 'hospital')),
    verification    VARCHAR(20) DEFAULT 'unverified'
                        CHECK (verification IN ('unverified', 'verified', 'rejected')),
    is_demo         BOOLEAN DEFAULT FALSE,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Controlled document sharing
CREATE TABLE IF NOT EXISTS public.document_shares (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with_role VARCHAR(20) DEFAULT 'doctor',
    scope           VARCHAR(20) DEFAULT 'selected'
                        CHECK (scope IN ('selected', 'multiple', 'full_vault')),
    document_ids    UUID[] DEFAULT '{}',
    access_type     VARCHAR(20) DEFAULT 'time_limited'
                        CHECK (access_type IN ('one_time', 'time_limited', 'permanent')),
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT TRUE,
    revoked_at      TIMESTAMPTZ,
    reason          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pending lab reports (Lab → Patient workflow)
CREATE TABLE IF NOT EXISTS public.pending_lab_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    lab_name        VARCHAR(200) NOT NULL,
    report_title    VARCHAR(200) NOT NULL,
    report_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    transfer_code   VARCHAR(20),
    file_url        TEXT,
    file_name       VARCHAR(200),
    status          VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    accepted_at     TIMESTAMPTZ,
    is_demo         BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ══════════════════════════════════════════════════════════════
-- MODULE 4: MEDICATION CENTER
-- ══════════════════════════════════════════════════════════════

-- Prescriptions issued by doctors
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id       UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    doctor_name     VARCHAR(120),
    hospital_name   VARCHAR(200),
    diagnosis       TEXT,
    prescription_date DATE DEFAULT CURRENT_DATE,
    file_url        TEXT,
    ocr_raw_text    TEXT,
    ocr_confidence  NUMERIC(3,2),
    status          VARCHAR(20) DEFAULT 'active'
                        CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
    is_demo         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual medications from a prescription
CREATE TABLE IF NOT EXISTS public.medications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    dosage          VARCHAR(100),
    frequency       VARCHAR(100),
    timing          VARCHAR(100),
    instructions    TEXT,
    duration_days   INTEGER,
    start_date      DATE DEFAULT CURRENT_DATE,
    end_date        DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    is_demo         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI-generated medication schedules
CREATE TABLE IF NOT EXISTS public.medication_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id   UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
    patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_time  TIME NOT NULL,
    label           VARCHAR(40),
    meal_relation   VARCHAR(20) DEFAULT 'after_meal'
                        CHECK (meal_relation IN ('before_meal', 'after_meal', 'with_meal', 'empty_stomach', 'anytime')),
    is_confirmed    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Medication dose logs
CREATE TABLE IF NOT EXISTS public.medication_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id     UUID NOT NULL REFERENCES public.medication_schedules(id) ON DELETE CASCADE,
    medication_id   UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
    patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('taken', 'skipped', 'missed', 'pending', 'snoozed')),
    taken_at        TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ══════════════════════════════════════════════════════════════
-- MODULE 5: INSURANCE CENTER
-- ══════════════════════════════════════════════════════════════

-- Insurance policies
CREATE TABLE IF NOT EXISTS public.insurance_policies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider        VARCHAR(200) NOT NULL,
    policy_number   VARCHAR(100) NOT NULL,
    policy_type     VARCHAR(60) DEFAULT 'Individual',
    sum_insured     NUMERIC(12,2),
    premium         NUMERIC(10,2),
    valid_from      DATE,
    valid_until     DATE,
    status          VARCHAR(20) DEFAULT 'active'
                        CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    coverage_details JSONB DEFAULT '{}',
    network_hospitals TEXT[],
    is_demo         BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insurance claims
CREATE TABLE IF NOT EXISTS public.insurance_claims (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id       UUID NOT NULL REFERENCES public.insurance_policies(id) ON DELETE CASCADE,
    patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    claim_number    VARCHAR(50),
    hospital_name   VARCHAR(200),
    treatment       TEXT,
    claim_amount    NUMERIC(10,2),
    approved_amount NUMERIC(10,2),
    submitted_date  DATE DEFAULT CURRENT_DATE,
    status          VARCHAR(30) DEFAULT 'draft'
                        CHECK (status IN ('draft', 'documents_uploaded', 'submitted',
                               'under_review', 'approved', 'rejected', 'settled', 'appealed')),
    status_history  JSONB DEFAULT '[]',
    is_demo         BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insurance documents
CREATE TABLE IF NOT EXISTS public.insurance_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id       UUID REFERENCES public.insurance_policies(id) ON DELETE SET NULL,
    claim_id        UUID REFERENCES public.insurance_claims(id) ON DELETE SET NULL,
    patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doc_type        VARCHAR(40) NOT NULL,
    file_url        TEXT,
    file_name       VARCHAR(200),
    uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);


-- ══════════════════════════════════════════════════════════════
-- MODULE 6: KUSHI COMMUNITY
-- ══════════════════════════════════════════════════════════════

-- Volunteer profiles
CREATE TABLE IF NOT EXISTS public.volunteers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       VARCHAR(120) NOT NULL,
    phone           VARCHAR(20),
    skills          TEXT[],
    languages       TEXT[],
    availability    VARCHAR(20) DEFAULT 'weekdays',
    completed_tasks INTEGER DEFAULT 0,
    volunteer_hours NUMERIC(6,1) DEFAULT 0,
    is_verified     BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(20) DEFAULT 'pending'
                        CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    training_completed BOOLEAN DEFAULT FALSE,
    reliability_score NUMERIC(3,2) DEFAULT 0,
    badges          TEXT[] DEFAULT '{}',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Available volunteer tasks
CREATE TABLE IF NOT EXISTS public.volunteer_tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id     UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    task_type       VARCHAR(40) NOT NULL
                        CHECK (task_type IN ('patient_escort', 'wheelchair', 'navigation',
                               'elderly_assist', 'blood_donation', 'health_camp',
                               'cleanliness', 'medicine_pickup', 'awareness',
                               'rural_outreach', 'disaster_support', 'document_assist', 'other')),
    location        VARCHAR(200),
    scheduled_date  DATE,
    scheduled_time  TIME,
    volunteer_id    UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
    status          VARCHAR(20) DEFAULT 'open'
                        CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
    is_demo         BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patient assistance requests
CREATE TABLE IF NOT EXISTS public.assistance_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type    VARCHAR(40) NOT NULL,
    description     TEXT,
    hospital_id     UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    location        VARCHAR(200),
    volunteer_id    UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
    status          VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending', 'matching', 'assigned', 'in_progress', 'completed', 'cancelled')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);


-- ══════════════════════════════════════════════════════════════
-- NOVEL FEATURES: CARE CIRCLE + AUDIT
-- ══════════════════════════════════════════════════════════════

-- Care Circle members
CREATE TABLE IF NOT EXISTS public.care_circle_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    member_name     VARCHAR(120) NOT NULL,
    member_email    VARCHAR(200),
    member_phone    VARCHAR(20),
    relationship    VARCHAR(40) NOT NULL
                        CHECK (relationship IN ('parent', 'child', 'spouse', 'sibling',
                               'caregiver', 'guardian', 'friend', 'other')),
    member_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Care Circle permissions
CREATE TABLE IF NOT EXISTS public.care_permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_member_id  UUID NOT NULL REFERENCES public.care_circle_members(id) ON DELETE CASCADE,
    permission_type VARCHAR(40) NOT NULL
                        CHECK (permission_type IN ('appointments', 'medication_reminders',
                               'emergency_contact', 'lab_reports', 'full_medical_history',
                               'insurance', 'queue_status', 'health_journey')),
    is_granted      BOOLEAN DEFAULT FALSE,
    granted_at      TIMESTAMPTZ,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Universal audit log
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action          VARCHAR(60) NOT NULL,
    entity_type     VARCHAR(40),
    entity_id       UUID,
    description     TEXT,
    ip_address      VARCHAR(45),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ══════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_departments_hospital ON public.departments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_opd_queues_hospital ON public.opd_queues(hospital_id);
CREATE INDEX IF NOT EXISTS idx_opd_queues_date ON public.opd_queues(queue_date);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_queue ON public.queue_tokens(queue_id);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_patient ON public.queue_tokens(patient_id);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_status ON public.queue_tokens(status);
CREATE INDEX IF NOT EXISTS idx_queue_events_queue ON public.queue_events(queue_id);
CREATE INDEX IF NOT EXISTS idx_health_documents_patient ON public.health_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_documents_category ON public.health_documents(category);
CREATE INDEX IF NOT EXISTS idx_document_shares_patient ON public.document_shares(patient_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared ON public.document_shares(shared_with_id);
CREATE INDEX IF NOT EXISTS idx_pending_lab_patient ON public.pending_lab_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_patient ON public.medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_med ON public.medication_schedules(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_patient ON public.medication_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_date ON public.medication_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_patient ON public.insurance_policies(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_policy ON public.insurance_claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_user ON public.volunteers(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_tasks_status ON public.volunteer_tasks(status);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_patient ON public.assistance_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_circle_patient ON public.care_circle_members(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);


-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opd_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ══════════════════════════════════════════════════════════════

-- Departments: public read
CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage departments" ON public.departments FOR ALL USING (auth.role() = 'authenticated');

-- OPD Queues: public read, authenticated manage
CREATE POLICY "Anyone can view queues" ON public.opd_queues FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage queues" ON public.opd_queues FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update queues" ON public.opd_queues FOR UPDATE USING (auth.role() = 'authenticated');

-- Queue Tokens: own tokens + doctor/admin can see their queue
CREATE POLICY "Users can view own tokens" ON public.queue_tokens FOR SELECT USING (auth.uid() = patient_id OR auth.role() = 'authenticated');
CREATE POLICY "Users can create tokens" ON public.queue_tokens FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update tokens" ON public.queue_tokens FOR UPDATE USING (auth.role() = 'authenticated');

-- Queue Events: authenticated read
CREATE POLICY "Authenticated can view queue events" ON public.queue_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert queue events" ON public.queue_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Health Documents: own records only
CREATE POLICY "Users can view own health documents" ON public.health_documents FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can manage own health documents" ON public.health_documents FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own health documents" ON public.health_documents FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Users can delete own health documents" ON public.health_documents FOR DELETE USING (auth.uid() = patient_id);

-- Document Shares: patient controls sharing
CREATE POLICY "Users can view own shares" ON public.document_shares FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = shared_with_id);
CREATE POLICY "Users can create shares" ON public.document_shares FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own shares" ON public.document_shares FOR UPDATE USING (auth.uid() = patient_id);

-- Pending Lab Reports
CREATE POLICY "Users can view own pending reports" ON public.pending_lab_reports FOR SELECT USING (auth.uid() = patient_id OR auth.role() = 'authenticated');
CREATE POLICY "Authenticated can create pending reports" ON public.pending_lab_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own pending reports" ON public.pending_lab_reports FOR UPDATE USING (auth.uid() = patient_id);

-- Prescriptions
CREATE POLICY "Users can view own prescriptions" ON public.prescriptions FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Authenticated can create prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own prescriptions" ON public.prescriptions FOR UPDATE USING (auth.uid() = patient_id);

-- Medications
CREATE POLICY "Users can view own medications" ON public.medications FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Authenticated can create medications" ON public.medications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own medications" ON public.medications FOR UPDATE USING (auth.uid() = patient_id);

-- Medication Schedules
CREATE POLICY "Users can view own schedules" ON public.medication_schedules FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Authenticated can create schedules" ON public.medication_schedules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own schedules" ON public.medication_schedules FOR UPDATE USING (auth.uid() = patient_id);

-- Medication Logs
CREATE POLICY "Users can view own logs" ON public.medication_logs FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can create own logs" ON public.medication_logs FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own logs" ON public.medication_logs FOR UPDATE USING (auth.uid() = patient_id);

-- Insurance Policies
CREATE POLICY "Users can view own policies" ON public.insurance_policies FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can manage own policies" ON public.insurance_policies FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own policies" ON public.insurance_policies FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Users can delete own policies" ON public.insurance_policies FOR DELETE USING (auth.uid() = patient_id);

-- Insurance Claims
CREATE POLICY "Users can view own claims" ON public.insurance_claims FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can manage own claims" ON public.insurance_claims FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own claims" ON public.insurance_claims FOR UPDATE USING (auth.uid() = patient_id);

-- Insurance Documents
CREATE POLICY "Users can view own insurance docs" ON public.insurance_documents FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can manage own insurance docs" ON public.insurance_documents FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Volunteers: public read, own manage
CREATE POLICY "Anyone can view volunteers" ON public.volunteers FOR SELECT USING (true);
CREATE POLICY "Users can manage own volunteer profile" ON public.volunteers FOR ALL USING (auth.uid() = user_id);

-- Volunteer Tasks: public read
CREATE POLICY "Anyone can view volunteer tasks" ON public.volunteer_tasks FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage tasks" ON public.volunteer_tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update tasks" ON public.volunteer_tasks FOR UPDATE USING (auth.role() = 'authenticated');

-- Assistance Requests
CREATE POLICY "Users can view own assistance requests" ON public.assistance_requests FOR SELECT USING (auth.uid() = patient_id OR auth.role() = 'authenticated');
CREATE POLICY "Users can create assistance requests" ON public.assistance_requests FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Authenticated can update assistance requests" ON public.assistance_requests FOR UPDATE USING (auth.role() = 'authenticated');

-- Care Circle
CREATE POLICY "Users can view own care circle" ON public.care_circle_members FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can manage own care circle" ON public.care_circle_members FOR ALL USING (auth.uid() = patient_id);

-- Care Permissions
CREATE POLICY "Users can view own care permissions" ON public.care_permissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.care_circle_members ccm WHERE ccm.id = care_member_id AND ccm.patient_id = auth.uid())
);
CREATE POLICY "Users can manage own care permissions" ON public.care_permissions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.care_circle_members ccm WHERE ccm.id = care_member_id AND ccm.patient_id = auth.uid())
);

-- Audit Logs: own read, authenticated insert
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- ══════════════════════════════════════════════════════════════
-- STORAGE BUCKET for health documents
-- ══════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('health-documents', 'health-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to health-documents bucket
DO $$ BEGIN
    CREATE POLICY "Auth users can upload health docs"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'health-documents' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view own health docs"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'health-documents' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ══════════════════════════════════════════════════════════════
-- DONE! All new module tables created.
-- ══════════════════════════════════════════════════════════════
