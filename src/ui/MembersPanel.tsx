'use client';

// Success Class - Members Panel Component
// Text-only display of joined members with status indicators
// Raise-hand queue at top, teacher can grant speaking permission

import { Hand, Mic, MicOff, Check } from 'lucide-react';

export interface Member {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  isMuted: boolean;
  handRaised: boolean;
  canSpeak: boolean;
  isOnline: boolean;
}

interface MembersPanelProps {
  members: Member[];
  currentUserId?: string;
  isTeacher?: boolean;
  onGrantSpeak?: (memberId: string) => void;
  onRevokeSpeak?: (memberId: string) => void;
}

export function MembersPanel({
  members,
  currentUserId,
  isTeacher = false,
  onGrantSpeak,
  onRevokeSpeak,
}: MembersPanelProps) {
  // Separate members into groups
  const teacher = members.find((m) => m.role === 'teacher');
  const raisedHands = members.filter((m) => m.role === 'student' && m.handRaised);
  const otherStudents = members.filter((m) => m.role === 'student' && !m.handRaised);

  return (
    <div className="sc-members-panel">
      <div className="sc-members-header">
        <span>👥 Members ({members.length})</span>
      </div>
      
      {/* Teacher */}
      {teacher && (
        <div className="sc-members-section">
          <div className="sc-section-label">Teacher</div>
          <MemberItem
            member={teacher}
            isCurrentUser={teacher.id === currentUserId}
          />
        </div>
      )}
      
      {/* Raise Hand Queue */}
      {raisedHands.length > 0 && (
        <div className="sc-members-section sc-raise-hand-queue">
          <div className="sc-section-label">
            <Hand size={14} className="sc-hand-icon" />
            Raised Hands ({raisedHands.length})
          </div>
          {raisedHands.map((member) => (
            <MemberItem
              key={member.id}
              member={member}
              isCurrentUser={member.id === currentUserId}
              showActions={isTeacher}
              onGrant={() => onGrantSpeak?.(member.id)}
              onRevoke={() => onRevokeSpeak?.(member.id)}
            />
          ))}
        </div>
      )}
      
      {/* Other Students */}
      {otherStudents.length > 0 && (
        <div className="sc-members-section">
          <div className="sc-section-label">Students ({otherStudents.length})</div>
          {otherStudents.map((member) => (
            <MemberItem
              key={member.id}
              member={member}
              isCurrentUser={member.id === currentUserId}
              showActions={isTeacher && member.canSpeak}
              onRevoke={() => onRevokeSpeak?.(member.id)}
            />
          ))}
        </div>
      )}
      
      {members.length === 0 && (
        <div className="sc-members-empty">
          No members yet
        </div>
      )}
    </div>
  );
}

// Individual member item
interface MemberItemProps {
  member: Member;
  isCurrentUser?: boolean;
  showActions?: boolean;
  onGrant?: () => void;
  onRevoke?: () => void;
}

function MemberItem({
  member,
  isCurrentUser,
  showActions,
  onGrant,
  onRevoke,
}: MemberItemProps) {
  return (
    <div className={`sc-member-item ${!member.isOnline ? 'offline' : ''}`}>
      <div className="sc-member-info">
        <span className="sc-member-avatar">
          {member.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'}
        </span>
        <span className="sc-member-name">
          {member.name}
          {isCurrentUser && <span className="sc-you-badge">(You)</span>}
        </span>
      </div>
      
      <div className="sc-member-status">
        {/* Hand raised indicator */}
        {member.handRaised && (
          <span className="sc-status-badge hand" title="Hand raised">
            <Hand size={14} />
          </span>
        )}
        
        {/* Speaking permission indicator */}
        {member.canSpeak && member.role === 'student' && (
          <span className="sc-status-badge granted" title="Can speak">
            <Check size={14} />
          </span>
        )}
        
        {/* Mic status */}
        <span className={`sc-status-badge ${member.isMuted ? 'muted' : 'unmuted'}`}>
          {member.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
        </span>
        
        {/* Teacher actions */}
        {showActions && (
          <div className="sc-member-actions">
            {member.handRaised && !member.canSpeak && onGrant && (
              <button
                className="sc-grant-btn"
                onClick={onGrant}
                title="Grant speaking permission"
              >
                Grant
              </button>
            )}
            {member.canSpeak && onRevoke && (
              <button
                className="sc-revoke-btn"
                onClick={onRevoke}
                title="Revoke speaking permission"
              >
                Revoke
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
