import { asyncHandler } from "../utils/asyncHandler";
import { assertPublicHttpUrl } from "../utils/ssrfGuard";

export const blockUnsafeUrls = asyncHandler(async (req, _res, next) => {
  await assertPublicHttpUrl(req.body.url);
  next();
});