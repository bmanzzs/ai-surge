import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Typed helpers — add query functions here as the backend comes online.
 *
 * Example (not wired to the UI yet):
 *
 *   export async function fetchStoriesByPeriod(period) {
 *     const { data, error } = await supabase
 *       .from('stories')
 *       .select('*')
 *       .eq('period', period)
 *       .order('created_at', { ascending: false })
 *     if (error) throw error
 *     return data
 *   }
 *
 *   export async function incrementReaction(storyId, emojiType) {
 *     const { error } = await supabase.rpc('increment_reaction', {
 *       p_story_id: storyId,
 *       p_emoji_type: emojiType,
 *     })
 *     if (error) throw error
 *   }
 */
