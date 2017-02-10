import { error, success } from './messages';

export default function upload(file, board, port) {
  success(`file=${file}, board=${board}, port=${port}`)
    .then(() => {
      success(`Uploaded ${file} to ${board} on ${port}`);
    })
    .catch((err) => {
      error(err);
      process.exit(1);
    });
}
