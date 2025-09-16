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

    // Get all knowledge base content for better context
    const { data: knowledgeContent } = await supabase
      .from('knowledge_base')
      .select('content, page_title, summary, section')
      .eq('language', language);

    // Get recent conversation history
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('content, role')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Find contact information specifically
    const contactInfo = knowledgeContent?.find(kb => kb.section === 'contact');
    const conversationSchema = knowledgeContent?.find(kb => kb.section === 'conversation-schema');
    const projectTypes = knowledgeContent?.find(kb => kb.section === 'project-types');

    // Prepare context for AI
    const systemPrompt = language === 'es' 
      ? `Eres un asistente de IA especializado de WM Management. Tu misión es ayudar a los usuarios con sus proyectos inmobiliarios siguiendo el esquema de conversación estructurado.

INFORMACIÓN DE CONTACTO ESPECÍFICA:
${contactInfo ? contactInfo.content : 'Teléfono: +1 (555) 123-4567, Email: info@wmmanagement.com'}

ESQUEMA DE CONVERSACIÓN:
${conversationSchema ? conversationSchema.content : 'Preguntar sobre tipo de proyecto y proponer servicios relevantes'}

TIPOS DE PROYECTOS QUE MANEJAMOS:
${projectTypes ? projectTypes.content.substring(0, 1000) : 'Inversión residencial, comercial, financiamiento, gestión de propiedades'}

TODA LA INFORMACIÓN DISPONIBLE:
${knowledgeContent?.map(kb => `--- ${kb.page_title} ---\n${kb.content}`).join('\n\n') || 'Información limitada disponible'}

INSTRUCCIONES IMPORTANTES:
1. Cuando pregunten sobre contacto, proporciona SIEMPRE la información específica: teléfono, email, horarios
2. Pregunta proactivamente sobre el tipo de proyecto del usuario
3. Sugiere servicios específicos de WM Management según el proyecto
4. Ofrece próximos pasos concretos (herramientas, consultas)
5. Mantén un tono profesional y amigable
6. Responde en español`
      : `You are a specialized AI assistant for WM Management. Your mission is to help users with their real estate projects following the structured conversation schema.

SPECIFIC CONTACT INFORMATION:
${contactInfo ? contactInfo.content : 'Phone: +1 (555) 123-4567, Email: info@wmmanagement.com'}

CONVERSATION SCHEMA:
${conversationSchema ? conversationSchema.content : 'Ask about project type and propose relevant services'}

PROJECT TYPES WE HANDLE:
${projectTypes ? projectTypes.content.substring(0, 1000) : 'Residential investment, commercial, financing, property management'}

ALL AVAILABLE INFORMATION:
${knowledgeContent?.map(kb => `--- ${kb.page_title} ---\n${kb.content}`).join('\n\n') || 'Limited information available'}

IMPORTANT INSTRUCTIONS:
1. When asked about contact, ALWAYS provide specific information: phone, email, hours
2. Proactively ask about the user's project type
3. Suggest specific WM Management services based on the project
4. Offer concrete next steps (tools, consultations)
5. Maintain a professional and friendly tone
6. Respond in English`;

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