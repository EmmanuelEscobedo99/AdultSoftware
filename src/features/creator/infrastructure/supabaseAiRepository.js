import { supabase } from '@/services/supabase/client'

export const supabaseAiRepository = {
  async getMyAgent() {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .maybeSingle()
    if (error) throw error
    return data
  },

  async upsertAgent({
    enabled,
    personality,
    system_prompt,
    max_tokens,
    temperature,
    auto_reply,
    auto_reply_delay_seconds,
    can_sell_ppv,
  }) {
    const { data, error } = await supabase.rpc('upsert_ai_agent', {
      p_enabled: enabled,
      p_personality: personality,
      p_system_prompt: system_prompt,
      p_max_tokens: max_tokens,
      p_temperature: temperature,
      p_auto_reply: auto_reply,
      p_auto_reply_delay_seconds: auto_reply_delay_seconds,
      p_can_sell_ppv: can_sell_ppv,
    })
    if (error) throw error
    return data
  },
}
