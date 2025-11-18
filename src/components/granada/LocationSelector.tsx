import { useEffect } from "react";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ARGENTINA_DATA } from "@/data/argentina";

interface LocationSelectorProps {
  provinceValue: string;
  cityValue: string;
  neighborhoodValue?: string;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onNeighborhoodChange?: (value: string) => void;
  required?: boolean;
}

export function LocationSelector({
  provinceValue,
  cityValue,
  neighborhoodValue,
  onProvinceChange,
  onCityChange,
  onNeighborhoodChange,
  required = true,
}: LocationSelectorProps) {
  const selectedProvince = ARGENTINA_DATA.find(p => p.name === provinceValue);
  const selectedCity = selectedProvince?.cities.find(c => c.name === cityValue);

  // Reset city and neighborhood when province changes
  useEffect(() => {
    if (provinceValue && cityValue) {
      const province = ARGENTINA_DATA.find(p => p.name === provinceValue);
      const cityExists = province?.cities.some(c => c.name === cityValue);
      if (!cityExists) {
        onCityChange("");
        if (onNeighborhoodChange) {
          onNeighborhoodChange("");
        }
      }
    }
  }, [provinceValue, cityValue, onCityChange, onNeighborhoodChange]);

  // Reset neighborhood when city changes
  useEffect(() => {
    if (cityValue && neighborhoodValue && onNeighborhoodChange) {
      const province = ARGENTINA_DATA.find(p => p.name === provinceValue);
      const city = province?.cities.find(c => c.name === cityValue);
      const neighborhoodExists = city?.neighborhoods.includes(neighborhoodValue);
      if (!neighborhoodExists) {
        onNeighborhoodChange("");
      }
    }
  }, [cityValue, neighborhoodValue, provinceValue, onNeighborhoodChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Provincia */}
      <FormItem>
        <FormLabel>
          Provincia {required && <span className="text-destructive">*</span>}
        </FormLabel>
        <Select
          value={provinceValue}
          onValueChange={(value) => {
            onProvinceChange(value);
            onCityChange("");
            if (onNeighborhoodChange) {
              onNeighborhoodChange("");
            }
          }}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona provincia" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {ARGENTINA_DATA.map((province) => (
              <SelectItem key={province.id} value={province.name}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>

      {/* Ciudad */}
      <FormItem>
        <FormLabel>
          Ciudad {required && <span className="text-destructive">*</span>}
        </FormLabel>
        <Select
          value={cityValue}
          onValueChange={(value) => {
            onCityChange(value);
            if (onNeighborhoodChange) {
              onNeighborhoodChange("");
            }
          }}
          disabled={!provinceValue}
        >
          <FormControl>
            <SelectTrigger disabled={!provinceValue}>
              <SelectValue 
                placeholder={
                  !provinceValue 
                    ? "Primero selecciona provincia" 
                    : "Selecciona ciudad"
                } 
              />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {selectedProvince?.cities.map((city) => (
              <SelectItem key={city.id} value={city.name}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>

      {/* Barrio */}
      {onNeighborhoodChange && (
        <FormItem>
          <FormLabel>Barrio</FormLabel>
          <Select
            value={neighborhoodValue || ""}
            onValueChange={onNeighborhoodChange}
            disabled={!cityValue}
          >
            <FormControl>
              <SelectTrigger disabled={!cityValue}>
                <SelectValue 
                  placeholder={
                    !cityValue 
                      ? "Primero selecciona ciudad" 
                      : "Selecciona barrio (opcional)"
                  } 
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="">Sin especificar</SelectItem>
              {selectedCity?.neighborhoods.map((neighborhood) => (
                <SelectItem key={neighborhood} value={neighborhood}>
                  {neighborhood}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    </div>
  );
}
