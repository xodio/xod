import fs from 'fs';

export const rmDir = (dirPath, removeSelf = true) => {
  const files = fs.readdirSync(dirPath);

  if (files.length > 0) {
    files.forEach((file) => {
      const filePath = `${dirPath}/${file}`;
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      } else {
        rmDir(filePath);
      }
    });
  }
  if (removeSelf) {
    fs.rmdirSync(dirPath);
  }
};

export default {
  rmDir,
};
