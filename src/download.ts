import * as d from 'download';
import { createWriteStream } from 'fs';
import { SingleBar } from 'cli-progress';

export async function download(name: string, url: string, dist: string) {
  const data = d(url);

  const writer = createWriteStream(dist);
  let responsed = false;
  data.on('response', (res) => {
    const clk = Object.keys(res.headers).find(
      (k) => k.toLowerCase() === 'content-length'
    );
    if (clk) {
      if (responsed) return;
      responsed = true;
      const totalLength = Number(res.headers[clk]);
      let downloadedLength = 0;
      const bar = new SingleBar({
        format: `[{bar}] {percentage}% | ${name}`,
      });
      bar.start(100, 0);
      data.on('data', (chunk) => {
        downloadedLength += chunk.length;
        bar.update(downloadedLength / totalLength * 100);
      });
      data.on('end', () => {
        bar.stop();
      });
    }
  });
  data.pipe(writer);
  await data;
}
