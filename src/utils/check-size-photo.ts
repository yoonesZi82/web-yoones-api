const checkSizePhoto = (file: Express.Multer.File) => {
  if (file.size > 1024 * 1024 * 1) {
    return false;
  } else {
    return true;
  }
};

export default checkSizePhoto;
