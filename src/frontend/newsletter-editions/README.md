# Hidden newsletter editions

This directory is denied by the static-file middleware. Files become reachable
only through their exact `/newsletter/<date>-<slug>-<profile>` route after a
human-approved manifest lists a complete `equilibre`, `finance`, and `tech`
triplet and pins every full HTML document by SHA-256.

The empty manifest activates no public edition. Adding real content and
deploying it are separate publication actions.
