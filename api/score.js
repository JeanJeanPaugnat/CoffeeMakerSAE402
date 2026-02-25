import { Redis } from '@upstash/redis'

export default async function handler(req, res) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.REDIS_URL;
        const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN;

        if (!redisUrl || !redisToken) {
            console.error('Missing Redis environment variables');
            return res.status(500).json({ error: 'Database configuration missing' });
        }

        const { username, score, ordersCompleted, bestStreak } = req.body;

        // Validation
        if (!username || typeof username !== 'string' || username.trim().length === 0) {
            return res.status(400).json({ error: 'Username is required' });
        }
        if (typeof score !== 'number' || score < 0) {
            return res.status(400).json({ error: 'Invalid score' });
        }

        const cleanUsername = username.trim().substring(0, 20); // Max 20 chars

        const redis = new Redis({
            url: redisUrl,
            token: redisToken,
        });

        // Get current best score for this player
        const currentBest = await redis.zscore('leaderboard', cleanUsername);

        // Only update if new score is higher (or no previous score)
        if (currentBest === null || score > Number(currentBest)) {
            // Update score in sorted set
            await redis.zadd('leaderboard', { score, member: cleanUsername });

            // Store player details in hash
            await redis.hset(`player:${cleanUsername}`, {
                ordersCompleted: ordersCompleted || 0,
                bestStreak: bestStreak || 0,
                timestamp: Date.now(),
            });
        }

        // Get player's current rank
        const rank = await redis.zrevrank('leaderboard', cleanUsername);

        res.setHeader('Access-Control-Allow-Origin', '*');

        return res.status(200).json({
            success: true,
            rank: rank !== null ? rank + 1 : null,
            bestScore: currentBest !== null ? Math.max(score, Number(currentBest)) : score,
        });
    } catch (error) {
        console.error('Score submission error:', error);
        return res.status(500).json({ error: 'Failed to submit score' });
    }
}
