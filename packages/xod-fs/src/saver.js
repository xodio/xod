import path from 'path';
import fileSave from 'file-save';

export default (data, pathToWorkspace, onFinish = () => {}, onError = () => {}) => {
  const streams = [];
  let streamsFinished = 0;

  const saveData = (file) => {
    const filePath = path.resolve(pathToWorkspace, file.path);
    const fstream = fileSave(filePath)
      .write(JSON.stringify(file.content), 'utf8')
      .end();

    fstream.finish(() => {
      streamsFinished += 1;

      if (streams.length === streamsFinished) {
        onFinish();
      }
    });
    fstream.error(onError);

    streams.push(fstream);
  };

  if (data instanceof Array) {
    data.forEach(saveData);
  }

  if (
    typeof data === 'object' &&
    Object.hasOwnProperty.call(data, 'path') &&
    Object.hasOwnProperty.call(data, 'content')
  ) {
    saveData(data);
  }

  return streams;
};
