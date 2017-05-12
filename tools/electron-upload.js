// eslint-disable-next-line import/no-extraneous-dependencies
const docopt = require('docopt');
const fs = require('fs');
const gcs = require('@google-cloud/storage');
const path = require('path');

const options = docopt.docopt(`
Uploads a release file to 'releases.xod.io' GCS bucket under tag directory.
Usage: electron-upload --config=<path-to-config> --file=<path-to-file> --tag=<tag>
`);
const resolve = path.resolve.bind(path, process.cwd());
const config = JSON.parse(fs.readFileSync(resolve(options['--config'])));
const file = resolve(options['--file']);
const tag = options['--tag'];
const basename = path.basename(file);

gcs(config).bucket('releases.xod.io')
  .upload(file, {
    destination: `${tag}/${basename}`,
    metadata: {
      contentDisposition: `attachment; filename="${basename}"`,
    },
    public: true,
  })
  .catch((error) => {
// eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
