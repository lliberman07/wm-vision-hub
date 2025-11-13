import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  type: 'real_estate_agency' | 'independent_manager';
  province: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  tiktok: string | null;
  is_featured: boolean;
  is_active: boolean;
}

interface PartnersDirectoryProps {
  type?: 'real_estate_agency' | 'independent_manager' | 'all';
  featured?: boolean;
  limit?: number;
}

export function PartnersDirectory({ type = 'all', featured = false, limit }: PartnersDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['partners-directory', type, featured],
    queryFn: async () => {
      let query = (supabase as any)
        .from('granada_partners')
        .select('*')
        .eq('is_active', true);

      if (type !== 'all') {
        query = query.eq('type', type);
      }

      if (featured) {
        query = query.eq('is_featured', true);
      }

      if (limit) {
        query = query.limit(limit);
      }

      query = query.order('name', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Partner[];
    },
  });

  // Get unique provinces and cities for filters
  const provinces = Array.from(new Set(partners.map(p => p.province).filter(Boolean)));
  const cities = selectedProvince === "all" 
    ? Array.from(new Set(partners.map(p => p.city).filter(Boolean)))
    : Array.from(new Set(partners.filter(p => p.province === selectedProvince).map(p => p.city).filter(Boolean)));

  // Filter partners
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvince = selectedProvince === "all" || partner.province === selectedProvince;
    const matchesCity = selectedCity === "all" || partner.city === selectedCity;

    return matchesSearch && matchesProvince && matchesCity;
  });

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters - Only show if not featured limited view */}
      {!featured && (
        <div className="grid md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <Input
            placeholder="Buscar por nombre, ciudad o barrio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:col-span-2"
          />
          <Select value={selectedProvince} onValueChange={(value) => {
            setSelectedProvince(value);
            setSelectedCity("all");
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Provincia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las provincias</SelectItem>
              {provinces.map((province) => (
                <SelectItem key={province} value={province!}>{province}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger>
              <SelectValue placeholder="Ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city!}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Results count */}
      {!featured && (
        <div className="text-sm text-muted-foreground">
          {filteredPartners.length} {filteredPartners.length === 1 ? 'resultado' : 'resultados'}
        </div>
      )}

      {/* Partners grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPartners.map((partner) => (
          <Card key={partner.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-4">
                {partner.logo_url ? (
                  <img 
                    src={partner.logo_url} 
                    alt={partner.name}
                    className="h-20 w-20 object-contain rounded-lg border"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-[hsl(var(--granada-red))] to-[hsl(var(--granada-navy))] flex items-center justify-center text-white font-bold text-2xl">
                    {partner.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <CardTitle className="text-lg">{partner.name}</CardTitle>
                  {partner.is_featured && (
                    <Badge className="mt-1 bg-[hsl(var(--granada-gold))]">Destacado</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {partner.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{partner.description}</p>
              )}

              {/* Location */}
              {(partner.city || partner.province) && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-[hsl(var(--granada-red))] mt-0.5 flex-shrink-0" />
                  <span>
                    {partner.neighborhood && `${partner.neighborhood}, `}
                    {partner.city}
                    {partner.province && `, ${partner.province}`}
                  </span>
                </div>
              )}

              {/* Contact info */}
              <div className="space-y-2">
                {partner.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-[hsl(var(--granada-navy))]" />
                    <a href={`tel:${partner.phone}`} className="hover:text-primary">{partner.phone}</a>
                  </div>
                )}
                {partner.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-[hsl(var(--granada-navy))]" />
                    <a href={`mailto:${partner.email}`} className="hover:text-primary truncate">{partner.email}</a>
                  </div>
                )}
              </div>

              {/* Social links */}
              <div className="flex items-center gap-3 pt-2">
                {partner.website && (
                  <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--granada-navy))] hover:text-[hsl(var(--granada-gold))] transition-colors">
                    <Globe className="h-5 w-5" />
                  </a>
                )}
                {partner.instagram && (
                  <a href={`https://instagram.com/${partner.instagram}`} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--granada-navy))] hover:text-[hsl(var(--granada-gold))] transition-colors">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {partner.facebook && (
                  <a href={`https://facebook.com/${partner.facebook}`} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--granada-navy))] hover:text-[hsl(var(--granada-gold))] transition-colors">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {partner.twitter && (
                  <a href={`https://twitter.com/${partner.twitter}`} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--granada-navy))] hover:text-[hsl(var(--granada-gold))] transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
              </div>

              {/* CTA */}
              {partner.website && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  asChild
                >
                  <a href={partner.website} target="_blank" rel="noopener noreferrer">
                    Visitar sitio web
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPartners.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">No se encontraron resultados</p>
            <p>Intenta ajustar los filtros de búsqueda</p>
          </div>
        </Card>
      )}
    </div>
  );
}
