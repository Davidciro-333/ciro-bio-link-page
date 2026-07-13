export const prerender = false;

const USERNAME = import.meta.env.GITHUB_USERNAME || 'Davidciro-333';
// Token opcional: sin él la API pública de GitHub permite ~60 req/h por IP.
// Con un token (sin scopes / solo public_repo basta) sube a ~5000 req/h.
const TOKEN = import.meta.env.GITHUB_TOKEN;

interface GitHubRepo {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  fork: boolean;
}

interface GitHubProfile {
  public_repos: number;
  followers: number;
}

export async function GET() {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'bio-link',
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  try {
    const [reposRes, profileRes] = await Promise.all([
      fetch(
        `https://api.github.com/users/${USERNAME}/repos?sort=pushed&per_page=20&type=owner`,
        { headers }
      ),
      fetch(`https://api.github.com/users/${USERNAME}`, { headers }),
    ]);

    if (!reposRes.ok) {
      return new Response(JSON.stringify({ repos: [], profile: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const reposRaw: GitHubRepo[] = await reposRes.json();
    const profileRaw: GitHubProfile | null = profileRes.ok
      ? await profileRes.json()
      : null;

    const repos = reposRaw
      .filter((r) => !r.fork)
      .slice(0, 5)
      .map((r) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        url: r.html_url,
        pushedAt: r.pushed_at,
      }));

    const profile = profileRaw
      ? { publicRepos: profileRaw.public_repos, followers: profileRaw.followers }
      : null;

    return new Response(JSON.stringify({ repos, profile }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch' }), { status: 500 });
  }
}
