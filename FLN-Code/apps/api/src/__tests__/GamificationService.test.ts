import { GamificationService } from '../services/GamificationService';

describe('GamificationService.calculateStars', () => {
  test('0% correct should earn 1 completion star', () => {
    expect(GamificationService.calculateStars(5, 0)).toBe(1);
  });

  test('0 questions attempted should earn 0 stars', () => {
    expect(GamificationService.calculateStars(0, 0)).toBe(0);
  });

  test('Less than 70% correct should earn 1 star', () => {
    expect(GamificationService.calculateStars(5, 2)).toBe(1); // 40%
    expect(GamificationService.calculateStars(10, 6)).toBe(1); // 60%
  });

  test('Between 70% and 90% correct should earn 2 stars', () => {
    expect(GamificationService.calculateStars(10, 7)).toBe(2); // 70%
    expect(GamificationService.calculateStars(10, 8.5)).toBe(2); // 85%
  });

  test('90% or greater correct should earn 3 stars', () => {
    expect(GamificationService.calculateStars(10, 9)).toBe(3); // 90%
    expect(GamificationService.calculateStars(5, 5)).toBe(3); // 100%
  });
});

describe('GamificationService.calculateCoins', () => {
  test('Correct answers award 10 coins and hints deduct 2 coins', () => {
    // 3 correct (30 coins), 1 hint (-2 coins), 2 stars (no bonus)
    expect(GamificationService.calculateCoins(3, 1, 2)).toBe(28);
  });

  test('3 star lesson awards bonus 50 coins', () => {
    // 5 correct (50 coins), 0 hints, 3 stars (+50 coins bonus)
    expect(GamificationService.calculateCoins(5, 0, 3)).toBe(100);
  });

  test('Negative coins are capped at 0', () => {
    // 0 correct, 5 hints used
    expect(GamificationService.calculateCoins(0, 5, 0)).toBe(0);
  });
});
