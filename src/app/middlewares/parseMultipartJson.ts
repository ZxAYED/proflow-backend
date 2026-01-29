import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to parse JSON string in 'data' field of multipart/form-data
 * This is useful when sending { data: JSON.stringify(payload), file: File }
 */
export const parseMultipartJson = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && req.body.data) {
    try {
      const parsedData = JSON.parse(req.body.data);
      req.body = { ...req.body, ...parsedData };
      
      // Remove the original stringified data field to avoid confusion
      // and ensure validation schemas don't fail on unexpected fields if they are strict
      delete req.body.data;
      
    } catch (error) {
      // If parsing fails, we can either ignore it or throw an error.
      // Throwing an error is safer for API consistency.
      return next(new Error("Invalid JSON format in 'data' field"));
    }
  }
  next();
};
