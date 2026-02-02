// Swedish ingredient parsing and normalization utilities

// Grocery categories
export type GroceryCategory = 
  | 'vegetables'    // Grönsaker & frukt
  | 'dairy'         // Mejeri
  | 'meat'          // Kött & fisk
  | 'frozen'        // Fryst
  | 'pantry'        // Skafferi
  | 'bread'         // Bröd & bageri
  | 'beverages'     // Drycker
  | 'other';        // Övrigt

// Swedish category names for display
export const CATEGORY_NAMES: Record<GroceryCategory, { sv: string; en: string }> = {
  vegetables: { sv: 'Grönsaker & frukt', en: 'Vegetables & Fruit' },
  dairy: { sv: 'Mejeri', en: 'Dairy' },
  meat: { sv: 'Kött & fisk', en: 'Meat & Fish' },
  frozen: { sv: 'Fryst', en: 'Frozen' },
  pantry: { sv: 'Skafferi', en: 'Pantry' },
  bread: { sv: 'Bröd & bageri', en: 'Bread & Bakery' },
  beverages: { sv: 'Drycker', en: 'Beverages' },
  other: { sv: 'Övrigt', en: 'Other' },
};

// Category order for display
export const CATEGORY_ORDER: GroceryCategory[] = [
  'vegetables',
  'dairy',
  'meat',
  'frozen',
  'bread',
  'pantry',
  'beverages',
  'other',
];

// Ingredient to category mappings
const CATEGORY_KEYWORDS: Record<GroceryCategory, string[]> = {
  vegetables: [
    // Vegetables
    'morot', 'morötter', 'tomat', 'tomater', 'potatis', 'gurka', 'lök', 'vitlök',
    'paprika', 'broccoli', 'sallad', 'spenat', 'grönkål', 'vitkål', 'kål',
    'zucchini', 'aubergine', 'champinjon', 'svamp', 'majs', 'ärtor', 'bönor',
    'selleri', 'purjolök', 'rödbetor', 'rädisor', 'sparris', 'squash',
    'ruccola', 'isbergssallad', 'romansallad', 'kronärtskocka', 'scharlottenlök',
    // Fruits
    'äpple', 'äpplen', 'banan', 'bananer', 'apelsin', 'citron', 'lime',
    'jordgubbe', 'jordgubbar', 'hallon', 'blåbär', 'lingon', 'druva', 'druvor',
    'päron', 'persika', 'mango', 'ananas', 'vattenmelon', 'melon',
    'kiwi', 'avokado', 'granatäpple', 'fikon', 'dadlar',
    // Herbs
    'basilika', 'persilja', 'dill', 'koriander', 'rosmarin', 'timjan', 'oregano',
    'mynta', 'gräslök', 'salvia',
  ],
  dairy: [
    'mjölk', 'lättmjölk', 'mellanmjölk', 'standardmjölk', 'grädde', 'vispgrädde',
    'matlagningsgrädde', 'crème fraiche', 'creme fraiche', 'gräddfil', 'filmjölk',
    'yoghurt', 'kvarg', 'ost', 'riven ost', 'parmesanost', 'parmesan', 'mozzarella',
    'cheddar', 'gouda', 'brie', 'fetaost', 'halloumi', 'halloumiost',
    'ägg', 'äggula', 'äggulor', 'äggvita', 'cream cheese', 'färskost',
    'kesella', 'cottage cheese', 'mascarpone', 'ricotta',
  ],
  meat: [
    'kött', 'nötkött', 'fläskkött', 'kycklingfilé', 'kyckling', 'kalkon',
    'fläskfilé', 'kotlett', 'bacon', 'skinka', 'korv', 'falukorv', 'prinskorv',
    'chorizo', 'salsiccia', 'salsicciafärs', 'köttfärs', 'blandfärs', 'nötfärs', 'fläskfärs',
    'färs', 'köttbullar', 'biff', 'entrecote', 'ryggbiff', 'oxfilé',
    'fisk', 'lax', 'laxfilé', 'torsk', 'torskfilé', 'sej', 'kolja', 'rödspätta',
    'räkor', 'räka', 'kräftor', 'musslor', 'bläckfisk', 'tonfisk', 'makrill',
    'sill', 'strömming', 'gravad lax', 'rökt lax',
  ],
  frozen: [
    'fryst', 'frysta', 'glass', 'fryspizza', 'frysgrönsaker',
    'frusna bär', 'frysta bär', 'frysta ärtor', 'fryst spenat',
  ],
  bread: [
    'bröd', 'limpa', 'franskbröd', 'ciabatta', 'focaccia', 'pitabröd', 'tortilla',
    'tunnbröd', 'knäckebröd', 'polarkaka', 'hamburgerbröd', 'korvbröd',
    'croissant', 'bulle', 'kanelbulle', 'wienerbröd', 'muffin', 'kaka',
  ],
  pantry: [
    // Pasta, rice, grains
    'pasta', 'spaghetti', 'penne', 'fusilli', 'lasagne', 'lasagnette', 'tagliatelle',
    'nudlar', 'ris', 'basmatiris', 'jasminris', 'risotto', 'couscous', 'bulgur',
    // Baking & staples
    'mjöl', 'vetemjöl', 'bakpulver', 'bikarbonat', 'jäst', 'strösocker', 'florsocker',
    'vaniljsocker', 'kanel', 'kardemumma', 'ingefära', 'muskotnöt', 'kryddor',
    'buljong', 'buljongtärning', 'hönsbuljongtärning', 'grönsaksbuljongtärning',
    'kalvfond', 'fond', 'soja', 'sojasås', 'ketchup', 'senap', 'majonnäs', 'vinäger',
    'balsamvinäger', 'olivolja', 'rapsolja', 'kokosolja', 'sesamolja',
    'krossade tomater', 'tomatpuré', 'passerade tomater', 'tomatsås',
    'kokosmjölk', 'konserverade', 'konserv', 'kikärtor', 'kidneybönor',
    'vita bönor', 'linser', 'nötter', 'mandlar', 'valnötter', 'cashewnötter',
    'jordnötter', 'frön', 'sesamfrön', 'solrosfrön', 'pumpafrön',
    'honung', 'sirap', 'lönnsirap', 'marmelad', 'sylt', 'nutella',
    'choklad', 'kakao', 'kakaopulver', 'russin', 'torkad frukt', 'lingon',
  ],
  beverages: [
    'juice', 'apelsinjuice', 'äppeljuice', 'läsk', 'vatten', 'mineralvatten',
    'kaffe', 'te', 'öl', 'vin', 'cider', 'alkoholfritt', 'pastavatten',
  ],
  other: [],
};

// Categorize an ingredient based on its name
export function categorizeIngredient(ingredientName: string): GroceryCategory {
  const lower = ingredientName.toLowerCase();
  
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      // Match as word or substring
      if (lower.includes(keyword)) {
        return category as GroceryCategory;
      }
    }
  }
  
  return 'other';
}

// Pantry staples that should be excluded from grocery list
export const PANTRY_STAPLES = [
  // Salt & pepper
  'salt', 'peppar', 'svartpeppar', 'vitpeppar', 'pepper', 'black pepper', 'white pepper',
  // Oils & fats for cooking
  'olja', 'olivolja', 'rapsolja', 'solrosolja', 'matolja', 'vegetabilisk olja',
  'oil', 'olive oil', 'vegetable oil', 'cooking oil',
  'smör', 'butter', 'margarin', 'matfett',
  // Common cooking items
  'vatten', 'water', 'is', 'ice', 'pastavatten',
  'socker', 'sugar', 'strösocker',
  // Phrases indicating cooking fats
  'för stekning', 'till stekning', 'att steka i', 'stekfett',
];

// Swedish plural to singular mappings
const SWEDISH_PLURAL_MAP: Record<string, string> = {
  'morötter': 'morot',
  'tomater': 'tomat',
  'potatisar': 'potatis',
  'gurkor': 'gurka',
  'lökar': 'lök',
  'paprikor': 'paprika',
  'äpplen': 'äpple',
  'bananer': 'banan',
  'citroner': 'citron',
  'apelsiner': 'apelsin',
  'jordgubbar': 'jordgubbe',
  'hallon': 'hallon',
  'blåbär': 'blåbär',
  'ägg': 'ägg',
  'vitlöksklyftor': 'vitlöksklyfta',
  'vitlökar': 'vitlök',
  'champinjoner': 'champinjon',
  'zucchinis': 'zucchini',
  'auberginer': 'aubergine',
  'broccolis': 'broccoli',
  'sallader': 'sallad',
  'räkor': 'räka',
  'musslor': 'mussla',
  'kycklingfiléer': 'kycklingfilé',
  'laxfiléer': 'laxfilé',
  'köttbullar': 'köttbulle',
  'korvar': 'korv',
};

// Ingredient synonyms - map similar ingredients to a canonical name
const INGREDIENT_SYNONYMS: Record<string, string> = {
  // Cream variants
  'vispgrädde': 'grädde',
  'matlagningsgrädde': 'grädde',
  'kaffeegrädde': 'grädde',
  'lätt grädde': 'grädde',
  'tjock grädde': 'grädde',
  'heavy cream': 'grädde',
  'whipping cream': 'grädde',
  'crème fraiche': 'crème fraiche',
  'creme fraiche': 'crème fraiche',
  // Milk variants
  'mjölk': 'mjölk',
  'lättmjölk': 'mjölk',
  'mellanmjölk': 'mjölk',
  'standardmjölk': 'mjölk',
  'havremjölk': 'havremjölk',
  // Flour variants
  'vetemjöl': 'mjöl',
  'dinkel': 'mjöl',
  'grahamsmjöl': 'mjöl',
  // Onion variants
  'gul lök': 'lök',
  'röd lök': 'lök',
  'vitlök': 'vitlök',
  'vitlöksklyfta': 'vitlök',
  'salladslök': 'salladslök',
  'scharlottenlök': 'lök',
  // Potato variants
  'kokt potatis': 'potatis',
  'mjölig potatis': 'potatis',
  'fast potatis': 'potatis',
  // Cheese variants
  'parmesanost': 'parmesan',
  'halloumiost': 'halloumi',
  'ost': 'ost',
  // Meat variants
  'blandfärs': 'färs',
  'nötfärs': 'färs',
  'fläskfärs': 'färs',
  'köttfärs': 'färs',
  'salsicciafärs': 'salsiccia',
  // Egg variants
  'äggula': 'ägg',
  'äggulor': 'ägg',
  'äggvita': 'ägg',
  // Rice variants
  'jasminris': 'ris',
  'basmatiris': 'ris',
  'risottoris': 'ris',
  'långkornigt ris': 'ris',
  'kokt ris': 'ris',
  'vitt ris': 'ris',
  // Tomato variants
  'krossade tomater': 'krossade tomater',
  'tomatpuré': 'tomatpuré',
  'passerade tomater': 'passerade tomater',
  'cocktailtomater': 'tomat',
  'körsbärstomater': 'tomat',
  'plommontomat': 'tomat',
  // Pasta variants
  'spagetti': 'pasta',
  'fusilli': 'pasta',
  'penne': 'pasta',
  'tagliatelle': 'pasta',
  'lasagneplattor': 'lasagneplattor',
  // Citrus variants
  'lime': 'lime',
  'limejuice': 'limejuice',
  'färskpressad lime': 'limejuice',
  'pressad lime': 'limejuice',
  'limeklyfta': 'lime',
  'limeklyftor': 'lime',
  // Soy sauce variants
  'soja': 'soja',
  'sojasås': 'soja',
  'ljus soja': 'soja',
  'mörk soja': 'soja',
  'japansk soja': 'soja',
};

// Common Swedish units
const UNITS = [
  'st', 'stycken', 'styck',
  'g', 'gram',
  'kg', 'kilo', 'kilogram',
  'dl', 'deciliter',
  'l', 'liter',
  'ml', 'milliliter',
  'cl', 'centiliter',
  'msk', 'matsked', 'matskedar',
  'tsk', 'tesked', 'teskedar',
  'krm', 'kryddmått',
  'förpackning', 'förpackningar', 'förp', 'paket',
  'burk', 'burkar',
  'flaska', 'flaskor',
  'knippe', 'knippor',
  'näve', 'nävar',
  'skiva', 'skivor',
  'klyfta', 'klyftor',
  'bit', 'bitar',
];

export interface ParsedIngredient {
  quantity: number;
  unit: string | null;
  name: string;
  normalizedName: string;
  originalText: string;
}

// Unicode fraction mappings
const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '⅓': 1/3,
  '⅔': 2/3,
  '¼': 0.25,
  '¾': 0.75,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 1/6,
  '⅚': 5/6,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

// Parse quantity from start of string (handles fractions, decimals, unicode, ranges, "ca")
function parseQuantity(text: string): { quantity: number; remaining: string } {
  let trimmed = text.trim();
  
  // Strip leading "ca", "ca.", "cirka" prefixes
  const caMatch = trimmed.match(/^(ca\.?|cirka)\s+/i);
  if (caMatch) {
    trimmed = trimmed.slice(caMatch[0].length);
  }
  
  // Handle ranges like "1-2", "1–2" (en-dash), take the higher value
  const rangeMatch = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)\s*/);
  if (rangeMatch) {
    const quantity = Math.max(parseInt(rangeMatch[1]), parseInt(rangeMatch[2]));
    const remaining = trimmed.slice(rangeMatch[0].length);
    return { quantity, remaining };
  }
  
  // Handle unicode fractions with optional whole number "1½", "2¼"
  const unicodeFractionMatch = trimmed.match(/^(\d+)?\s*([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])\s*/);
  if (unicodeFractionMatch) {
    const whole = unicodeFractionMatch[1] ? parseInt(unicodeFractionMatch[1]) : 0;
    const fractionValue = UNICODE_FRACTIONS[unicodeFractionMatch[2]] || 0;
    const quantity = whole + fractionValue;
    const remaining = trimmed.slice(unicodeFractionMatch[0].length);
    return { quantity, remaining };
  }
  
  // Match fractions like "1/2", "1 1/2", "2 1/4"
  const fractionMatch = trimmed.match(/^(\d+)?\s*(\d+)\/(\d+)\s*/);
  if (fractionMatch) {
    const whole = fractionMatch[1] ? parseInt(fractionMatch[1]) : 0;
    const num = parseInt(fractionMatch[2]);
    const denom = parseInt(fractionMatch[3]);
    const quantity = whole + (num / denom);
    const remaining = trimmed.slice(fractionMatch[0].length);
    return { quantity, remaining };
  }
  
  // Match decimals like "1.5", "2,5" (Swedish uses comma)
  const decimalMatch = trimmed.match(/^(\d+[.,]\d+)\s*/);
  if (decimalMatch) {
    const quantity = parseFloat(decimalMatch[1].replace(',', '.'));
    const remaining = trimmed.slice(decimalMatch[0].length);
    return { quantity, remaining };
  }
  
  // Match whole numbers like "2", "10"
  const wholeMatch = trimmed.match(/^(\d+)\s*/);
  if (wholeMatch) {
    const quantity = parseInt(wholeMatch[1]);
    const remaining = trimmed.slice(wholeMatch[0].length);
    return { quantity, remaining };
  }
  
  // No quantity found, default to 1
  return { quantity: 1, remaining: trimmed };
}

// Parse unit from start of string
function parseUnit(text: string): { unit: string | null; remaining: string } {
  const trimmed = text.trim().toLowerCase();
  
  // Sort units by length (longest first) to match "matsked" before "msk"
  const sortedUnits = [...UNITS].sort((a, b) => b.length - a.length);
  
  for (const unit of sortedUnits) {
    const regex = new RegExp(`^${unit}\\b\\.?\\s*`, 'i');
    if (regex.test(trimmed)) {
      const match = trimmed.match(regex);
      if (match) {
        // Normalize unit to standard form
        let normalizedUnit = unit.toLowerCase();
        if (['stycken', 'styck'].includes(normalizedUnit)) normalizedUnit = 'st';
        if (['gram'].includes(normalizedUnit)) normalizedUnit = 'g';
        if (['kilo', 'kilogram'].includes(normalizedUnit)) normalizedUnit = 'kg';
        if (['deciliter'].includes(normalizedUnit)) normalizedUnit = 'dl';
        if (['liter'].includes(normalizedUnit)) normalizedUnit = 'l';
        if (['milliliter'].includes(normalizedUnit)) normalizedUnit = 'ml';
        if (['centiliter'].includes(normalizedUnit)) normalizedUnit = 'cl';
        if (['matsked', 'matskedar'].includes(normalizedUnit)) normalizedUnit = 'msk';
        if (['tesked', 'teskedar'].includes(normalizedUnit)) normalizedUnit = 'tsk';
        if (['kryddmått'].includes(normalizedUnit)) normalizedUnit = 'krm';
        if (['förpackning', 'förpackningar', 'förp', 'paket'].includes(normalizedUnit)) normalizedUnit = 'förp';
        if (['burkar'].includes(normalizedUnit)) normalizedUnit = 'burk';
        if (['flaskor'].includes(normalizedUnit)) normalizedUnit = 'flaska';
        if (['knippor'].includes(normalizedUnit)) normalizedUnit = 'knippe';
        if (['nävar'].includes(normalizedUnit)) normalizedUnit = 'näve';
        if (['skivor'].includes(normalizedUnit)) normalizedUnit = 'skiva';
        if (['klyftor'].includes(normalizedUnit)) normalizedUnit = 'klyfta';
        if (['bitar'].includes(normalizedUnit)) normalizedUnit = 'bit';
        
        const remaining = text.trim().slice(match[0].length);
        return { unit: normalizedUnit, remaining };
      }
    }
  }
  
  return { unit: null, remaining: text };
}

// Normalize ingredient name (lowercase, singular, remove extras)
function normalizeName(name: string): string {
  let normalized = name
    .toLowerCase()
    .trim()
    // Remove brand names and special characters
    .replace(/arla\s*(ko®?|köket®?)?/gi, '')
    .replace(/®/g, '')
    // Remove common prefixes/suffixes
    .replace(/^(färsk|färska|finhackad|hackad|hackade|riven|rivna|finriven|skivad|skivade|tärnad|tärnade|strimlad|strimlade|krossad|krossade|mosad|mosade|kokt|kokta|stekt|stekta|grillad|grillade|rökt|rökta|saltad|saltade|japansk|ljus|konc)\s+/gi, '')
    .replace(/\s+(färsk|färska|finhackad|hackad|hackade|riven|rivna|finriven|skivad|skivade|gratäng)$/gi, '')
    // Remove parenthetical content
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    // Remove punctuation
    .replace(/[,.:;!?]/g, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
  
  // Check plurals first
  const words = normalized.split(' ');
  const singularized = words.map(word => SWEDISH_PLURAL_MAP[word] || word);
  normalized = singularized.join(' ');
  
  // Check exact synonyms first
  if (INGREDIENT_SYNONYMS[normalized]) {
    return INGREDIENT_SYNONYMS[normalized];
  }
  
  // Check if any synonym keyword is contained in the name
  for (const [synonym, canonical] of Object.entries(INGREDIENT_SYNONYMS)) {
    if (normalized.includes(synonym)) {
      return canonical;
    }
  }
  
  // Extract last word as primary ingredient if multi-word
  const wordsArr = normalized.split(' ');
  if (wordsArr.length > 1) {
    const lastWord = wordsArr[wordsArr.length - 1];
    // Check if last word is a known ingredient synonym
    if (INGREDIENT_SYNONYMS[lastWord]) {
      return INGREDIENT_SYNONYMS[lastWord];
    }
  }
  
  return normalized;
}

// Check if ingredient is a pantry staple
export function isPantryStaple(ingredientText: string): boolean {
  const lower = ingredientText.toLowerCase();
  
  // Check for exact word boundary matches (not substrings)
  for (const staple of PANTRY_STAPLES) {
    // Multi-word staples like "för stekning" need direct inclusion check
    if (staple.includes(' ')) {
      if (lower.includes(staple)) return true;
    } else {
      // Single words should match as whole words
      const regex = new RegExp(`\\b${staple}\\b`, 'i');
      if (regex.test(lower)) return true;
    }
  }
  
  // Check for cooking oil/fat phrases
  if (/\b(för stekning|till stekning|att steka i|stekfett)\b/i.test(lower)) return true;
  
  return false;
}

// Parse a full ingredient string
export function parseIngredient(ingredientText: string): ParsedIngredient {
  const original = ingredientText.trim();
  
  // Step 1: Parse quantity
  const { quantity, remaining: afterQuantity } = parseQuantity(original);
  
  // Step 2: Parse unit
  const { unit, remaining: afterUnit } = parseUnit(afterQuantity);
  
  // Step 3: Clean up the ingredient name
  const name = afterUnit.trim();
  
  // Step 4: Normalize the name
  const normalizedName = normalizeName(name);
  
  return {
    quantity,
    unit,
    name,
    normalizedName,
    originalText: original,
  };
}

// Aggregate ingredients by normalized name and unit
export function aggregateIngredients(ingredients: ParsedIngredient[]): ParsedIngredient[] {
  const aggregated = new Map<string, ParsedIngredient>();
  
  // Common Swedish recipe section headers to filter out
  const sectionHeaders = /^(ingredienser|pajdeg|deg|fyllning|pajfyllning|sås|servering|till servering|garnering|marinad|dressing|topping|kryddning|smör|bakning|bottom|kaka|frosting|glasyr|crème|creme|dekoration)$/i;
  
  for (const ing of ingredients) {
    // Skip section headers
    if (sectionHeaders.test(ing.name.trim())) {
      continue;
    }
    
    // Key by normalized name (lowercase) + unit (lowercase)
    // This ensures case-insensitive aggregation
    const key = `${ing.normalizedName.toLowerCase()}|${(ing.unit || '').toLowerCase()}`;
    
    if (aggregated.has(key)) {
      const existing = aggregated.get(key)!;
      // Sum quantities
      existing.quantity += ing.quantity;
      // Preserve any additional properties like sourceMeal
      if ((ing as any).sourceMeal) {
        if ((existing as any).sourceMeal && !(existing as any).sourceMeal.includes((ing as any).sourceMeal)) {
          (existing as any).sourceMeal += `, ${(ing as any).sourceMeal}`;
        } else if (!(existing as any).sourceMeal) {
          (existing as any).sourceMeal = (ing as any).sourceMeal;
        }
      }
    } else {
      aggregated.set(key, { ...ing });
    }
  }
  
  return Array.from(aggregated.values());
}

// Format ingredient for display
export function formatIngredient(parsed: ParsedIngredient): string {
  const parts: string[] = [];
  
  if (parsed.quantity !== 1 || parsed.unit) {
    // Format quantity - show as fraction or decimal if needed
    if (parsed.quantity % 1 === 0) {
      parts.push(parsed.quantity.toString());
    } else {
      // Round to 2 decimal places
      parts.push(parsed.quantity.toFixed(2).replace(/\.?0+$/, ''));
    }
  }
  
  if (parsed.unit) {
    parts.push(parsed.unit);
  }
  
  parts.push(parsed.name);
  
  return parts.join(' ');
}
