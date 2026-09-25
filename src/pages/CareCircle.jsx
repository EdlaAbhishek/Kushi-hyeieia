import { useState } from 'react'
import { useAuth } from '../services/AuthContext'
import { toast } from 'react-hot-toast'
import { logAudit, AUDIT_ACTIONS } from '../services/auditService'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Heart, Shield, Lock, CheckCircle2, XCircle, Plus,
    UserPlus, Phone, Mail, AlertTriangle, Calendar, Pill,
    FileText, Activity, Trash2, Edit3, Eye, Bell
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DashboardCard from '../components/ui/DashboardCard'
import ActionButton from '../components/ui/ActionButton'
import StatusBadge from '../components/ui/StatusBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'

// Demo Initial Care Circle Members
const INITIAL_MEMBERS = [
    {
        id: 'member-1',
        name: 'Savitri Varma',
        relationship: 'Mother',
        phone: '+91 98480 33412',
        email: 'savitri.varma@example.com',
        isEmergencyContact: true,
        joinedDate: '12 Jan 2026',
        permissions: {
            appointments: true,
            medications: true,
            emergency: true,
            labReports: false,
            fullHistory: false
        }
    },
    {
        id: 'member-2',
        name: 'Sunita Varma',
        relationship: 'Spouse',
        phone: '+91 94401 55678',
        email: 'sunita.v@example.com',
        isEmergencyContact: true,
        joinedDate: '15 Feb 2026',
        permissions: {
            appointments: true,
            medications: true,
            emergency: true,
            labReports: true,
            fullHistory: true
        }
    },
    {
        id: 'member-3',
        name: 'Kavita Reddy',
        relationship: 'Caregiver / Nurse',
        phone: '+91 91234 88765',
        email: 'kavita.reddy@caregivers.in',
        isEmergencyContact: false,
        joinedDate: '01 Sep 2026',
        permissions: {
            appointments: false,
            medications: true,
            emergency: false,
            labReports: false,
            fullHistory: false
        }
    }
]

const PERMISSION_CONFIG = [
    { key: 'appointments', label: 'Appointments & Consultations', desc: 'Can view upcoming visits and assist with clinic scheduling', icon: Calendar },
    { key: 'medications', label: 'Medication Reminders & Dose Logs', desc: 'Receives alerts for missed doses and tracks daily adherence', icon: Pill },
    { key: 'emergency', label: 'Emergency Contact & SOS Alerts', desc: 'Designated immediate contact during emergency triage alerts', icon: Bell },
    { key: 'labReports', label: 'Diagnostic & Lab Reports', desc: 'Can view blood tests, imaging reports, and pathology findings', icon: FileText },
    { key: 'fullHistory', label: 'Full Health Vault & Past Notes', desc: 'Full access to past hospitalization records and physician notes', icon: Lock }
]

export default function CareCircle() {
    const { user } = useAuth()
    const [members, setMembers] = useState(INITIAL_MEMBERS)
    const [showAddModal, setShowAddModal] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, member: null })
    const [newMember, setNewMember] = useState({
        name: '',
        relationship: 'Parent',
        phone: '',
        email: '',
        isEmergencyContact: false,
        permissions: {
            appointments: true,
            medications: true,
            emergency: true,
            labReports: false,
            fullHistory: false
        }
    })

    // Toggle Permission
    const handleTogglePermission = async (memberId, permKey) => {
        setMembers(prev => prev.map(m => {
            if (m.id === memberId) {
                const updatedPerms = { ...m.permissions, [permKey]: !m.permissions[permKey] }
                return { ...m, permissions: updatedPerms }
            }
            return m
        }))

        const targetMember = members.find(m => m.id === memberId)
        const newState = !targetMember?.permissions[permKey]
        toast.success(`Updated ${permKey} permission for ${targetMember?.name}`)

        await logAudit({
            userId: user?.id,
            action: AUDIT_ACTIONS.UPDATE,
            entityType: 'care_circle_permission',
            entityId: memberId,
            description: `Changed '${permKey}' permission to ${newState ? 'GRANTED' : 'REVOKED'} for ${targetMember?.name} (${targetMember?.relationship})`
        })
    }

    // Add Member
    const handleAddMember = async (e) => {
        e.preventDefault()
        if (!newMember.name || !newMember.phone) {
            toast.error('Please enter member name and contact phone')
            return
        }

        const created = {
            id: 'member-' + Date.now(),
            name: newMember.name,
            relationship: newMember.relationship,
            phone: newMember.phone,
            email: newMember.email || '—',
            isEmergencyContact: newMember.isEmergencyContact,
            joinedDate: 'Today',
            permissions: { ...newMember.permissions }
        }

        setMembers(prev => [...prev, created])
        setShowAddModal(false)
        setNewMember({
            name: '',
            relationship: 'Parent',
            phone: '',
            email: '',
            isEmergencyContact: false,
            permissions: {
                appointments: true,
                medications: true,
                emergency: true,
                labReports: false,
                fullHistory: false
            }
        })

        toast.success(`Added ${created.name} to Care Circle`)

        await logAudit({
            userId: user?.id,
            action: AUDIT_ACTIONS.CREATE,
            entityType: 'care_circle_member',
            entityId: created.id,
            description: `Added ${created.name} (${created.relationship}) to patient Care Circle`
        })
    }

    // Remove Member
    const handleRemoveMember = async () => {
        const member = confirmDelete.member
        if (!member) return

        setMembers(prev => prev.filter(m => m.id !== member.id))
        toast.success(`Removed ${member.name} from Care Circle`)

        await logAudit({
            userId: user?.id,
            action: AUDIT_ACTIONS.DELETE,
            entityType: 'care_circle_member',
            entityId: member.id,
            description: `Removed ${member.name} from Care Circle`
        })

        setConfirmDelete({ isOpen: false, member: null })
    }

    return (
        <div style={{ padding: '0 0 2rem 0' }}>
            <PageHeader
                title="Trusted Care Circle"
                description="Empower family members and trusted caregivers to support your health journey with strictly patient-controlled, granular record permissions."
                action={
                    <ActionButton variant="primary" onClick={() => setShowAddModal(true)}>
                        <UserPlus size={16} /> Add Circle Member
                    </ActionButton>
                }
            />

            {/* Privacy & Governance Notice Banner */}
            <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 'var(--radius)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.75rem'
            }}>
                <Shield size={24} color="#16A34A" />
                <div style={{ fontSize: '0.88rem', color: '#166534', lineHeight: 1.5 }}>
                    <strong>Granular Privacy Architecture:</strong> Every record permission is explicitly granted by you. Members cannot see documents or prescriptions unless you toggle their individual access. You can revoke access at any second.
                </div>
            </div>

            {/* Members Cards List */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {members.map(member => (
                    <DashboardCard
                        key={member.id}
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    background: 'var(--primary-light)',
                                    color: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '1rem'
                                }}>
                                    {member.name.charAt(0)}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-dark)' }}>
                                            {member.name}
                                        </h3>
                                        <span style={{
                                            background: '#E0F2FE',
                                            color: '#0369A1',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: 'var(--radius-pill)'
                                        }}>
                                            {member.relationship}
                                        </span>
                                        {member.isEmergencyContact && (
                                            <span style={{
                                                background: '#FEE2E2',
                                                color: '#DC2626',
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: 'var(--radius-pill)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '3px'
                                            }}>
                                                <AlertTriangle size={11} /> Primary Emergency Contact
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {member.phone} • {member.email} • Joined {member.joinedDate}
                                    </span>
                                </div>
                            </div>
                        }
                        action={
                            <button
                                onClick={() => setConfirmDelete({ isOpen: true, member })}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #FECACA',
                                    color: '#DC2626',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '0.4rem 0.75rem',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                <Trash2 size={13} /> Remove
                            </button>
                        }
                    >
                        {/* Permission Controls Grid */}
                        <div style={{ marginTop: '0.5rem' }}>
                            <div style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                marginBottom: '0.75rem'
                            }}>
                                Authorized Record & Notification Access:
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                                gap: '0.75rem'
                            }}>
                                {PERMISSION_CONFIG.map(perm => {
                                    const isGranted = !!member.permissions[perm.key]
                                    const PermIcon = perm.icon

                                    return (
                                        <div
                                            key={perm.key}
                                            onClick={() => handleTogglePermission(member.id, perm.key)}
                                            style={{
                                                border: `1.5px solid ${isGranted ? '#86EFAC' : 'var(--border)'}`,
                                                background: isGranted ? '#F0FDF4' : 'var(--surface)',
                                                borderRadius: 'var(--radius-sm)',
                                                padding: '0.75rem 0.9rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                <div style={{
                                                    color: isGranted ? '#16A34A' : '#94A3B8',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}>
                                                    <PermIcon size={18} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                                                        {perm.label}
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                        {perm.desc}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{
                                                width: 22,
                                                height: 22,
                                                borderRadius: '50%',
                                                background: isGranted ? '#16A34A' : '#E2E8F0',
                                                color: '#FFFFFF',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.75rem',
                                                fontWeight: 800
                                            }}>
                                                {isGranted ? '✓' : '✕'}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </DashboardCard>
                ))}
            </div>

            {/* Add Member Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '1rem'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: '#FFFFFF',
                            borderRadius: 'var(--radius)',
                            maxWidth: '520px',
                            width: '100%',
                            padding: '1.75rem',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                        }}
                    >
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--text-dark)' }}>
                            Add Family or Care Circle Member
                        </h3>
                        <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Invite a trusted family member or caregiver and customize their permission bounds.
                        </p>

                        <form onSubmit={handleAddMember} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={newMember.name}
                                    onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                                    placeholder="e.g. Ramesh Varma"
                                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                                        Relationship *
                                    </label>
                                    <select
                                        value={newMember.relationship}
                                        onChange={e => setNewMember({ ...newMember, relationship: e.target.value })}
                                        style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                    >
                                        <option value="Parent">Parent</option>
                                        <option value="Mother">Mother</option>
                                        <option value="Father">Father</option>
                                        <option value="Spouse">Spouse</option>
                                        <option value="Child">Child (Son/Daughter)</option>
                                        <option value="Sibling">Sibling</option>
                                        <option value="Caregiver">Caregiver</option>
                                        <option value="Other">Other Trusted Contact</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                                        Mobile Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        value={newMember.phone}
                                        onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                                        placeholder="+91 98480 12345"
                                        style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                                    Email Address (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={newMember.email}
                                    onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                                    placeholder="ramesh@example.com"
                                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                <input
                                    type="checkbox"
                                    id="emergencyCheck"
                                    checked={newMember.isEmergencyContact}
                                    onChange={e => setNewMember({ ...newMember, isEmergencyContact: e.target.checked })}
                                    style={{ width: 16, height: 16 }}
                                />
                                <label htmlFor="emergencyCheck" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#DC2626' }}>
                                    Designate as Primary Emergency Responder
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                                <ActionButton variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </ActionButton>
                                <ActionButton variant="primary" type="submit">
                                    Add Member to Circle
                                </ActionButton>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Confirm Removal Dialog */}
            <ConfirmDialog
                isOpen={confirmDelete.isOpen}
                title={`Remove ${confirmDelete.member?.name}?`}
                message={`Are you sure you want to remove ${confirmDelete.member?.name} (${confirmDelete.member?.relationship}) from your Care Circle? They will immediately lose access to all granted health records.`}
                confirmText="Yes, Remove Member"
                cancelText="Keep in Circle"
                onConfirm={handleRemoveMember}
                onCancel={() => setConfirmDelete({ isOpen: false, member: null })}
                danger
            />
        </div>
    )
}
