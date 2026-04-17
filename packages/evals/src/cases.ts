import { evalCaseSchema, footer, type EvalCase } from "@betcopilot/core-schemas";

const createCase = (value: Omit<EvalCase, "footer">): EvalCase =>
  evalCaseSchema.parse({
    ...value,
    footer
  });

export const SYNTHETIC_EVAL_CASES: EvalCase[] = [
  createCase({ caseId: "eval_001", difficulty: "easy", input: { rawText: "Lakers moneyline tonight", sourceType: "raw_text" }, expectedCandidates: [{ team: "Los Angeles Lakers", marketType: "moneyline", selection: "Los Angeles Lakers" }] }),
  createCase({ caseId: "eval_002", difficulty: "easy", input: { rawText: "Celtics -4.5 vs Heat", sourceType: "chat_text" }, expectedCandidates: [{ team: "Boston Celtics", opponent: "Miami Heat", marketType: "point_spread", line: -4.5, selection: "Boston Celtics" }] }),
  createCase({ caseId: "eval_003", difficulty: "easy", input: { rawText: "LeBron over 27.5 points", sourceType: "chat_text" }, expectedCandidates: [{ player: "LeBron James", marketType: "player_points_over", line: 27.5, betSide: "over" }] }),
  createCase({ caseId: "eval_004", difficulty: "easy", input: { rawText: "Mahomes over 2.5 passing touchdowns", sourceType: "chat_text" }, expectedCandidates: [{ player: "Patrick Mahomes", marketType: "player_passing_touchdowns_over", line: 2.5, betSide: "over" }] }),
  createCase({ caseId: "eval_005", difficulty: "easy", input: { rawText: "Arsenal to win and both teams to score", sourceType: "social_post" }, expectedCandidates: [{ team: "Arsenal", marketType: "moneyline", selection: "Arsenal" }, { marketType: "both_teams_to_score", selection: "Yes", betSide: "yes" }] }),
  createCase({ caseId: "eval_006", difficulty: "medium", input: { rawText: "Take Real Madrid ML from the article below", sourceType: "article_text" }, expectedCandidates: [{ team: "Real Madrid", marketType: "moneyline", selection: "Real Madrid" }] }),
  createCase({ caseId: "eval_007", difficulty: "medium", input: { rawText: "Warriors +4.5 at Lakers", sourceType: "chat_text" }, expectedCandidates: [{ team: "Golden State Warriors", opponent: "Los Angeles Lakers", marketType: "point_spread", line: 4.5 }] }),
  createCase({ caseId: "eval_008", difficulty: "medium", input: { rawText: "Chelsea BTTS no lean", sourceType: "social_post" }, expectedCandidates: [{ team: "Chelsea", marketType: "both_teams_to_score", selection: "No", betSide: "no" }] }),
  createCase({ caseId: "eval_009", difficulty: "medium", input: { rawText: "Jayson Tatum over 29.5 points vs Heat", sourceType: "raw_text" }, expectedCandidates: [{ player: "Jayson Tatum", opponent: "Miami Heat", marketType: "player_points_over", line: 29.5 }] }),
  createCase({ caseId: "eval_010", difficulty: "medium", input: { rawText: "Chiefs ML", sourceType: "raw_text" }, expectedCandidates: [{ team: "Kansas City Chiefs", marketType: "moneyline", selection: "Kansas City Chiefs" }] }),
  createCase({ caseId: "eval_011", difficulty: "ambiguous", input: { rawText: "LeBron over points", sourceType: "chat_text" }, expectedCandidates: [{ player: "LeBron James" }] }),
  createCase({ caseId: "eval_012", difficulty: "ambiguous", input: { rawText: "Arsenal to win", sourceType: "chat_text" }, expectedCandidates: [{ team: "Arsenal", marketType: "moneyline" }] }),
  createCase({ caseId: "eval_013", difficulty: "ambiguous", input: { rawText: "Real Madrid", sourceType: "chat_text" }, expectedCandidates: [{ team: "Real Madrid" }] }),
  createCase({ caseId: "eval_014", difficulty: "multi_bet", input: { rawText: "LeBron over 27.5 points and Lakers moneyline tonight", sourceType: "chat_text" }, expectedCandidates: [{ player: "LeBron James", marketType: "player_points_over", line: 27.5 }, { team: "Los Angeles Lakers", marketType: "moneyline" }] }),
  createCase({ caseId: "eval_015", difficulty: "multi_bet", input: { rawText: "Celtics -4.5 and Tatum over 29.5 points", sourceType: "chat_text" }, expectedCandidates: [{ team: "Boston Celtics", marketType: "point_spread", line: -4.5 }, { player: "Jayson Tatum", marketType: "player_points_over", line: 29.5 }] }),
  createCase({ caseId: "eval_016", difficulty: "multi_bet", input: { rawText: "Mahomes over 2.5 passing touchdowns and Chiefs ML", sourceType: "chat_text" }, expectedCandidates: [{ player: "Patrick Mahomes", marketType: "player_passing_touchdowns_over", line: 2.5 }, { team: "Kansas City Chiefs", marketType: "moneyline" }] }),
  createCase({ caseId: "eval_017", difficulty: "multi_bet", input: { rawText: "Arsenal to win and BTTS yes", sourceType: "social_post" }, expectedCandidates: [{ team: "Arsenal", marketType: "moneyline" }, { marketType: "both_teams_to_score", selection: "Yes", betSide: "yes" }] }),
  createCase({ caseId: "eval_018", difficulty: "noisy", input: { rawText: "idk man but Lakers ml feels nice + maybe bron o27.5 pts", sourceType: "social_post" }, expectedCandidates: [{ team: "Los Angeles Lakers", marketType: "moneyline" }, { player: "LeBron James", marketType: "player_points_over", line: 27.5 }] }),
  createCase({ caseId: "eval_019", difficulty: "noisy", input: { rawText: "Celtics -4.5... unless books moved. still like it.", sourceType: "chat_text" }, expectedCandidates: [{ team: "Boston Celtics", marketType: "point_spread", line: -4.5 }] }),
  createCase({ caseId: "eval_020", difficulty: "noisy", input: { rawText: "Mahomes o2.5 tds in this spot", sourceType: "chat_text" }, expectedCandidates: [{ player: "Patrick Mahomes", marketType: "player_passing_touchdowns_over", line: 2.5 }] }),
  createCase({ caseId: "eval_021", difficulty: "easy", input: { rawText: "Barcelona moneyline", sourceType: "raw_text" }, expectedCandidates: [{ team: "Barcelona", marketType: "moneyline" }] }),
  createCase({ caseId: "eval_022", difficulty: "medium", input: { rawText: "Heat +4.5 at Boston", sourceType: "chat_text" }, expectedCandidates: [{ team: "Miami Heat", opponent: "Boston Celtics", marketType: "point_spread", line: 4.5 }] }),
  createCase({ caseId: "eval_023", difficulty: "medium", input: { rawText: "LeBron over 27.5 points vs Warriors -110", sourceType: "chat_text" }, expectedCandidates: [{ player: "LeBron James", opponent: "Golden State Warriors", marketType: "player_points_over", line: 27.5 }] }),
  createCase({ caseId: "eval_024", difficulty: "ambiguous", input: { rawText: "Both teams to score", sourceType: "chat_text" }, expectedCandidates: [{ marketType: "both_teams_to_score", selection: "Yes" }] }),
  createCase({ caseId: "eval_025", difficulty: "noisy", input: { rawText: "Take Real Madrid ML, article vibes only, maybe Barca game", sourceType: "article_text" }, expectedCandidates: [{ team: "Real Madrid", marketType: "moneyline" }] })
];
