// Swedish ingredient parsing and normalization utilities

// Pantry staples that should be excluded from grocery list
export const PANTRY_STAPLES = [
  // Salt & pepper
  'salt', 'peppar', 'svartpeppar', 'vitpeppar', 'pepper', 'black pepper', 'white pepper',
  // Oils & fats for cooking
  'olja', 'olivolja', 'rapsolja', 'solrosolja', 'matolja', 'vegetabilisk olja',
  'oil', 'olive oil', 'vegetable oil', 'cooking oil',
  'smör', 'butter', 'margarin', 'matfett',
  // Common cooking items
  'vatten', 'water', 'is', 'ice',
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
  'salladslök': 'salladslök',
  // Potato variants
  'kokt potatis': 'potatis',
  'mjölig potatis': 'potatis',
  'fast potatis': 'potatis',
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

// Parse quantity from start of string (handles fractions and decimals)
function parseQuantity(text: string): { quantity: number; remaining: string } {
  const trimmed = text.trim();
  
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
    // Remove common prefixes/suffixes
    .replace(/^(färsk|färska|finhackad|hackad|hackade|riven|rivna|skivad|skivade|tärnad|tärnade|strimlad|strimlade|krossad|krossade|mosad|mosade|kokt|kokta|stekt|stekta|grillad|grillade|rökt|rökta|saltad|saltade)\s+/gi, '')
    .replace(/\s+(färsk|färska|finhackad|hackad|hackade|riven|rivna|skivad|skivade)$/gi, '')
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
  
  // Check synonyms
  normalized = INGREDIENT_SYNONYMS[normalized] || normalized;
  
  return normalized;
}

// Check if ingredient is a pantry staple
export function isPantryStaple(ingredientText: string): boolean {
  const lower = ingredientText.toLowerCase();
  
  // Check for exact matches and partial matches
  for (const staple of PANTRY_STAPLES) {
    if (lower.includes(staple)) return true;
  }
  
  // Check for cooking oil/fat phrases
  if (/\b(steka|stekning|stek)\b/i.test(lower)) return true;
  
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
  
  for (const ing of ingredients) {
    // Key by normalized name + unit
    const key = `${ing.normalizedName}|${ing.unit || ''}`;
    
    if (aggregated.has(key)) {
      const existing = aggregated.get(key)!;
      existing.quantity += ing.quantity;
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
