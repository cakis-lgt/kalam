const AVATAR_COLORS = [
  "#156c84",
  "#0e7c66",
  "#7c3aed",
  "#0369a1",
  "#b45309",
  "#be123c",
];

export function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function avatarColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function warningColor(count: number): string {
  if (count >= 5) return "#dc2626";
  if (count >= 2) return "#ca8a04";
  return "#16a34a";
}
