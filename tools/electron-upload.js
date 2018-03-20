// eslint-disable-next-line import/no-extraneous-dependencies
const docopt = require('docopt');
const path = require('path');
const storage = require('@google-cloud/storage');

const options = docopt.docopt(`
Uploads a release file to 'releases.xod.io' GCS bucket under tag directory.
Usage: electron-upload --config=<path-to-config> --file=<path-to-file> --tag=<tag>
`);
const resolve = path.resolve.bind(path, process.cwd());
const keyFilename = resolve(options['--config']);
const file = resolve(options['--file']);
const tag = options['--tag'];
const basename = path.basename(file);

storage({ keyFilename })
  .bucket('releases.xod.io')
  .upload(file, {
    destination: `${tag}/${basename}`,
    metadata: {
      contentDisposition: `attachment; filename="${basename}"`,
    },
    public: true,
  })
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
