import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PartnersDirectory } from "./PartnersDirectory";
import { ArrowRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

interface FeaturedPartnersSectionProps {
  type: 'real_estate_agency' | 'independent_manager';
  title: string;
  description: string;
}

export function FeaturedPartnersSection({ type, title, description }: FeaturedPartnersSectionProps) {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-[hsl(var(--granada-gold))]/10 rounded-full">
            <Building2 className="h-5 w-5 text-[hsl(var(--granada-gold))]" />
            <span className="text-[hsl(var(--granada-gold))] font-semibold">Red de Partners Verificados</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {description}
          </p>
        </div>

        {/* Featured Partners Grid */}
        <PartnersDirectory type={type} featured={true} limit={6} />
      </div>
    </section>
  );
}
