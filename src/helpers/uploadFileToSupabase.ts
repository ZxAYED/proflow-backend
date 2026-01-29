import supabase from "../app/middlewares/supabaseClient";

export const uploadFileToSupabase = async (
  file: Express.Multer.File,
): Promise<string> => {
  const timestamp = Date.now();
  // Sanitize filename to avoid issues with special characters
  const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `${timestamp}-${sanitizedOriginalName}`;
  const filePath = `proflow/submissions/${fileName}`;

  const { data, error } = await supabase.storage
    .from("attachments")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("attachments")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};
