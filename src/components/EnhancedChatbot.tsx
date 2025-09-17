import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Loader2, Home, Building, FileText, Phone, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

interface QuickAction {
  icon: React.ReactNode;
  labelEn: string;
  labelEs: string;
  messageEn: string;
  messageEs: string;
}

const quickActions: QuickAction[] = [
  {
    icon: <Home className="w-4 h-4" />,
    labelEn: "Services",
    labelEs: "Servicios",
    messageEn: "What services does WM Management offer?",
    messageEs: "¿Qué servicios ofrece WM Management?"
  },
  {
    icon: <Building className="w-4 h-4" />,
    labelEn: "Property Management",
    labelEs: "Gestión de Propiedades",
    messageEn: "Tell me about your property management services",
    messageEs: "Cuéntame sobre sus servicios de gestión de propiedades"
  },
  {
    icon: <FileText className="w-4 h-4" />,
    labelEn: "Financing",
    labelEs: "Financiamiento",
    messageEn: "What financing options are available?",
    messageEs: "¿Qué opciones de financiamiento están disponibles?"
  },
  {
    icon: <Phone className="w-4 h-4" />,
    labelEn: "Contact",
    labelEs: "Contacto",
    messageEn: "How can I contact WM Management?",
    messageEs: "¿Cómo puedo contactar a WM Management?"
  }
];

export const EnhancedChatbot: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showLanguageSelection, setShowLanguageSelection] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize conversation with welcome message based on current page language
    if (isOpen && messages.length === 0) {
      const welcomeMessage = language === 'es' 
        ? "¡Hola! Soy tu asistente de IA especializado de WM Management. 🏠\n\n¿En qué tipo de proyecto inmobiliario te puedo ayudar hoy? ¿Inversión residencial, comercial, financiamiento o gestión de propiedades?"
        : "Hello! I'm your specialized AI assistant from WM Management. 🏠\n\nWhat type of real estate project can I help you with today? Residential investment, commercial, financing, or property management?";
      
      setMessages([{
        id: `welcome_${Date.now()}`,
        content: welcomeMessage,
        role: 'assistant',
        timestamp: new Date()
      }]);
      setShowLanguageSelection(false);
    }
  }, [isOpen, language]);

  const handleLanguageSelection = (selectedLanguage: 'en' | 'es') => {
    // This will trigger the useEffect above with the new language
    setShowLanguageSelection(false);
  };

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      content: messageContent,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      console.log('Sending message to AI chatbot:', messageContent);
      
      const { data, error } = await supabase.functions.invoke('ai-chatbot', {
        body: {
          message: messageContent,
          sessionId: sessionId,
          language: language
        }
      });

      if (error) throw error;

      setIsTyping(false);

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      const errorMessage = language === 'es' 
        ? "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente."
        : "Sorry, there was an error processing your message. Please try again.";
      
      const assistantMessage: Message = {
        id: `error_${Date.now()}`,
        content: errorMessage,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      toast({
        title: language === 'es' ? "Error" : "Error",
        description: language === 'es' 
          ? "No se pudo enviar el mensaje. Intenta nuevamente."
          : "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    sendMessage(inputValue);
  };

  const handleQuickAction = (action: QuickAction) => {
    const message = language === 'es' ? action.messageEs : action.messageEn;
    sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          aria-label={language === 'es' ? "Abrir chat" : "Open chat"}
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-96 h-[600px] shadow-2xl border-0 bg-background/95 backdrop-blur-sm flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Builder</h3>
              <p className="text-xs opacity-90">
                {language === 'es' ? 'Asistente Inmobiliario' : 'Real Estate Assistant'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {language === 'es' ? 'En línea' : 'Online'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef} style={{ height: 'calc(100% - 140px)' }}>
          <div className="space-y-4">
            {showLanguageSelection && (
              <div className="text-center space-y-3 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Which language would you prefer?<br />
                  ¿En qué idioma prefieres que continuemos?
                </p>
                <div className="flex space-x-2 justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleLanguageSelection('en')}
                  >
                    English
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleLanguageSelection('es')}
                  >
                    Español
                  </Button>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-sm">
                      {language === 'es' ? 'Builder está escribiendo...' : 'Builder is typing...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {!showLanguageSelection && messages.length <= 1 && (
          <div className="px-4 py-2 border-t bg-muted/30 flex-shrink-0">
            <p className="text-xs text-muted-foreground mb-2">
              {language === 'es' ? 'Preguntas rápidas:' : 'Quick questions:'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action)}
                  className="h-auto p-2 flex flex-col items-center text-xs"
                  disabled={isLoading}
                >
                  {action.icon}
                  <span className="mt-1 text-center leading-tight">
                    {language === 'es' ? action.labelEs : action.labelEn}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t flex-shrink-0">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                language === 'es' 
                  ? 'Escribe tu mensaje...' 
                  : 'Type your message...'
              }
              disabled={isLoading || showLanguageSelection}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || showLanguageSelection}
              size="sm"
              className="px-3"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {language === 'es' 
              ? 'Presiona Enter para enviar' 
              : 'Press Enter to send'
            }
          </p>
        </div>
      </Card>
    </div>
  );
};