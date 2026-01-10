import { z } from 'zod';
import { insertRecipeSchema, insertMealSchema, insertGroceryItemSchema, recipes, meals, groceryItems } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  // Recipes
  recipes: {
    list: {
      method: 'GET' as const,
      path: '/api/recipes',
      responses: {
        200: z.array(z.custom<typeof recipes.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/recipes',
      input: insertRecipeSchema,
      responses: {
        201: z.custom<typeof recipes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/recipes/:id',
      input: insertRecipeSchema.partial(),
      responses: {
        200: z.custom<typeof recipes.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/recipes/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  // Meals
  meals: {
    list: {
      method: 'GET' as const,
      path: '/api/meals',
      responses: {
        200: z.array(z.custom<typeof meals.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/meals',
      input: insertMealSchema,
      responses: {
        201: z.custom<typeof meals.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/meals/:id',
      input: insertMealSchema.partial(),
      responses: {
        200: z.custom<typeof meals.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/meals/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  // Grocery List
  grocery: {
    list: {
      method: 'GET' as const,
      path: '/api/grocery',
      responses: {
        200: z.array(z.custom<typeof groceryItems.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/grocery',
      input: insertGroceryItemSchema,
      responses: {
        201: z.custom<typeof groceryItems.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/grocery/:id',
      input: insertGroceryItemSchema.partial(),
      responses: {
        200: z.custom<typeof groceryItems.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/grocery/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
