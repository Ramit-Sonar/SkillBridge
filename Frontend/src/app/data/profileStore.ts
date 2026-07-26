// Lightweight reactive profile store with no external state library.
// Settings writes here; profile views read from here.

import type { StudentCertificate } from "../../services/studentProfileService";

export interface ProfileData {
  name: string;
  bio: string;
  education: string;
  university: string;
  skills: string[];
  verifiedSkills: string[];
  github: string;
  linkedin: string;
  portfolio: string;
  certificates: StudentCertificate[];
}

const DEFAULT: ProfileData = {
  name: "",
  bio: "",
  education: "",
  university: "",
  skills: [],
  verifiedSkills: [],
  github: "",
  linkedin: "",
  portfolio: "",
  certificates: [],
};

let _data: ProfileData = { ...DEFAULT };
const _listeners = new Set<() => void>();

export function getProfile(): ProfileData {
  return _data;
}

export function setProfile(partial: Partial<ProfileData>) {
  // Keep settings and profile preview synchronized without a global state library.
  _data = { ..._data, ...partial };
  _listeners.forEach((fn) => fn());
}

export function subscribeProfile(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
