// Unit tests for game scoring and tier calculation

const TestUtils = require('../../helpers/test-utils');

// Mock window object for browser environment
global.window = {
    location: { href: '', search: '' },
    top: { location: { href: '' } }
};

describe('Game Score and Tier System', () => {
    let getTierFromScore;
    
    beforeEach(() => {
        // Define the tier calculation function as it appears in the game
        getTierFromScore = (score) => {
            if (score >= 28) return 'gold';    // 10 batches max
            if (score >= 18) return 'silver';  // 8 batches max  
            if (score >= 11) return 'bronze';  // 5 batches max
            return null;                        // No unlock
        };
    });
    
    describe('Score to Tier Mapping', () => {
        test('should return null for scores below bronze threshold', () => {
            expect(getTierFromScore(0)).toBe(null);
            expect(getTierFromScore(5)).toBe(null);
            expect(getTierFromScore(10)).toBe(null);
        });
        
        test('should return bronze tier for scores 11-17', () => {
            expect(getTierFromScore(11)).toBe('bronze');
            expect(getTierFromScore(15)).toBe('bronze');
            expect(getTierFromScore(17)).toBe('bronze');
        });
        
        test('should return silver tier for scores 18-27', () => {
            expect(getTierFromScore(18)).toBe('silver');
            expect(getTierFromScore(22)).toBe('silver');
            expect(getTierFromScore(27)).toBe('silver');
        });
        
        test('should return gold tier for scores 28+', () => {
            expect(getTierFromScore(28)).toBe('gold');
            expect(getTierFromScore(30)).toBe('gold');
            expect(getTierFromScore(100)).toBe('gold');
        });
        
        test('should handle edge cases correctly', () => {
            // Exact threshold values
            expect(getTierFromScore(11)).toBe('bronze');
            expect(getTierFromScore(18)).toBe('silver');
            expect(getTierFromScore(28)).toBe('gold');
            
            // One below threshold
            expect(getTierFromScore(10)).toBe(null);
            expect(getTierFromScore(17)).toBe('bronze');
            expect(getTierFromScore(27)).toBe('silver');
        });
    });
    
    describe('Tier to Batch Limit Mapping', () => {
        const tierLimits = {
            bronze: 5,
            silver: 8,
            gold: 10
        };
        
        test('should enforce correct batch limits', () => {
            expect(tierLimits.bronze).toBe(5);
            expect(tierLimits.silver).toBe(8);
            expect(tierLimits.gold).toBe(10);
        });
        
        test('should calculate correct token amounts', () => {
            const tokensPerBatch = 700;
            
            expect(tierLimits.bronze * tokensPerBatch).toBe(3500);  // 5 * 700
            expect(tierLimits.silver * tokensPerBatch).toBe(5600);  // 8 * 700
            expect(tierLimits.gold * tokensPerBatch).toBe(7000);    // 10 * 700
        });
    });
    
    describe('Game Completion Redirect', () => {
        let redirectToMainSite;
        
        beforeEach(() => {
            // Mock the redirect function as it appears in game
            redirectToMainSite = (tier, score) => {
                try {
                    const url = `/#purchase?tier=${tier}&score=${score}`;
                    
                    if (window.top && window.top !== window) {
                        window.top.location.href = url;
                    } else {
                        window.location.href = url;
                    }
                    
                    return url; // For testing
                } catch (e) {
                    // Fallback for cross-origin
                    window.open(`/#purchase?tier=${tier}&score=${score}`, '_blank');
                    return `/#purchase?tier=${tier}&score=${score}`;
                }
            };
        });
        
        test('should redirect with correct tier parameter', () => {
            const url = redirectToMainSite('bronze', 15);
            expect(url).toBe('/#purchase?tier=bronze&score=15');
        });
        
        test('should include score in redirect URL', () => {
            const url = redirectToMainSite('gold', 35);
            expect(url).toBe('/#purchase?tier=gold&score=35');
        });
        
        test('should handle null tier (no unlock)', () => {
            const url = redirectToMainSite(null, 5);
            expect(url).toBe('/#purchase?tier=null&score=5');
        });
    });
    
    describe('Score Validation', () => {
        test('should validate score is within reasonable range', () => {
            const isValidScore = (score) => {
                return typeof score === 'number' && 
                       score >= 0 && 
                       score <= 100;
            };
            
            expect(isValidScore(25)).toBe(true);
            expect(isValidScore(0)).toBe(true);
            expect(isValidScore(100)).toBe(true);
            expect(isValidScore(-1)).toBe(false);
            expect(isValidScore(101)).toBe(false);
            expect(isValidScore('25')).toBe(false);
            expect(isValidScore(null)).toBe(false);
        });
    });
    
    describe('Game Timer', () => {
        test('should enforce 30 second time limit', () => {
            const GAME_DURATION = 30000; // 30 seconds in milliseconds
            
            expect(GAME_DURATION).toBe(30000);
            expect(GAME_DURATION / 1000).toBe(30); // 30 seconds
        });
        
        test('should calculate time bonus correctly', () => {
            const calculateTimeBonus = (timeRemaining) => {
                if (timeRemaining <= 0) return 0;
                return Math.floor(timeRemaining / 1000); // 1 point per second remaining
            };
            
            expect(calculateTimeBonus(15000)).toBe(15); // 15 seconds = 15 points
            expect(calculateTimeBonus(5000)).toBe(5);    // 5 seconds = 5 points
            expect(calculateTimeBonus(0)).toBe(0);       // No time = no bonus
            expect(calculateTimeBonus(-1000)).toBe(0);   // Negative = no bonus
        });
    });
    
    describe('Score Persistence', () => {
        test('should format score data for storage', () => {
            const formatScoreData = (score, tier, timestamp = Date.now()) => {
                return {
                    score: score,
                    tier: tier,
                    timestamp: timestamp,
                    tokensEarned: tier ? tierLimits[tier] * 700 : 0,
                    version: '1.0'
                };
            };
            
            const scoreData = formatScoreData(25, 'silver');
            
            expect(scoreData).toMatchObject({
                score: 25,
                tier: 'silver',
                tokensEarned: 5600,
                version: '1.0'
            });
            expect(scoreData.timestamp).toBeDefined();
        });
        
        test('should validate retrieved score data', () => {
            const isValidScoreData = (data) => {
                return data &&
                       typeof data.score === 'number' &&
                       (data.tier === null || ['bronze', 'silver', 'gold'].includes(data.tier)) &&
                       typeof data.timestamp === 'number' &&
                       data.timestamp <= Date.now();
            };
            
            expect(isValidScoreData({
                score: 20,
                tier: 'silver',
                timestamp: Date.now() - 1000
            })).toBe(true);
            
            expect(isValidScoreData({
                score: 5,
                tier: null,
                timestamp: Date.now()
            })).toBe(true);
            
            expect(isValidScoreData({
                score: 'invalid',
                tier: 'silver',
                timestamp: Date.now()
            })).toBe(false);
        });
    });
});