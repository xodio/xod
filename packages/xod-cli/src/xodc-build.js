import { error, success } from './messages';

export default function build(file, board) {
  success(`file=${file}, board=${board}`)
    .then(() => {
      success(`Built ${file} for ${board}`);
    })
    .catch((err) => {
      error(err);
      process.exit(1);
    });
}
