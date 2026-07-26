# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Git workflow: no pull requests

This is a solo project. Ship finished branches by fast-forwarding straight into `master` and pushing — do not open a GitHub pull request and wait for it to be merged. It's fine to do work in a branch/worktree as usual; once a change is committed and verified, push it directly to `master` instead (e.g. `git push origin <branch>:master`, after confirming a clean fast-forward with `git merge-base --is-ancestor origin/master HEAD`). If `master` has diverged (not a fast-forward), stop and ask rather than force-pushing or merging around the conflict.
