#!/usr/bin/env node
import { writeSealedFromDisk, resetMutationRepo } from "./observe-fs.mjs";

if (process.argv.includes("--write-sealed")) {
  writeSealedFromDisk();
  console.log("reset-mutation-fixture: wrote evaluator/private/t6-sealed.json");
} else {
  resetMutationRepo();
  console.log("reset-mutation-fixture: restored fixtures/mutation-repo from sealed bytes");
}
