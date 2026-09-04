/* =============================================================================
   Vaidyagan Admin Console — single data interface (Demo ⇄ Firestore)
   -----------------------------------------------------------------------------
   This is the ONE interface the console imports. Every function checks the
   current mode and delegates to either the localStorage demo layer (./db.ts +
   lib auth) or the Firestore twin (./firebase-db.ts). In Live Mode writes are
   dual-written (demo AND Firestore) so the Doctor Studio and the Console never
   disagree while you transition. Switching Demo → Live changes nothing visual.
   ========================================================================== */

import * as fb from "./firebase-db";
import { getConsoleMode, hasFirebaseConfig } from "./db";
import { auth, type StudioUser } from "../lib";

/* ---------------------------------- mode ------------------------------------ */

export function isLive(): boolean {
  try { return hasFirebaseConfig() && getConsoleMode() === "live"; } catch { return false; }
}

/* --------------------------------- staff ------------------------------------ */

export interface StaffRecord {
  id: string; name: string; role: "superadmin" | "doctor";
  username: string; specialty?: string; hue: string; active: boolean;
  consoleAccess: boolean; consoleRole: "editor" | "viewer"; createdAt: string;
}

function fromStudio(u: StudioUser): StaffRecord {
  return {
    id: u.id, name: u.name, role: u.role, username: u.username, specialty: u.specialty,
    hue: u.hue, active: u.active, consoleAccess: u.consoleAccess, consoleRole: u.consoleRole,
    createdAt: u.createdAt,
  };
}

/** Load staff. Live Mode prefers Firestore, falling back to the demo list. */
export async function loadStaff(): Promise<StaffRecord[]> {
  if (isLive()) {
    try {
      const live = await fb.listStaff();
      if (live.length > 0) return live;
    } catch { /* fall through to demo */ }
  }
  return auth.list().map(fromStudio);
}

/** Change a member's console role (dual-written in Live Mode). */
export async function saveStaffRole(id: string, role: "editor" | "viewer"): Promise<void> {
  auth.setPerms(id, { consoleRole: role });
  if (isLive()) { try { await fb.saveStaff(id, { consoleRole: role }); } catch { /* demo already saved */ } }
}

/** Grant/revoke dashboard access (dual-written in Live Mode). */
export async function saveStaffAccess(id: string, access: boolean): Promise<void> {
  auth.setPerms(id, { consoleAccess: access });
  if (isLive()) { try { await fb.saveStaff(id, { consoleAccess: access }); } catch { /* demo already saved */ } }
}

/** Invite a new member (dual-written in Live Mode). Returns the created record or null. */
export async function inviteStaff(input: { name: string; username: string; password: string; role: "editor" | "viewer"; specialty: string }): Promise<StaffRecord | null> {
  const res = auth.addMember({
    name: input.name, username: input.username, password: input.password,
    role: "doctor", specialty: input.specialty, consoleAccess: true, consoleRole: input.role,
  });
  if (!res.ok || !res.user) return null;
  if (isLive()) {
    try {
      await fb.addStaff({
        id: res.user.id, name: res.user.name, role: "doctor", username: res.user.username,
        specialty: res.user.specialty, hue: res.user.hue, active: true,
        consoleAccess: true, consoleRole: input.role, createdAt: res.user.createdAt,
      });
    } catch { /* demo already saved */ }
  }
  return fromStudio(res.user);
}

/** Seed the founder superadmin document into Firestore (admin_users / root). */
export async function seedFounder(): Promise<boolean> {
  return fb.seedFounder();
}

/* --------------------------------- activity --------------------------------- */

export interface ActivityRecord {
  id: string; actor: string; kind: string; action: string; target?: string; at: string;
}

const ACTIVITY_KEY = "vaidyagan_activity_v1";

/** Load the audit trail. Live Mode prefers Firestore, falling back to the demo log. */
export async function loadActivity(): Promise<ActivityRecord[]> {
  if (isLive()) {
    try {
      const live = await fb.listActivity();
      if (live.length > 0) return live;
    } catch { /* fall through to demo */ }
  }
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as ActivityRecord[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Write an audit entry (dual-written in Live Mode). */
export async function logActivity(actor: string, kind: string, action: string, target?: string): Promise<void> {
  if (isLive()) { try { await fb.logActivity(actor, kind, action, target); } catch { /* demo still records via lib */ } }
}
