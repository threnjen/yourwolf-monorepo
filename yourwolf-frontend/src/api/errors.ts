/**
 * Readers for the two error bodies the API produces.
 *
 * FastAPI answers a schema violation with a pydantic 422 whose `detail` is an
 * array of per-field entries, while the app's own domain handlers answer 400/403/404
 * with a plain string `detail`. Callers that only understand one of these shapes end
 * up showing an infrastructure-flavoured fallback ("service unavailable") for what is
 * really a fixable input mistake, so both shapes are read here in one place.
 */

/** One entry of a pydantic 422 `detail` array. */
interface ValidationDetail {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Pulls the response body off an axios-style rejection, if there is one. */
function getResponseData(error: unknown): unknown {
  if (!isRecord(error)) {
    return undefined;
  }
  const response = error.response;
  return isRecord(response) ? response.data : undefined;
}

/**
 * Renders one detail entry as `field: message`.
 *
 * `loc` is prefixed with the request part ("body", "query", ...), which is noise to
 * a user, so it is dropped; what remains is the dotted path to the offending field.
 */
function formatDetail(detail: ValidationDetail): string | null {
  const message = typeof detail.msg === 'string' ? detail.msg.trim() : '';
  if (!message) {
    return null;
  }

  const field = Array.isArray(detail.loc) ? detail.loc.slice(1).join('.') : '';
  return field ? `${field}: ${message}` : message;
}

/**
 * Extracts user-facing messages from an API rejection.
 *
 * Returns `null` when the error carries no usable server message — a network
 * failure, a 5xx, or an unrecognised body — leaving the caller to supply its own
 * fallback. A non-null result is always a non-empty list.
 */
export function extractApiErrorMessages(error: unknown): string[] | null {
  const data = getResponseData(error);
  if (!isRecord(data)) {
    return null;
  }

  const detail = data.detail;

  // Domain errors (400/403/404): `{"detail": "Role is locked"}`.
  if (typeof detail === 'string') {
    const message = detail.trim();
    return message ? [message] : null;
  }

  // Schema errors (422): `{"detail": [{loc, msg, type}, ...]}`.
  if (Array.isArray(detail)) {
    const messages = detail
      .filter(isRecord)
      .map((entry) => formatDetail(entry as ValidationDetail))
      .filter((message): message is string => message !== null);
    return messages.length > 0 ? messages : null;
  }

  return null;
}
