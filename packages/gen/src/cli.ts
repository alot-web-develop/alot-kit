#!/usr/bin/env node
import { runCli } from "./run.js";

const args = process.argv.slice(2);
process.exitCode =
  args[0] === "api-contracts"
    ? await import("./api-contracts.js").then(({ runContractsCli }) =>
        runContractsCli(args.slice(1)),
      )
    : runCli(args, {
        cwd: process.cwd(),
        out: (line) => console.log(line),
        err: (line) => console.error(line),
      });
