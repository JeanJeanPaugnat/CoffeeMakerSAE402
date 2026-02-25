import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase environment variables');
        return res.status(500).json({ error: 'Database configuration missing. Please check Vercel environment variables.' });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const { data, error } = await supabase
            .from('leaderboard')
            .select('*')
            .order('score', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        const results = data.map((player, index) => ({
            rank: index + 1,
            username: player.username,
            score: player.score,
            ordersCompleted: player.orders_completed || 0,
            bestStreak: player.best_streak || 0,
            timestamp: new Date(player.created_at).getTime() || 0,
        }));

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');

        return res.status(200).json({ leaderboard: results });
    } catch (error) {
        console.error('Leaderboard error:', error);
        return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
}
