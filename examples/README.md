# 90-second demo: from a document to a sealed record

This demo uses only synthetic text. It shows the smallest end-to-end path that
`research_doctor` can then verify.

1. Install the suite (see the main README) and start a session in this
   workspace.
2. Anchor the sample document:

   ```text
   Use doc_anchor on examples/sample.md.
   ```

   Copy the returned `evidenceId`.
3. Check one claim against that evidence:

   ```text
   Use claim_check with claim "The pilot enrolled 24 participants."
   and the evidenceId from step 2.
   ```

   The verdict should be `supported`; the sentence is verbatim in the sample.
4. Assemble a sealed report:

   ```text
   Use research_report with that evidenceId and the claim.
   ```

   Copy the `recordPath`.
5. Verify and inspect:

   ```sh
   dsh-rep-verify <recordPath>
   ```

   ```text
   Run research_doctor.
   ```

   A healthy result is `research_doctor: ok`, `researchEvidence=on`,
   `researchReport=on`, and `latest <file> (sealed)`.

If the doctor says the root does not exist, the tools ran in a different
working directory: pass the absolute path as `root`.
