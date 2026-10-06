import json
import logging
from datetime import datetime, timezone


logger = logging.getLogger("techkart.audit")


def audit_event(
    event: str,
    *,
    method: str,
    path: str,
    status_code: int,
    actor_id: int | None = None,
    client_ip: str | None = None,
) -> None:
    """Write a redacted, structured audit event without request bodies or secrets."""
    logger.info(
        json.dumps(
            {
                "event": event,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "method": method,
                "path": path,
                "status_code": status_code,
                "actor_id": actor_id,
                "client_ip": client_ip,
            },
            separators=(",", ":"),
        )
    )
