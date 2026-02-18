import { useState } from "react";
import { Car } from "lucide-react";

// Base URL for car logos dataset (open-source, 387+ logos)
const LOGOS_BASE =
  "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized";

// Hebrew + English manufacturer names → dataset slug
const SLUG: Record<string, string> = {
  // Hebrew
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
  "אאודי": "audi",
  "פולקסווגן": "volkswagen",
  "סקודה": "skoda",
  "סיאט": "seat",
  "קופרה": "cupra",
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
  "צ'רי": "chery",
  "סאנגיונג": "ssangyong",
  "סאנג יונג": "ssangyong",
  "דאצ'יה": "dacia",
  "מזראטי": "maserati",
  "פרארי": "ferrari",
  "למבורגיני": "lamborghini",
  "בנטלי": "bentley",
  "רולס רויס": "rolls-royce",
  "אסטון מרטין": "aston-martin",
  "ג'נסיס": "genesis",
  // English (lowercase)
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
  "bmw": "bmw",
  "audi": "audi",
  "volkswagen": "volkswagen",
  "vw": "volkswagen",
  "skoda": "skoda",
  "seat": "seat",
  "cupra": "cupra",
  "ford": "ford",
  "opel": "opel",
  "peugeot": "peugeot",
  "citroen": "citroen",
  "renault": "renault",
  "fiat": "fiat",
  "alfa romeo": "alfa-romeo",
  "alfa-romeo": "alfa-romeo",
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
  "land-rover": "land-rover",
  "jaguar": "jaguar",
  "mini": "mini",
  "tesla": "tesla",
  "polestar": "polestar",
  "byd": "byd",
  "chery": "chery",
  "dacia": "dacia",
  "ssangyong": "ssangyong",
  "maserati": "maserati",
  "ferrari": "ferrari",
  "lamborghini": "lamborghini",
  "bentley": "bentley",
  "rolls-royce": "rolls-royce",
  "rolls royce": "rolls-royce",
  "aston martin": "aston-martin",
  "aston-martin": "aston-martin",
  "genesis": "genesis",
  "isuzu": "isuzu",
  "ram": "ram",
  "gmc": "gmc",
  "saab": "saab",
  "smart": "smart",
  "rivian": "rivian",
  "lucid": "lucid",
};

function getSlug(manufacturer: string): string | null {
  return SLUG[manufacturer.trim()] ?? SLUG[manufacturer.trim().toLowerCase()] ?? null;
}

interface ManufacturerLogoProps {
  manufacturer: string | null | undefined;
  size?: number;
}

export default function ManufacturerLogo({ manufacturer, size = 32 }: ManufacturerLogoProps) {
  const [failed, setFailed] = useState(false);

  if (!manufacturer) {
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

  if (!slug || failed) {
    return (
      <div
        className="rounded-full bg-muted/60 border border-border/40 flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <span
          className="text-muted-foreground font-polin-medium select-none"
          style={{ fontSize: size * 0.38 }}
        >
          {manufacturer.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-full bg-white border border-border/20 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm"
      style={{ width: size, height: size }}
    >
      <img
        src={`${LOGOS_BASE}/${slug}.png`}
        alt={manufacturer}
        onError={() => setFailed(true)}
        className="object-contain"
        style={{ width: size * 0.78, height: size * 0.78 }}
      />
    </div>
  );
}
