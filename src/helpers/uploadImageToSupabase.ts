import supabase from "../app/middlewares/supabaseClient";

export const uploadImageToSupabase = async (
  file: Express.Multer.File,
): Promise<string> => {
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.originalname.replace(/\s+/g, "-")}`;
  const filePath = `proflow/images/${fileName}`;

  const { data, error } = await supabase.storage
    .from("attachments")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    throw new Error("Image upload failed");
  }

  const { data: publicUrlData } = supabase.storage
    .from("attachments")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};
