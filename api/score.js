import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase environment variables');
            return res.status(500).json({ error: 'Database configuration missing' });
        }

        const { username, score, ordersCompleted, bestStreak } = req.body;

        if (!username || typeof username !== 'string' || username.trim().length === 0) {
            return res.status(400).json({ error: 'Username is required' });
        }
        if (typeof score !== 'number' || score < 0) {
            return res.status(400).json({ error: 'Invalid score' });
        }

        const cleanUsername = username.trim().substring(0, 20); // Max 20 chars

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get player's current score
        const { data: existingPlayer, error: fetchError } = await supabase
            .from('leaderboard')
            .select('score')
            .eq('username', cleanUsername)
            .single();

        // fetchError will be thrown if no rows are returned (.single() requires 1 row)
        // We can safely ignore it if it's "PGRST116" (Results contain 0 rows)
        const isNewPlayer = !existingPlayer || (fetchError && fetchError.code === 'PGRST116');

        let finalScore = score;

        if (isNewPlayer || score > existingPlayer.score) {
            // Upsert the new score
            const { error: upsertError } = await supabase
                .from('leaderboard')
                .upsert({
                    username: cleanUsername,
                    score: score,
                    orders_completed: ordersCompleted || 0,
                    best_streak: bestStreak || 0,
                }, { onConflict: 'username' });

            if (upsertError) throw upsertError;
        } else {
            finalScore = existingPlayer.score;
        }

        // Calculate rank by counting players with a strictly higher score
        const { count, error: countError } = await supabase
            .from('leaderboard')
            .select('*', { count: 'exact', head: true })
            .gt('score', finalScore);

        if (countError) throw countError;

        res.setHeader('Access-Control-Allow-Origin', '*');

        return res.status(200).json({
            success: true,
            rank: count !== null ? count + 1 : null,
            bestScore: finalScore,
        });
    } catch (error) {
        console.error('Score submission error:', error);
        return res.status(500).json({ error: 'Failed to submit score' });
    }
}
