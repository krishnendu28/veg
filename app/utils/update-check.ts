import Constants from "expo-constants";

type GithubRelease = {
  tag_name?: string;
  html_url?: string;
  draft?: boolean;
  prerelease?: boolean;
};

const DEFAULT_GITHUB_REPO = "mayankfhacker/chakhna-by-kilo";

function normalizeVersion(input: string | undefined | null): number[] {
  const raw = String(input || "").trim().replace(/^v/i, "");
  if (!raw) return [0, 0, 0];

  const segments = raw
    .split(/[.-]/)
    .map((part) => Number.parseInt(part, 10))
    .filter((value) => Number.isFinite(value));

  return [segments[0] || 0, segments[1] || 0, segments[2] || 0];
}

function isRemoteNewer(remote: string, local: string): boolean {
  const [rMaj, rMin, rPatch] = normalizeVersion(remote);
  const [lMaj, lMin, lPatch] = normalizeVersion(local);

  if (rMaj !== lMaj) return rMaj > lMaj;
  if (rMin !== lMin) return rMin > lMin;
  return rPatch > lPatch;
}

function getCurrentAppVersion(): string {
  const fromExpoConfig = Constants.expoConfig?.version;
  if (typeof fromExpoConfig === "string" && fromExpoConfig.trim()) return fromExpoConfig;

  const fromManifest2 = (Constants as unknown as { manifest2?: { extra?: { expoClient?: { version?: string } } } })
    .manifest2?.extra?.expoClient?.version;
  if (typeof fromManifest2 === "string" && fromManifest2.trim()) return fromManifest2;

  const fromNative = Constants.nativeAppVersion;
  if (typeof fromNative === "string" && fromNative.trim()) return fromNative;

  return "0.0.0";
}

export async function checkForGithubReleaseUpdate(): Promise<{
  hasUpdate: boolean;
  latestTag: string;
  releasePageUrl: string;
}> {
  const repo = String(process.env.EXPO_PUBLIC_GITHUB_REPO || DEFAULT_GITHUB_REPO).trim();
  if (!repo || !repo.includes("/")) {
    return {
      hasUpdate: false,
      latestTag: "",
      releasePageUrl: "",
    };
  }

  const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to check updates (HTTP ${response.status})`);
  }

  const latest = (await response.json()) as GithubRelease;
  const latestTag = String(latest.tag_name || "").trim();
  const releasePageUrl =
    String(latest.html_url || "").trim() || `https://github.com/${repo}/releases/latest`;

  if (!latestTag || latest.draft || latest.prerelease) {
    return {
      hasUpdate: false,
      latestTag,
      releasePageUrl,
    };
  }

  const currentVersion = getCurrentAppVersion();
  const hasUpdate = isRemoteNewer(latestTag, currentVersion);

  return {
    hasUpdate,
    latestTag,
    releasePageUrl,
  };
}
