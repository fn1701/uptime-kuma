import { buildDist, buildImage, checkDocker, getRepoNames } from "./lib.mjs";

// Fork-specific: build and push the "release" target to GHCR only, tagged by
// branch and branch+commit, so every push produces a testable image without
// going through upstream's full version-bump/changelog release process.
// See .github/workflows/build-push-ghcr.yml (based on release-nightly.yml).
const repoNames = getRepoNames();

const branchTag = process.env.RELEASE_BRANCH_TAG;
const commitTag = process.env.RELEASE_COMMIT_TAG;
// Set only when this run was triggered by a version tag push (e.g. "2.5.5"),
// so a matching image tag gets published instead of the branch/commit ones
// (which would otherwise just duplicate the version tag).
const versionTag = process.env.RELEASE_VERSION_TAG;

if (!branchTag || !commitTag) {
    console.error("RELEASE_BRANCH_TAG and RELEASE_COMMIT_TAG must be set.");
    process.exit(1);
}

const tags = versionTag ? [ versionTag ] : [ branchTag, commitTag ];

// Check if docker is running
checkDocker();

// Build frontend dist (it will build on the host machine, TODO: build on a container?)
buildDist();

// Build full image, tagged with the version (on a version tag push) or
// otherwise the branch name and branch+commit.
// amd64 only (unlike upstream's multi-arch nightly): this runs on every push
// for fast feedback on the patch, not as a public multi-arch release.
buildImage(repoNames, tags, "release", "", "docker/dockerfile", "linux/amd64");
