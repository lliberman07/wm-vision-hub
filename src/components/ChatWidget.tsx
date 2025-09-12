import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import builderAvatar from '@/assets/builder-avatar.png';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatWidget = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('chat.welcome'),
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [languageSelected, setLanguageSelected] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLanguageSelection = (selectedLanguage: 'en' | 'es') => {
    setLanguageSelected(true);
    const { setLanguage } = useLanguage();
    setLanguage(selectedLanguage);
    
    setTimeout(() => {
      const languageResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: selectedLanguage === 'en' ? t('chat.languageSelected.english') : t('chat.languageSelected.spanish'),
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, languageResponse]);
    }, 500);
  };

  const generateBuildoResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    const { language } = useLanguage();
    
    // Enhanced multilingual keyword detection
    const keywords = {
      propertyManagement: ['property management', 'gestión de propiedades', 'administración', 'management', 'propiedades'],
      financing: ['financing', 'financiamiento', 'préstamo', 'crédito', 'loan', 'credit'],
      investment: ['investment', 'inversión', 'invertir', 'invest', 'returns', 'retornos'],
      services: ['services', 'servicios', 'service', 'servicio', 'help', 'ayuda'],
      about: ['about', 'acerca', 'sobre', 'company', 'empresa', 'who are you', 'quién eres'],
      contact: ['contact', 'contacto', 'phone', 'teléfono', 'email', 'correo'],
      greeting: ['hello', 'hi', 'hola', 'buenos días', 'good morning', 'hey'],
      pricing: ['price', 'precio', 'cost', 'costo', 'cuánto', 'how much'],
      location: ['where', 'dónde', 'location', 'ubicación', 'address', 'dirección']
    };

    // Check greetings first
    if (keywords.greeting.some(keyword => lowerMessage.includes(keyword))) {
      return t('chat.responses.greeting');
    }
    
    // Check for specific topics
    if (keywords.propertyManagement.some(keyword => lowerMessage.includes(keyword))) {
      return t('chat.responses.propertyManagement');
    }
    if (keywords.financing.some(keyword => lowerMessage.includes(keyword))) {
      return t('chat.responses.financing');
    }
    if (keywords.investment.some(keyword => lowerMessage.includes(keyword))) {
      return t('chat.responses.investment');
    }
    if (keywords.services.some(keyword => lowerMessage.includes(keyword))) {
      return t('chat.responses.services');
    }
    if (keywords.about.some(keyword => lowerMessage.includes(keyword))) {
      return t('chat.responses.about');
    }
    if (keywords.contact.some(keyword => lowerMessage.includes(keyword))) {
      return t('chat.responses.contact');
    }
    if (keywords.pricing.some(keyword => lowerMessage.includes(keyword))) {
      return t('chat.responses.pricing');
    }
    if (keywords.location.some(keyword => lowerMessage.includes(keyword))) {
      return t('chat.responses.location');
    }
    
    return t('chat.responses.default');
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI response after a short delay
    setTimeout(() => {
      const buildoResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBuildoResponse(inputValue),
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, buildoResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button - hidden when open to avoid overlap */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="h-14 w-14 rounded-full shadow-elegant hover:shadow-glow transition-all duration-300"
            aria-label="Open chat"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[60] w-80 h-96">
          <Card className="h-full shadow-elegant">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={builderAvatar} alt="Builder building assistant avatar" />
                    <AvatarFallback>B</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">Builder</p>
                    <p className="text-xs text-muted-foreground">{t('chat.subtitle')}</p>
                  </div>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-full">
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-3 pb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.isUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">{message.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Language selection buttons - show only for first message and when language not selected */}
                  {!languageSelected && messages.length === 1 && (
                    <div className="flex justify-center space-x-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLanguageSelection('en')}
                        className="text-xs"
                      >
                        {t('chat.languageSelection.english')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLanguageSelection('es')}
                        className="text-xs"
                      >
                        {t('chat.languageSelection.spanish')}
                      </Button>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('chat.placeholder')}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default ChatWidget;