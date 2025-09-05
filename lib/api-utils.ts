import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

/**
 * Standardized API error handler
 */
export function handleApiError(error: unknown, context: string): NextResponse<ApiResponse> {
  console.error(`Error in ${context}:`, error);
  
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('Record to delete does not exist') || 
        error.message.includes('Record to update not found')) {
      return NextResponse.json({ 
        error: "Resource not found" 
      }, { status: 404 });
    }
    
    if (error.message.includes('Unique constraint')) {
      return NextResponse.json({ 
        error: "Resource already exists" 
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: `Failed to ${context.toLowerCase()}` 
    }, { status: 500 });
  }
  
  return NextResponse.json({ 
    error: "An unexpected error occurred" 
  }, { status: 500 });
}

/**
 * Standardized API success response
 */
export function createSuccessResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message
  });
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  data: Record<string, unknown>, 
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(field => 
    !data[field] || (typeof data[field] === 'string' && data[field].trim() === '')
  );
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(missingFields: string[]): NextResponse<ApiResponse> {
  return NextResponse.json({
    error: `Missing required fields: ${missingFields.join(', ')}`
  }, { status: 400 });
}

/**
 * Safe JSON parsing with error handling
 */
export async function safeJsonParse<T>(request: Request): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await request.json();
    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Invalid JSON' 
    };
  }
}

/**
 * Extract search parameters safely
 */
export function extractSearchParams(request: Request, requiredParams: string[]): {
  params: Record<string, string>;
  missingParams: string[];
} {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};
  const missingParams: string[] = [];
  
  for (const param of requiredParams) {
    const value = searchParams.get(param);
    if (value) {
      params[param] = value;
    } else {
      missingParams.push(param);
    }
  }
  
  return { params, missingParams };
}

/**
 * Create pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function createPaginationMeta(
  page: number, 
  limit: number, 
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

/**
 * Rate limiting helper (simple in-memory implementation)
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const userRequests = this.requests.get(key) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return true;
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Environment variable validation
 */
export function validateEnvVars(requiredVars: string[]): { isValid: boolean; missing: string[] } {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  return {
    isValid: missing.length === 0,
    missing
  };
}
