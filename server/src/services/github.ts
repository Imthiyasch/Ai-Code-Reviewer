import axios from 'axios';

const GITHUB_API = 'https://api.github.com';
const headers: Record<string, string> = {
  Accept: 'application/vnd.github.v3+json',
};
if (process.env.GITHUB_TOKEN) {
  headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) throw new Error('Invalid URL');
    return { owner: parts[0], repo: parts[1] };
  } catch {
    throw new Error('Invalid GitHub URL. Expected: https://github.com/owner/repo');
  }
}

export interface GitHubFile {
  path: string;
  type: 'blob' | 'tree';
  size: number;
  sha: string;
}

export async function getFileTree(
  owner: string,
  repo: string
): Promise<GitHubFile[]> {
  try {
    const res = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
      { headers }
    );
    return (res.data.tree as GitHubFile[]).filter(
      (f) => f.type === 'blob' && f.size < 500000
    );
  } catch (err: any) {
    if (err.response?.status === 404) {
      throw new Error('Repository not found or is private.');
    }
    if (err.response?.status === 403 || err.response?.status === 429) {
      throw new Error(
        'GitHub rate limit reached. Try again in a minute, or paste your code directly.'
      );
    }
    throw new Error('Failed to fetch repository file tree.');
  }
}

export async function getFileContent(
  owner: string,
  repo: string,
  filePath: string
): Promise<string> {
  try {
    const res = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}`,
      { headers }
    );
    const content: string = res.data.content;
    return Buffer.from(content.replace(/\n/g, ''), 'base64').toString('utf-8');
  } catch (err: any) {
    if (err.response?.status === 404) {
      throw new Error(`File not found: ${filePath}`);
    }
    throw new Error(`Failed to fetch file: ${filePath}`);
  }
}
