import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, language = 'en' } = await req.json();
    
    if (!message || !sessionId) {
      throw new Error('Message and sessionId are required');
    }

    console.log('Processing message:', message, 'for session:', sessionId);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (!conversation) {
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          session_id: sessionId,
          language: language
        })
        .select()
        .single();

      if (error) throw error;
      conversation = newConversation;
    }

    // Save user message
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      content: message,
      role: 'user'
    });

    // Get relevant knowledge base content
    const { data: knowledgeContent } = await supabase
      .from('knowledge_base')
      .select('content, page_title, summary')
      .eq('language', language)
      .limit(3);

    // Get recent conversation history
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('content, role')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Prepare context for AI
    const systemPrompt = language === 'es' 
      ? `Eres Builder, un asistente de IA inmobiliario especializado. Solo puedes responder basándote en la información de WM Management proporcionada. Mantén respuestas concisas y profesionales. Si no tienes información específica, sugiere contactar directamente con WM Management.

Información disponible:
${knowledgeContent?.map(kb => `${kb.page_title}: ${kb.summary || kb.content.substring(0, 200)}`).join('\n') || 'Información limitada disponible'}

Responde en español y mantén un tono profesional y amigable.`
      : `You are Builder, a specialized real estate AI assistant. You can only respond based on the provided WM Management information. Keep responses concise and professional. If you don't have specific information, suggest contacting WM Management directly.

Available information:
${knowledgeContent?.map(kb => `${kb.page_title}: ${kb.summary || kb.content.substring(0, 200)}`).join('\n') || 'Limited information available'}

Respond in English with a professional and friendly tone.`;

    // Prepare conversation history
    const conversationHistory = recentMessages?.reverse().map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })) || [];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-6), // Last 6 messages for context
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Save AI response
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      content: aiResponse,
      role: 'assistant'
    });

    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      conversationId: conversation.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chatbot function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});