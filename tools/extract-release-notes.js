const stream = require('stream');

class Transform extends stream.Transform {
  constructor(f) {
    super({
      objectMode: true,
      transform(chunk, encoding, cb) {
        try {
          for (const x of f(chunk, encoding)) this.push(x);
          cb();
        } catch (err) {
          cb(err);
        }
      },
    });
  }
}

const releases = new Transform(function* f1(line) {
  const match = line.match(/^\s*<a name="(.+?)"><\/a>\s*$/);
  if (match) {
    if (this.release) yield this.release;
    this.release = { content: line, tag: match[1] };
  } else if (this.release) {
    this.release.content += line;
  }
});

process.stdin
  .pipe(new Transform(function* f2(stdin) {
    for (const line of stdin.toString().trim().split(/$/m)) {
      yield line;
    }
  }))
  .on('finish', () => {
    releases.write('<a name="TERMINAL"></a>');
  })
  .pipe(releases)
  .pipe(new Transform(function* f3(release) {
    if (release.tag === process.argv[2]) {
      yield `${release.content.trim()}\n`;
    }
  }))
  .pipe(process.stdout);
