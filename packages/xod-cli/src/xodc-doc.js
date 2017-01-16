import * as msg from './messages';

import doc from 'xod-doc';

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
