import { useState } from "react";
import { Car } from "lucide-react";

// Map Hebrew/common manufacturer names to their slug for the logo API
const MANUFACTURER_SLUG_MAP: Record<string, string> = {
  // Hebrew names
  "טויוטה": "toyota",
  "הונדה": "honda",
  "מזדה": "mazda",
  "יונדאי": "hyundai",
  "קיה": "kia",
  "ניסאן": "nissan",
  "מיצובישי": "mitsubishi",
  "סובארו": "subaru",
  "סוזוקי": "suzuki",
  "מרצדס": "mercedes-benz",
  "מרצדס בנץ": "mercedes-benz",
  "ב.מ.וו": "bmw",
  "bmw": "bmw",
  "אאודי": "audi",
  "פולקסווגן": "volkswagen",
  "סקודה": "skoda",
  "סיאט": "seat",
  "פורד": "ford",
  "אופל": "opel",
  "פיג'ו": "peugeot",
  "סיטרואן": "citroen",
  "רנו": "renault",
  "פיאט": "fiat",
  "אלפא רומאו": "alfa-romeo",
  "וולוו": "volvo",
  "לקסוס": "lexus",
  "אינפיניטי": "infiniti",
  "אקורה": "acura",
  "ג'יפ": "jeep",
  "ג'י.פי": "jeep",
  "שברולט": "chevrolet",
  "דודג'": "dodge",
  "קרייזלר": "chrysler",
  "לינקולן": "lincoln",
  "קדילק": "cadillac",
  "בויק": "buick",
  "פורשה": "porsche",
  "לנד רובר": "land-rover",
  "ריינג' רובר": "land-rover",
  "ג'גואר": "jaguar",
  "מיני": "mini",
  "טסלה": "tesla",
  "פולסטאר": "polestar",
  "בי.וואי.די": "byd",
  "byd": "byd",
  "לינק אנד קו": "lynk-co",
  "סאיק": "saic",
  "גרייט וול": "great-wall",
  "צ'רי": "chery",
  "מוביס": "mobis",
  // English names (lowercase)
  "toyota": "toyota",
  "honda": "honda",
  "mazda": "mazda",
  "hyundai": "hyundai",
  "kia": "kia",
  "nissan": "nissan",
  "mitsubishi": "mitsubishi",
  "subaru": "subaru",
  "suzuki": "suzuki",
  "mercedes": "mercedes-benz",
  "mercedes-benz": "mercedes-benz",
  "audi": "audi",
  "volkswagen": "volkswagen",
  "vw": "volkswagen",
  "skoda": "skoda",
  "seat": "seat",
  "ford": "ford",
  "opel": "opel",
  "peugeot": "peugeot",
  "citroen": "citroen",
  "renault": "renault",
  "fiat": "fiat",
  "alfa romeo": "alfa-romeo",
  "volvo": "volvo",
  "lexus": "lexus",
  "infiniti": "infiniti",
  "acura": "acura",
  "jeep": "jeep",
  "chevrolet": "chevrolet",
  "dodge": "dodge",
  "chrysler": "chrysler",
  "lincoln": "lincoln",
  "cadillac": "cadillac",
  "buick": "buick",
  "porsche": "porsche",
  "land rover": "land-rover",
  "landrover": "land-rover",
  "jaguar": "jaguar",
  "mini": "mini",
  "tesla": "tesla",
  "polestar": "polestar",
};

function getSlug(manufacturer: string): string | null {
  const key = manufacturer.trim().toLowerCase();
  return MANUFACTURER_SLUG_MAP[key] ?? MANUFACTURER_SLUG_MAP[manufacturer.trim()] ?? null;
}

interface ManufacturerLogoProps {
  manufacturer: string | null | undefined;
  size?: number;
}

export default function ManufacturerLogo({ manufacturer, size = 32 }: ManufacturerLogoProps) {
  const [failed, setFailed] = useState(false);

  if (!manufacturer || failed) {
    return (
      <div
        className="rounded-full bg-muted flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <Car className="text-muted-foreground" style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    );
  }

  const slug = getSlug(manufacturer);
  if (!slug) {
    return (
      <div
        className="rounded-full bg-muted/60 border border-border/40 flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{ width: size, height: size }}
      >
        <span className="text-muted-foreground font-polin-medium" style={{ fontSize: size * 0.35 }}>
          {manufacturer.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-full bg-white border border-border/30 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm"
      style={{ width: size, height: size, padding: size * 0.1 }}
    >
      <img
        src={`https://logo.clearbit.com/${slug}.com`}
        alt={manufacturer}
        onError={() => setFailed(true)}
        className="object-contain w-full h-full"
        style={{ width: size * 0.75, height: size * 0.75 }}
      />
    </div>
  );
}
