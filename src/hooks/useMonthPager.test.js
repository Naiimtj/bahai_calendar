import { describe, expect, it } from 'vitest';
import { getReleaseVelocity, getPageDirection } from './useMonthPager';

describe('getReleaseVelocity', () => {
  it('returns 0 with fewer than two samples inside the window', () => {
    expect(getReleaseVelocity([{ x: 0, t: 0 }], 50)).toBe(0);
  });

  it('computes px/ms across the window', () => {
    expect(
      getReleaseVelocity(
        [
          { x: 0, t: 0 },
          { x: -20, t: 20 },
          { x: -60, t: 60 },
        ],
        60,
      ),
    ).toBe(-1);
  });

  it('ignores samples older than 100 ms', () => {
    expect(
      getReleaseVelocity(
        [
          { x: 0, t: 0 },
          { x: 100, t: 150 },
          { x: 150, t: 200 },
        ],
        200,
      ),
    ).toBe(1);
  });

  it('returns 0 when the finger rested before release', () => {
    expect(
      getReleaseVelocity(
        [
          { x: 0, t: 0 },
          { x: -80, t: 50 },
          { x: -80, t: 300 },
        ],
        300,
      ),
    ).toBe(0);
  });
});

describe('getPageDirection', () => {
  it('snaps back on a slow short drag', () => {
    expect(getPageDirection(-60, -0.05, 390)).toBe(0);
  });

  it('uses quick short flick direction', () => {
    expect(getPageDirection(-40, -0.6, 390)).toBe(1);
    expect(getPageDirection(40, 0.6, 390)).toBe(-1);
  });

  it('commits a slow drag past half the width', () => {
    expect(getPageDirection(-200, 0, 390)).toBe(1);
    expect(getPageDirection(200, 0, 390)).toBe(-1);
  });

  it('lets flick direction beat release position and allows soft reverse cancel', () => {
    expect(getPageDirection(-60, 0.8, 390)).toBe(-1);
    expect(getPageDirection(-150, 0.3, 390)).toBe(0);
  });

  it('pages forward when a second flick starts during settling with positive offset', () => {
    expect(getPageDirection(30, -0.6, 390)).toBe(1);
  });
});
