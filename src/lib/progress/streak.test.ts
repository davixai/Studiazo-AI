import { describe, expect, it } from "vitest";
import { summarizeLearning } from "./streak";

const TODAY = "2026-10-27"; // marți, după schimbarea orei din 25 octombrie

const days = (...entries: Array<[string, number]>) => entries.map(([date, minutes]) => ({ date, minutes }));

describe("streak și timp de învățare", () => {
  it("cont nou: totul zero, nicio insignă", () => {
    const s = summarizeLearning([], TODAY);
    expect(s.currentStreak).toBe(0);
    expect(s.bestStreak).toBe(0);
    expect(s.weekMinutes).toBe(0);
    expect(s.activeToday).toBe(false);
    expect(s.badges.every((b) => !b.unlocked)).toBe(true);
    expect(s.nextBadge).toBe(3);
  });

  it("numără zilele consecutive peste schimbarea orei", () => {
    const s = summarizeLearning(
      days(["2026-10-24", 20], ["2026-10-25", 15], ["2026-10-26", 30], ["2026-10-27", 10]),
      TODAY,
    );
    expect(s.currentStreak).toBe(4);
    expect(s.activeToday).toBe(true);
    expect(s.badges.find((b) => b.days === 3)?.unlocked).toBe(true);
    expect(s.nextBadge).toBe(7);
  });

  it("dacă azi încă nu s-a învățat, streak-ul de ieri rămâne viu", () => {
    const s = summarizeLearning(days(["2026-10-25", 15], ["2026-10-26", 30]), TODAY);
    expect(s.activeToday).toBe(false);
    expect(s.currentStreak).toBe(2);
  });

  it("o zi lipsă rupe streak-ul, dar recordul rămâne", () => {
    const s = summarizeLearning(
      days(["2026-10-10", 5], ["2026-10-11", 5], ["2026-10-12", 5], ["2026-10-13", 5], ["2026-10-25", 10], ["2026-10-27", 10]),
      TODAY,
    );
    expect(s.currentStreak).toBe(1);
    expect(s.bestStreak).toBe(4);
    expect(s.badges.find((b) => b.days === 3)?.unlocked).toBe(true);
  });

  it("adună minutele pe zi și afișează ultimele 7 zile", () => {
    const s = summarizeLearning(days(["2026-10-27", 10], ["2026-10-27", 15], ["2026-10-21", 40], ["2026-10-20", 99]), TODAY);
    expect(s.last7Days.map((d) => d.date)).toEqual([
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
      "2026-10-26",
      "2026-10-27",
    ]);
    expect(s.last7Days[6].minutes).toBe(25);
    expect(s.weekMinutes).toBe(65); // 20 octombrie e în afara ultimelor 7 zile
  });

  it("un test fără durată cunoscută contează ca zi activă", () => {
    const s = summarizeLearning(days(["2026-10-27", 0]), TODAY);
    expect(s.activeToday).toBe(true);
    expect(s.currentStreak).toBe(1);
  });
});
