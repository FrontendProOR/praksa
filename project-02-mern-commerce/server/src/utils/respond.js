/**
 * Response envelope helpers.
 *
 * Every successful response has the same shape:
 *   { success: true, data: <payload>, meta?: <pagination or extra info> }
 */

export function sendSuccess(res, statusCode, data, meta) {
  const body = { success: true, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
}

export const sendOk = (res, data, meta) => sendSuccess(res, 200, data, meta);
export const sendCreated = (res, data) => sendSuccess(res, 201, data);
