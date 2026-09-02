import { formatAccountId } from "../utils/ids.js";
import { resolveRandom } from "../utils/random.js";
import { assertCount } from "../validation/assertions.js";
import { MAX_ACCOUNTS } from "./limits.js";

export function generateAccounts(count, options = {}) {
  const total = assertCount(count ?? 0, {
    fieldName: "accounts",
    max: MAX_ACCOUNTS
  });
  const flaggedRatio = options.flaggedRatio ?? 0;
  const random = resolveRandom(options);

  return Array.from({ length: total }, (_, index) => ({
    id: formatAccountId(index + 1),
    flagged: random() < flaggedRatio
  }));
}
