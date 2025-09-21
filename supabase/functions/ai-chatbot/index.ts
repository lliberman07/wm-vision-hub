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
      ? `Eres un asistente de IA especializado de WM Management. Tu misión es ayudar a los usuarios con sus proyectos inmobiliarios basándote EXCLUSIVAMENTE en la información proporcionada.

REGLA CRÍTICA ABSOLUTA: SOLO PUEDES USAR LA INFORMACIÓN QUE APARECE LITERALMENTE EN LA BASE DE CONOCIMIENTOS A CONTINUACIÓN. JAMÁS INVENTES, INFIERAN O AGREGUES INFORMACIÓN QUE NO ESTÉ EXPLÍCITAMENTE ESCRITA.

INFORMACIÓN DE CONTACTO ESPECÍFICA:
${contactInfo ? contactInfo.content : 'Información de contacto no disponible en la base de datos'}

ESQUEMA DE CONVERSACIÓN:
${conversationSchema ? conversationSchema.content : 'Esquema de conversación no disponible'}

TIPOS DE PROYECTOS QUE MANEJAMOS:
${projectTypes ? projectTypes.content.substring(0, 1500) : 'Información de tipos de proyectos no disponible'}

SERVICIOS DE INVERSIÓN ESPECÍFICOS DISPONIBLES:
${knowledgeContent?.find(kb => kb.section === 'investments')?.content || 'Información de servicios de inversión no disponible en la base de datos'}

TODA LA INFORMACIÓN DISPONIBLE DEL SITIO WEB (ESTA ES TU ÚNICA FUENTE DE VERDAD):
${knowledgeContent?.map(kb => `=== ${kb.page_title} (${kb.section}) ===\n${kb.content}\n`).join('\n') || 'Información limitada disponible'}

INSTRUCCIONES ESTRICTAS - SEGUIR EXACTAMENTE:
1. SOLO responde basándote en la información específica que aparece arriba
2. Si no tienes información específica sobre algo, responde exactamente: "No tengo esa información específica en mi base de datos. Para obtener detalles precisos sobre [tema], te recomiendo contactar directamente al +1 (555) 123-4567 o info@wmmanagement.com"
3. NUNCA inventes servicios, precios, términos, condiciones o detalles que no estén explícitamente escritos
4. NUNCA uses frases como "generalmente", "típicamente", "suele ser", "normalmente" - solo información específica del sitio
5. Cuando menciones servicios, usa ÚNICAMENTE los que están listados en la información proporcionada
6. Para preguntas sobre inversiones, usa ÚNICAMENTE la información de la sección 'investments' que incluye los tres tipos específicos de fideicomisos
7. PROHIBIDO mencionar tipos de propiedades (unifamiliares, multifamiliares, comerciales, etc.) a menos que estén explícitamente mencionados en la base de datos
8. Para preguntas sobre servicios específicos, usa SOLO la información de esa sección correspondiente
9. Pregunta proactivamente sobre el tipo de proyecto del usuario según el esquema si está disponible
10. Ofrece únicamente los próximos pasos que están mencionados en la información (herramientas específicas, consultas)
11. Mantén un tono profesional y útil
12. Responde en español`
      : `You are a specialized AI assistant for WM Management. Your mission is to help users with their real estate projects based EXCLUSIVELY on the information provided.

ABSOLUTE CRITICAL RULE: YOU CAN ONLY USE INFORMATION THAT APPEARS LITERALLY IN THE KNOWLEDGE BASE BELOW. NEVER INVENT, INFER, OR ADD INFORMATION THAT IS NOT EXPLICITLY WRITTEN.

SPECIFIC CONTACT INFORMATION:
${contactInfo ? contactInfo.content : 'Contact information not available in database'}

CONVERSATION SCHEMA:
${conversationSchema ? conversationSchema.content : 'Conversation schema not available'}

PROJECT TYPES WE HANDLE:
${projectTypes ? projectTypes.content.substring(0, 1500) : 'Project types information not available'}

ALL AVAILABLE WEBSITE INFORMATION (THIS IS YOUR ONLY SOURCE OF TRUTH):
${knowledgeContent?.map(kb => `=== ${kb.page_title} ===\n${kb.content}\n`).join('\n') || 'Limited information available'}

STRICT INSTRUCTIONS - FOLLOW EXACTLY:
1. ONLY respond based on the specific information that appears above
2. If you don't have specific information about something, respond exactly: "I don't have that specific information in my database. For precise details about [topic], I recommend contacting directly at +1 (555) 123-4567 or info@wmmanagement.com"
3. NEVER invent services, prices, terms, conditions, or details that are not explicitly written
4. NEVER use phrases like "typically", "usually", "generally", "normally" - only specific site information
5. When mentioning services, use ONLY those listed in the provided information
6. For questions about specific services, use ONLY the information from that corresponding section
7. Proactively ask about the user's project type according to the schema if available
8. Offer only the next steps that are mentioned in the information (specific tools, consultations)
9. Maintain a professional and helpful tone
10. Respond in English`;

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