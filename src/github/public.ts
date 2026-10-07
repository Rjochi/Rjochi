export interface PublicRepositoryTarget {
  projectId: string;
  owner: string;
  name: string;
  branch: string;
}

export interface PublicRepositorySnapshot {
  schemaVersion: 1;
  asOfDateUtc: string;
  repositories: ReadonlyArray<{
    projectId: string;
    publicRepositoryUrl: string;
    branch: string;
    headSha: string;
    headUrl: string;
    headCommittedAt: string;
    visibilityChecked: true;
  }>;
}

interface RepositoryResponse {
  private?: boolean;
  visibility?: string;
  html_url?: string;
}

interface CommitResponse {
  sha?: string;
  html_url?: string;
  commit?: { author?: { date?: string } };
}

export async function fetchPublicSnapshot(
  targets: readonly PublicRepositoryTarget[],
  asOfDateUtc: string,
  request: typeof fetch = fetch,
): Promise<PublicRepositorySnapshot> {
  const repositories = [];
  for (const target of targets) {
    const baseUrl = `https://api.github.com/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(target.name)}`;
    const repositoryResponse = await request(baseUrl, { headers: { Accept: "application/vnd.github+json" } });
    if (!repositoryResponse.ok) throw new Error(`Public repository check failed for ${target.projectId}: HTTP ${repositoryResponse.status}`);
    const repository = await repositoryResponse.json() as RepositoryResponse;
    if (repository.private === true || repository.visibility === "private" || typeof repository.html_url !== "string") {
      throw new Error(`Repository is not publicly verifiable: ${target.projectId}`);
    }

    const commitUrl = `${baseUrl}/commits/${encodeURIComponent(target.branch)}`;
    const commitResponse = await request(commitUrl, { headers: { Accept: "application/vnd.github+json" } });
    if (!commitResponse.ok) throw new Error(`Public commit check failed for ${target.projectId}: HTTP ${commitResponse.status}`);
    const commit = await commitResponse.json() as CommitResponse;
    if (typeof commit.sha !== "string" || typeof commit.html_url !== "string" || typeof commit.commit?.author?.date !== "string") {
      throw new Error(`Incomplete public commit response: ${target.projectId}`);
    }

    repositories.push({
      projectId: target.projectId,
      publicRepositoryUrl: repository.html_url,
      branch: target.branch,
      headSha: commit.sha,
      headUrl: commit.html_url,
      headCommittedAt: commit.commit.author.date,
      visibilityChecked: true as const,
    });
  }

  return { schemaVersion: 1, asOfDateUtc, repositories };
}