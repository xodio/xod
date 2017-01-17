import doc from 'xod-doc';
import * as msg from './messages';

export default (outputDir, templatesDir, projectDir, programm) => {
  doc(outputDir, templatesDir, projectDir, programm.clear)
    .then(() => {
      msg.success(`Packed project successfully written into ${outputDir}`);
    })
    .catch((err) => {
      msg.error(err);
      process.exit(1);
    });
};
