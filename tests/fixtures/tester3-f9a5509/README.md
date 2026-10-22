Review-only component snapshots from PR #33, commit f9a5509cbc98b5d6ab4c37e9a4210ca398a21045.

Original paths: src/components/merchant/media-card.tsx and video-guidelines-modal.tsx.
Git blob SHAs: e2bdf4a42317fcff10026135405d0821fb2488f2 and d47b35c5f8e88341bf8de9a738b3942e6eca8360.

These unchanged files preserve historical review evidence; runtime code no longer imports them.
After the local dev merge, LibraryClient and its development preview use canonical components under src/components/merchant.
The live /merchant/library page still blocks Media API reads pending backend authorization checks. PR #33's media-service change arrived through dev, without implying separate BE review or cloud verification.
