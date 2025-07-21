#!/usr/bin/env bash
# apply_patches.sh
# Applies every *.patch from the ../patches directory onto the game submodule.
# Supports an optional --dry-run mode (only checks applicability).
# Directory layout (relative to repo root):
#   scripts/apply_patches.sh   ← this script (executed from repo root)
#   patches/                   ← patch files (0001-… .patch)
#   game/                      ← git submodule with the game's source

set -euo pipefail

############################################################
## 0. CLI parsing
############################################################
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    -n|--dry-run) DRY_RUN=true ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: $0 [--dry-run|-n]"
      exit 1
      ;;
  esac
done

############################################################
## 1. Resolve important paths
############################################################
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PATCH_DIR="${ROOT_DIR}/patches"
GAME_DIR="${ROOT_DIR}/game"

if [[ ! -d "${PATCH_DIR}" ]]; then
  echo "Patch directory not found: ${PATCH_DIR}"
  exit 1
fi
if ! git -C "${GAME_DIR}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Directory ${GAME_DIR} is not a valid git repository (submodule not initialised?)"
  exit 1
fi

############################################################
## 2. Make sure the submodule is on its recorded commit
############################################################
# Ensures we are working with the exact commit recorded in the parent repo.
git -C "${ROOT_DIR}" submodule update --init --checkout game

############################################################
## 3. Prepare a clean working tree
############################################################
cd "${GAME_DIR}"
git reset --hard                      # discard any previous attempt
git clean -fdx                        # remove untracked files
git checkout --detach                 # detach HEAD at the recorded commit

# Enable rerere to auto-reuse conflict resolutions
git config rerere.enabled true

############################################################
## 4. Apply / check each patch
############################################################
apply_patch() {
  local patch_file="$1"
  if [[ "${DRY_RUN}" == true ]]; then
    echo "[DRY-RUN] Checking ${patch_file}"
    git apply --check "${patch_file}"
  else
    echo "Applying ${patch_file}"
    git am --3way --rerere-autoupdate "${patch_file}"
  fi
}

shopt -s nullglob                     # avoid literal '*.patch' if none exist
for patch in "${PATCH_DIR}"/*.patch; do
  # Process patches in lexicographic order (0001, 0002, …)
  apply_patch "${patch}"
done
shopt -u nullglob

############################################################
## 5. Done
############################################################
if [[ "${DRY_RUN}" == true ]]; then
  echo "✅  All patches apply cleanly (dry-run)."
else
  echo "✅  Patch stack applied successfully."
fi
