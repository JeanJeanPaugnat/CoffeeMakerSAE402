import { Redis } from '@upstash/redis'

export default async function handler(req, res) {
    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.REDIS_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN;

    if (!redisUrl || !redisToken) {
        console.error('Missing Redis environment variables (checked UPSTASH_REST, KV_REST, and REDIS)');
        return res.status(500).json({ error: 'Database configuration missing. Please check Vercel environment variables.' });
    }

    try {
        const redis = new Redis({
            url: redisUrl,
            token: redisToken,
        });

        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        // Get top scores from sorted set (descending)
        const topPlayers = await redis.zrange('leaderboard', 0, limit - 1, { rev: true, withScores: true });

        // topPlayers is [member, score, member, score, ...]
        // Build the response array
        const results = [];
        for (let i = 0; i < topPlayers.length; i += 2) {
            const username = topPlayers[i];
            const score = topPlayers[i + 1];

            // Get player details from hash
            const details = await redis.hgetall(`player:${username}`);

            results.push({
                rank: Math.floor(i / 2) + 1,
                username,
                score: Number(score),
                ordersCompleted: details?.ordersCompleted || 0,
                bestStreak: details?.bestStreak || 0,
                timestamp: details?.timestamp || 0,
            });
        }

        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');

        return res.status(200).json({ leaderboard: results });
    } catch (error) {
        console.error('Leaderboard error:', error);
        return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
}
