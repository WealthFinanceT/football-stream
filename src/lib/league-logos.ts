const leagueLogoMap: Record<string, string> = {
  "premier league": "/leagues/premier-league.svg",
  "la liga": "/leagues/laliga.svg",
  "laliga": "/leagues/laliga.svg",
  bundesliga: "/leagues/bundesliga.svg",
  "serie a": "/leagues/serie-a.svg",
  "ligue 1": "/leagues/ligue-1.svg",
  "uefa champions league": "/leagues/champions-league.svg",
  "champions league": "/leagues/champions-league.svg",
  ucl: "/leagues/champions-league.svg",
};

function normalizeLeagueName(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

export function getLeagueLogo(competition?: string): string | undefined {
  return leagueLogoMap[normalizeLeagueName(competition)];
}
