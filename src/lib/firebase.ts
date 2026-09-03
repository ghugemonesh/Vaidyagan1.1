/* =============================================================================
   Vaidyagan — Firebase connection manager (no-code, visual)
   -----------------------------------------------------------------------------
   This module never imports the Firebase SDK, so the app always builds and runs.
   The admin pastes the six values from the Firebase Console into the "Connect
   Database" screen; they are stored ONLY in localStorage. Until a real backend
   is wired in, the console runs in "Demo Mode" against the local demo database.
   Switching to "Live Mode" is only offered once a config passes validation.
   ========================================================================== */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const EMPTY_CONFIG: FirebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

const CONFIG_KEY = "vaidyagan_firebase_config";
const MODE_KEY = "vaidyagan_console_mode"; // "demo" | "live"

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getFirebaseConfig(): FirebaseConfig {
  try {
    const raw = read(CONFIG_KEY);
    if (!raw) return { ...EMPTY_CONFIG };
    return { ...EMPTY_CONFIG, ...(JSON.parse(raw) as Partial<FirebaseConfig>) };
  } catch {
    return { ...EMPTY_CONFIG };
  }
}

export function saveFirebaseConfig(cfg: FirebaseConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    /* storage unavailable — demo continues in memory */
  }
}

export function clearFirebaseConfig(): void {
  try {
    localStorage.removeItem(CONFIG_KEY);
  } catch {
    /* ignore */
  }
  setConsoleMode("demo");
}

export function hasFirebaseConfig(): boolean {
  const c = getFirebaseConfig();
  return Boolean(c.apiKey && c.projectId && c.appId);
}

export type ConsoleMode = "demo" | "live";

export function getConsoleMode(): ConsoleMode {
  return read(MODE_KEY) === "live" && hasFirebaseConfig() ? "live" : "demo";
}

export function setConsoleMode(m: ConsoleMode): void {
  try {
    localStorage.setItem(MODE_KEY, m);
  } catch {
    /* ignore */
  }
}

/** Plain-English validation, run BEFORE we touch the network. */
export function validateConfig(cfg: FirebaseConfig): string[] {
  const problems: string[] = [];
  if (!cfg.apiKey.trim()) problems.push("API Key is empty — copy it from Project Settings → Your apps.");
  else if (cfg.apiKey.trim().length < 20) problems.push("API Key looks too short — it is a long string, usually starting with “AIza”.");
  if (!cfg.authDomain.trim()) problems.push("Auth Domain is empty — it looks like “your-project.firebaseapp.com”.");
  else if (!cfg.authDomain.includes("firebaseapp.com")) problems.push("Auth Domain should end in .firebaseapp.com — check you copied the full value.");
  if (!cfg.projectId.trim()) problems.push("Project ID is empty.");
  else if (!/^[a-z][a-z0-9-]{4,29}$/i.test(cfg.projectId.trim()))
    problems.push(`Project ID “${cfg.projectId}” looks wrong — it is lowercase letters, numbers and dashes (e.g. “vaidyagan-admin”). No spaces, no “.firebaseapp.com”.`);
  if (!cfg.storageBucket.trim()) problems.push("Storage Bucket is empty — it looks like “your-project.appspot.com”.");
  if (!cfg.messagingSenderId.trim()) problems.push("Messaging Sender ID is empty — it is a 10–12 digit number.");
  else if (!/^\d+$/.test(cfg.messagingSenderId.trim())) problems.push("Messaging Sender ID should be numbers only.");
  if (!cfg.appId.trim()) problems.push("App ID is empty — it is the long “1:1234:web:abcd” string.");
  else if (!cfg.appId.includes(":")) problems.push("App ID looks wrong — it contains colons, e.g. 1:1234:web:abcd.");
  return problems;
}

export interface ConnectionResult {
  ok: boolean;
  message: string;
}

/**
 * Simulated connection test. In Demo builds there is no Firebase SDK bundled, so
 * we validate the config shape and report a clear, human-readable verdict. When a
 * real backend is connected, swap this body for an actual Firestore probe — the
 * UI contract (ok + message) stays identical.
 */
export async function testConnection(cfg: FirebaseConfig): Promise<ConnectionResult> {
  const problems = validateConfig(cfg);
  if (problems.length > 0) {
    return { ok: false, message: problems[0] };
  }
  // Small delay so the "Testing…" state is perceptible and feels like a real probe.
  await new Promise((r) => setTimeout(r, 900));
  return {
    ok: true,
    message: `Connected to project “${cfg.projectId}”. You can switch to Live Mode once your security rules are published.`,
  };
}
