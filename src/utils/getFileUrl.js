/**
 * Generates a full URL for an uploaded file
 * @param {Object} req - Express request object
 * @param {string} folder - Subfolder name (e.g., 'car-photos', 'driver-photos')
 * @param {string} filename - The name of the file
 * @returns {string} - The full URL
 */
export const getFileUrl = (req, folder, filename) => {
  if (!filename) return null;
  const protocol = req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}/public/uploads/${folder}/${filename}`;
};
