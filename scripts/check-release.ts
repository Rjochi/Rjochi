import { loadContent } from "../src/content/load";

if (process.env.PROFILE_MODE !== "release") {
  console.log("Release check skipped: set PROFILE_MODE=release to run it.");
} else {
  loadContent("release");
  console.log("Release content passed validation.");
}