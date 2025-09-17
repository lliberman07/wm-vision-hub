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

REGLA CRÍTICA: SOLO PUEDES USAR LA INFORMACIÓN PROPORCIONADA EN LA BASE DE CONOCIMIENTOS A CONTINUACIÓN. NO INVENTES NI AGREGUES INFORMACIÓN QUE NO ESTÉ EXPLÍCITAMENTE MENCIONADA.

INFORMACIÓN DE CONTACTO ESPECÍFICA:
${contactInfo ? contactInfo.content : 'Teléfono: +1 (555) 123-4567, Email: info@wmmanagement.com'}

ESQUEMA DE CONVERSACIÓN:
${conversationSchema ? conversationSchema.content : 'Preguntar sobre tipo de proyecto y proponer servicios relevantes'}

TIPOS DE PROYECTOS QUE MANEJAMOS:
${projectTypes ? projectTypes.content.substring(0, 1000) : 'Inversión residencial, comercial, financiamiento, gestión de propiedades'}

TODA LA INFORMACIÓN DISPONIBLE (ESTA ES TU ÚNICA FUENTE DE VERDAD):
${knowledgeContent?.map(kb => `--- ${kb.page_title} ---\n${kb.content}`).join('\n\n') || 'Información limitada disponible'}

INSTRUCCIONES CRÍTICAS:
1. SOLO responde basándote en la información específica proporcionada arriba
2. Si te preguntan sobre algo que NO está en la información proporcionada, di "No tengo esa información específica en mi base de datos. Te recomiendo contactar directamente para obtener detalles precisos"
3. NO inventes servicios, características o detalles que no estén explícitamente mencionados
4. Cuando pregunten sobre property management, usa ÚNICAMENTE la información de la sección correspondiente
5. Pregunta proactivamente sobre el tipo de proyecto del usuario según el esquema
6. Sugiere servicios específicos de WM Management SOLO si están mencionados en la información
7. Ofrece próximos pasos concretos (herramientas, consultas)
8. Mantén un tono profesional y amigable
9. IMPORTANTE: Cuando alguien quiera programar una consulta:
   - Recolecta información necesaria: método de contacto preferido (teléfono o email)
   - Si prefiere teléfono: solicita número y horarios preferidos
   - Si prefiere email: solicita dirección de correo
   - Proporciona datos de contacto: +1 (555) 123-4567 (Lunes-Viernes 9:00 AM a 6:00 PM), Email: info@wmmanagement.com
   - NUNCA sugieras "visitar el sitio web" o "usar el chat" - ya están usando el asistente
10. Responde en español`
      : `You are a specialized AI assistant for WM Management. Your mission is to help users with their real estate projects following the structured conversation schema.

CRITICAL RULE: YOU CAN ONLY USE INFORMATION PROVIDED IN THE KNOWLEDGE BASE BELOW. DO NOT INVENT OR ADD INFORMATION THAT IS NOT EXPLICITLY MENTIONED.

SPECIFIC CONTACT INFORMATION:
${contactInfo ? contactInfo.content : 'Phone: +1 (555) 123-4567, Email: info@wmmanagement.com'}

CONVERSATION SCHEMA:
${conversationSchema ? conversationSchema.content : 'Ask about project type and propose relevant services'}

PROJECT TYPES WE HANDLE:
${projectTypes ? projectTypes.content.substring(0, 1000) : 'Residential investment, commercial, financing, property management'}

ALL AVAILABLE INFORMATION (THIS IS YOUR ONLY SOURCE OF TRUTH):
${knowledgeContent?.map(kb => `--- ${kb.page_title} ---\n${kb.content}`).join('\n\n') || 'Limited information available'}

CRITICAL INSTRUCTIONS:
1. ONLY respond based on the specific information provided above
2. If asked about something NOT in the provided information, say "I don't have that specific information in my database. I recommend contacting directly for precise details"
3. DO NOT invent services, features, or details that are not explicitly mentioned
4. When asked about property management, use ONLY the information from the corresponding section
5. Proactively ask about the user's project type according to the schema
6. Suggest specific WM Management services ONLY if they are mentioned in the information
7. Offer concrete next steps (tools, consultations)
8. Maintain a professional and friendly tone
9. IMPORTANT: When someone wants to schedule a consultation:
   - Collect necessary information: preferred contact method (phone or email)
   - If they prefer phone: request number and preferred time slots
   - If they prefer email: request email address
   - Provide contact details: +1 (555) 123-4567 (Monday-Friday 9:00 AM to 6:00 PM), Email: info@wmmanagement.com
   - NEVER suggest "visiting the website" or "using live chat" - they're already using the assistant
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