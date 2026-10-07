# Private attachments

Files are uploaded directly to Vercel Private Blob through a ten-minute, single-path PUT delegation. Pending objects are not served. Finalization verifies extension, byte size, magic bytes, and image decoding. Images are resized to 2048px and re-encoded as WebP without original EXIF. PDFs are download-only with nosniff and sandbox response headers; this is not antivirus scanning.

`FileAsset` stores metadata only. `Attachment` reuses `home_item_images`; old rows are retained without fabricated metadata and are not served by the new API until verified separately. SQL requires exactly one target. Marketplace reuse is explicit and only accepts an owned item photo. Removing one attachment retains a shared object until the last reference is removed.

Production: `zipgalpy-private-prod`; Preview: `zipgalpy-private-preview`. Both require `BLOB_STORE_ID`; Vercel SDK uses OIDC on deployments. Never copy Production credentials into Preview. Local integration tests require a separately verified Preview database and Preview Blob credentials/OIDC. Secret values pulled as `[SENSITIVE]` are not usable credentials.

Files attach after creating the parent record, from its detail screen; Home cover is managed in Home edit. Existing CRUD is unchanged.

## Release gate

Do not apply Production migration or push main until Preview tests pass: each target upload/read/delete, MIME spoofing, unauthenticated and second-user denial, marketplace member-only read and seller-only write, explicit item photo reuse, shared-object deletion behavior, and 375/390/430px browser inspection.

Parent cascade deletion removes attachments, not shared FileAsset objects. Orphan-object cleanup must be reviewed separately before release; never delete a shared marketplace file merely because its former HomeItem or account was deleted.
