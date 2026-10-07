# Product label OCR

Tesseract.js 7 and its Korean/English integer language models are self-hosted under `/ocr`, generated from npm dependencies before build. No uploaded pixels or recognized raw text are sent to an external AI provider. Language models may be cached in the browser; recognition results are kept in component state only.

Recognition is optional. Labelled manufacturer, product name, model, serial number and full valid manufacturing dates are extracted using conservative rules; incomplete/low-confidence output remains blank. Categories are suggestions based only on a clearly labelled product name. The score returned by OCR is not a calibrated field-accuracy percentage. Reflective/blurred/rotated/tiny text and alternative layouts may fail. Manual editing remains available.

The review panel does not submit or save data. A user explicitly applies edited suggestions, checks the normal form and saves it. Existing nonempty inputs require overwrite confirmation. Manufacturing date and serial number are private nullable item fields. After successful item save the selected image is attached through the existing authorized Private Blob flow. An attachment failure does not create a second item: the saved item link and photo-only retry are offered.

No generative AI API or paid OCR service is enabled. Normal Blob storage/operation/transfer and hosting charges may apply under the existing plans; browser OCR consumes device CPU, memory and model-download bandwidth. A provider interface separates recognition from item CRUD for future opt-in helpers.

Sources: https://github.com/naptha/tesseract.js (Apache-2.0), https://github.com/naptha/tesseract.js-core (Apache-2.0), https://github.com/naptha/tessdata (language assets). Package versions are locked in pnpm-lock.yaml. Build scripts do not download models from a runtime CDN.

Release requires Preview browser recognition/review/manual-fallback tests, API validation/storage/ownership tests, mobile inspection, and additive migration verification. A generated label test is not a substitute for accuracy testing on representative real product labels.
