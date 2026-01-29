import { NextFunction, Request, Response } from "express";
import { uploadFileToSupabase } from "../../helpers/uploadFileToSupabase";
import { uploadImageToSupabase } from "../../helpers/uploadImageToSupabase";

export const fileUploadHandler = (fieldName: string, type: 'image' | 'file' = 'image') => {
        
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next();
    }

    try {
      let publicUrl: string;
      if (type === 'image') {
         publicUrl = await uploadImageToSupabase(req.file);
       
      } else {
         publicUrl = await uploadFileToSupabase(req.file);
         
      }
      
      // Attach to body as if it was sent in JSON
      req.body[fieldName] = publicUrl;
      
      // Also handle if body data was sent as stringified JSON under 'data' field (common in multipart)
      if (req.body.data) {
        try {
           const parsedData = JSON.parse(req.body.data);
           req.body = { ...parsedData, [fieldName]: publicUrl };
        } catch (e) {
           // If not valid JSON, just keep req.body as is + url
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
