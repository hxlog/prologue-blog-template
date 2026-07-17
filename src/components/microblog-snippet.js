import fs from 'fs';
import path from 'path';
import { load } from 'js-yaml';
import moment from 'moment';
import Link from 'next/link';

export default function MicroblogSnippet() {
  const filePath = path.join(process.cwd(), 'data', 'microblog.yaml');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const microblogs = load(fileContent)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="max-w-2xl mx-auto pt-6">
      <h2 className="font-semibold prose-h2 pt-4">微博</h2>
      {microblogs.map((microblog, index) => (
        <div key={`${microblog.date}-${index}`} className="my-4 last:mb-0 ">
          <time className="text-sm text-zinc-500 dark:text-zinc-400">
            {moment(microblog.date).format("YY MMM DD")}
          </time>
          <p className="text-sm text-zinc-800 dark:text-zinc-300 mt-2 leading-7">{microblog.content}</p>
        </div>
      ))}
            <Link href="/microblog" passHref>
        <p className="text-right text-sm pt-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline transition duration-400">
          阅读更多 →
        </p>
      </Link>
    </div>
  );
}