import supabase from "../app/middlewares/supabaseClient";

export const uploadImageToSupabase = async (
  file: Express.Multer.File,
): Promise<string> => {
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.originalname.replace(/\s+/g, "-")}`;
  const filePath = `images/${fileName}`;

  const { data, error } = await supabase.storage
    .from("proflow")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    console.error("Supabase Upload Error:", error);
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("proflow")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};
