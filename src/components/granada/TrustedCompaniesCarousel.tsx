import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Autoplay from "embla-carousel-autoplay";

const simulatedCompanies = [
  "Propiedades Premium",
  "BsAs Real Estate",
  "Urban Homes",
  "Grupo Inmobiliario Sur",
  "Capital Properties",
  "Residencial Norte",
  "Inversiones del Plata",
  "Panorama Propiedades",
  "Compass Inmobiliaria",
  "Horizonte Propiedades",
];

export function TrustedCompaniesCarousel() {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 2000,
          stopOnInteraction: false,
        }),
      ]}
      className="w-full"
    >
      <CarouselContent className="-ml-2 md:-ml-4">
        {simulatedCompanies.map((company, index) => (
          <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
            <Card className="border-border bg-card hover:shadow-md transition-all duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground text-sm">
                  {company}
                </h4>
                <Badge variant="secondary" className="text-xs">
                  Cliente Granada
                </Badge>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
